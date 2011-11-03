import datetime
from flask import current_app
from cdw.models import *
from mongoengine import Q
from social import ConnectionService, ConnectionNotFoundError
from werkzeug.local import LocalProxy

cdw = LocalProxy(lambda: current_app.cdw)
connection_service = LocalProxy(lambda: current_app.connection_service)

def init(app):
    app.cdw = CDWService()
    app.connection_service = MongoConnectionService()

class EntityNotFoundException(Exception):
    def __init(self, entity_name, fields):
        Exception.__init__("Could not find %s where: %s" % 
                           (entity_name, fields))
        
class FieldNotFoundException(Exception):
    def __init(self, entity_name, field_name):
        Exception.__init__("%s missing '%s' field" % 
                           (entity_name, field_name))
        
class MongoengineService(object):
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
    
    def __init__(self):
        self.users = MongoengineService(User)
        self.categories = MongoengineService(Category)
        self.questions = MongoengineService(Question)
        self.threads = MongoengineService(Thread)
        self.posts = MongoengineService(Post)
        self.phoneverifications = MongoengineService(PhoneVerificationAttempt)
    
    # To act as user service for Auth
    def get_user_with_id(self, id):
        return self.users.with_id(id)
    
    # To act as user service for Auth
    def get_user_with_username(self, username):
        try: return self.users.with_username(username)
        except: return self.users.with_email(username)
    
    def create_thread(self, question, post):
        thread = Thread(question=question)
        self.threads.save(thread)
        post.thread = thread
        self.posts.save(post)
        thread.firstPost = post
        thread.yesNo = post.yesNo
        thread.postCount = 1
        thread.save()
        return thread
    
    def delete_thread(self, thread):
        self.posts.with_thread(thread).delete()
        thread.delete()
    
    def post_to_thread(self, thread, post):
        post.thread = thread
        self.posts.save(post)
        thread.postCount += 1
        thread.save()
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
        user.password = user.password if (password == None) else current_app.password_encryptor.encrypt(password)
        self.users.save(user)
        return user
    
    def get_all_posts_for_question(self, question):
        return Post.objects(thread__in=
                            self.threads.with_fields(question=question))
    
    def get_threads_started_by_user(self, user):
        return Thread.objects(authorId=user.id)
    
    
class MongoConnectionService(ConnectionService):
    
    def remove_connection(self, user_id, provider_id, 
                          provider_user_id, **kwargs):
        user = current_app.cdw.users.with_d(user_id)
        
        SaasConnection.objects(
            Q(user=user) & 
            Q(provider_id=provider_id) & 
            Q(provider_user_id=provider_user_id)).delete()
            
        return True
    
    def remove_all_connections(self, user_id, provider_id, **kwargs):
        user = current_app.cdw.users.with_d(user_id)
        SaasConnection.objects(
            Q(user=user) & 
            Q(provider_id=provider_id)).delete()
            
        return True
    
    def save_connection(self, **kwargs):
        print kwargs
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
            user = current_app.cdw.users.with_d(user_id)
            return SaasConnection.objects(
                Q(user=user) & 
                Q(provider_id=provider_id)).first().as_dict()
        except:
            raise ConnectionNotFoundError()
    
    def get_connection(self, user_id, provider_id, provider_user_id, **kwargs):
        try:
            user = current_app.cdw.users.with_d(user_id)
            return SaasConnection.objects(
                Q(user=user) & 
                Q(provider_id=provider_id) & 
                Q(provider_user_id=provider_user_id)).first().as_dict()
        except:
            raise ConnectionNotFoundError()