"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
import re
import datetime
from flask import current_app
from cdw.models import *
from mongoengine import Q
from social import ConnectionService, ConnectionNotFoundError
from werkzeug.local import LocalProxy

cdw = LocalProxy(lambda: current_app.cdw)
settings = LocalProxy(lambda: current_app.settings)
connection_service = LocalProxy(lambda: current_app.connection_service)

def init(app):
    app.cdw = CDWService()
    app.settings = SettingsService()
    app.connection_service = MongoConnectionService()

class EntityNotFoundException(Exception):
    def __init__(self, entity_name, fields):
        Exception.__init__(self, "Could not find %s where: %s" % 
                           (entity_name, fields))
        
class FieldNotFoundException(Exception):
    def __init__(self, entity_name, field_name):
        Exception.__init__(self, "%s missing '%s' field" % 
                           (entity_name, field_name))
        
class MongoengineService(object):
    """Base service class for MongoEngine model classes. Includes some
    convenience methods for retrieving documents
    """
    def __init__(self, entityClazz):
        self.clazz = entityClazz
    
    def all(self):
        return self.clazz.objects.all()
    
    def with_id(self, id):
        try:
            result = self.clazz.objects.with_id(id)
            if result: return result
        except:
            pass
        
        raise EntityNotFoundException(self.clazz.__name__, {"id":id})
    
    def with_fields(self, **fields):
        return self.clazz.objects(**fields)
    
    def with_fields_first(self, **fields):
        result = self.with_fields(**fields).first()
        if result: return result
        raise EntityNotFoundException(self.clazz.__name__, fields)
    
    def save(self, entity):
        now = datetime.datetime.utcnow()
        if entity.is_new():
            entity.created = now
        entity.modified = now
        entity.save()
        return entity
    
    def __getattr__(self, name):
        if not name.startswith("with_"):
            raise AttributeError(name)
        
        field = name[len("with_"):]
        
        if not hasattr(self.clazz, field):
            raise FieldNotFoundException(self.clazz.__name__, field)
        
        return lambda value: self.with_fields_first(**{field: value})
    
class CDWService(object):
    """Main application service. Includes unique logic for saving, updating, 
    and retrieving documents
    """
    def __init__(self):
        self.users = MongoengineService(User)
        self.categories = MongoengineService(Category)
        self.questions = MongoengineService(Question)
        self.threads = MongoengineService(Thread)
        self.posts = MongoengineService(Post)
        self.phoneverifications = MongoengineService(PhoneVerificationAttempt)
        self.suggestions = MongoengineService(SuggestedQuestion)
    
    # To act as user service for Auth
    def get_user_with_id(self, id):
        result = self.users.with_id(id) 
        return result
    
    # To act as user service for Auth
    def get_user_with_username(self, username):
        try: return self.users.with_username(username)
        except: return self.users.with_email(username)
    
    def create_thread(self, question, post, 
                      follow_sms=False, follow_email=False):
        
        thread = self.threads.save(Thread(question=question))
        post.thread = thread
        
        self.check_graylist(post)
        self.posts.save(post)
        
        thread.firstPost = post
        thread.yesNo = post.yesNo
        thread.postCount = 1
        thread.origin = post.origin
        thread.flags = post.flags
        thread.save()
        
        if follow_sms:
            current_app.cdwapi.start_sms_updates(post.author, thread)
        
        if follow_email:
            thread.emailSubscribers.append(post.author)
        
        return thread
    
    def delete_thread(self, thread):
        self.posts.with_thread(thread).delete()
        thread.delete()
    
    def post_to_thread(self, thread, post, follow_sms=False, follow_email=False):
        current_app.logger.debug('posting to thread: Thread(%s)' % thread.id)
        
        post.thread = thread
        self.check_graylist(post)
        self.posts.save(post)
        
        thread.postCount += 1
        thread.save()
        
        notification = "%s said: %s" % (post.author.username, post.text)
        
        if follow_sms: 
            current_app.cdwapi.start_sms_updates(post.author, thread)
           
        if follow_email:
            if post.author not in thread.emailSubscribers:
                thread.emailSubscribers.append(post.author)
                self.threads.save(thread)
            else:
                current_app.logger.debug('user already subscribed')
        
        exclude = [post.author.phoneNumber]
        current_app.cdwapi.notify_sms_subscribers(thread, exclude, notification)
        
        exclude = [post.author.email]
        current_app.cdwapi.notify_email_subscribers(thread, exclude, notification)
        
        return post
    
    def delete_post(self, post):
        post.delete()
        
    def register_website_user(self, username, email, password, phonenumber):
        user = User(username=username, 
                    email=email, 
                    origin="web",
                    password=current_app.password_encryptor.encrypt(password),
                    phoneNumber=phonenumber)
        self.users.save(user)
        return user
    
    def update_user_profile(self, user_id, username, email, 
                            password):
        user = self.users.with_id(user_id)
        user.username = username or user.username
        user.email = email or user.email
        user.password = user.password if (password == None or password == '') else \
            current_app.password_encryptor.encrypt(password)
        self.users.save(user)
        return user
    
    def get_all_posts_for_question(self, question):
        return Post.objects(thread__in=
                            self.threads.with_fields(question=question))
    
    def get_threads_started_by_user(self, user):
        return Thread.objects(authorId=user.id)
    
    def check_graylist(self, obj):
        if not hasattr(obj, 'text') and not hasattr(obj, 'flags'):
            raise Exception("%s cannot be checked against the graylist" % obj)
        
        t = re.sub('\W+', ' ', obj.text)
        words = t.split()
        graylist = settings.get_graylist()
        for w in words:
            if w in graylist:
                obj.flags += 1
                return obj
    
    
class MongoConnectionService(ConnectionService):
    """Connection service implementation required for Social module
    """ 
    def remove_connection(self, user_id, provider_id, 
                          provider_user_id, **kwargs):
        user = current_app.cdw.users.with_id(user_id)
        
        SaasConnection.objects(
            Q(user=user) & 
            Q(provider_id=provider_id) & 
            Q(provider_user_id=provider_user_id)).delete()
            
        return True
    
    def remove_all_connections(self, user_id, provider_id, **kwargs):
        user = current_app.cdw.users.with_id(user_id)
        SaasConnection.objects(
            Q(user=user) & 
            Q(provider_id=provider_id)).delete()
            
        return True
    
    def save_connection(self, **kwargs):
        kwargs['user'] = cdw.users.with_id(kwargs['user_id'])
        del kwargs['user_id']
        conn = SaasConnection(**kwargs)
        conn.save()
        return conn.as_dict()
    
    def get_connection_by_provider_user_id(self, provider_id, 
                                           provider_user_id, **kwargs):
        try:
            return SaasConnection.objects(
                Q(provider_id=provider_id) & 
                Q(provider_user_id=provider_user_id)).first().as_dict()
        except:
            raise ConnectionNotFoundError()
    
    def get_primary_connection(self, user_id, provider_id, **kwargs):
        try:
            user = current_app.cdw.users.with_id(user_id)
            return SaasConnection.objects(
                Q(user=user) & 
                Q(provider_id=provider_id)).first().as_dict()
        except:
            raise ConnectionNotFoundError()
    
    def get_connection(self, user_id, provider_id, provider_user_id, **kwargs):
        try:
            user = current_app.cdw.users.with_id(user_id)
            return SaasConnection.objects(
                Q(user=user) & 
                Q(provider_id=provider_id) & 
                Q(provider_user_id=provider_user_id)).first().as_dict()
        except:
            raise ConnectionNotFoundError()
        
        
class SettingsService(object):
    """Settings service retrieves settings from the database
    """
    default_bad_words = 'shit fuck twat cunt blowjob buttplug dildo '\
                         'felching fudgepacker jizz smegma clitoris asshole ' \
                         'bullshit bullshitter bullshitters bullshitting ' \
                         'chickenshit chickenshits clit cockhead cocksuck ' \
                         'cocksucker cocksucking cum cumming cums cunt cuntree ' \
                         'cuntry cunts dipshit dipshits dumbfuck dumbfucks ' \
                         'dumbshit dumbshits fuck fucka fucke fucked fucken ' \
                         'fucker fuckers fuckface fuckhead fuckheads fuckhed ' \
                         'fuckin fucking fucks fuckup fuckups kunt kuntree ' \
                         'kuntry kunts motherfuck motherfucken motherfucker ' \
                         'motherfuckers motherfuckin motherfucking shit ' \
                         'shitface shitfaced shithead shitheads shithed shits ' \
                         'shitting shitty'
    default_graylist = 'jerk meanie stupid dumb crap suck'
    
    def __init__(self):
        s = Settings.objects().first()
        if s is None:
            s = Settings(badwords=self.default_bad_words,
                         graylist=self.default_graylist)
            s.save()
        else:
            if s.badwords is None:
                s.badwords = self.default_bad_words
            if s.graylist is None:
                s.graylist = self.default_graylist
            s.save()
            
        
    def get_settings(self):
        return Settings.objects().first()
    
    def get_bad_words(self):
        return self.get_settings().badwords or self.default_bad_words
    
    def set_bad_words(self, badwords):
        settings = self.get_settings()
        settings.badwords = badwords
        settings.save()
        
    def get_graylist(self):
        return self.get_settings().graylist or self.default_graylist
    
    def set_graylist(self, graylist):
        settings = self.get_settings()
        settings.graylist = graylist
        settings.save()