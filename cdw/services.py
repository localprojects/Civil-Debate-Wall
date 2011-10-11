import datetime
from flask import current_app
from cdw.models import *
from mongoengine import Q

class EntityNotFoundException(Exception):
    def __init(self, entity_name, fields):
        Exception.__init__("Could not find %s where: %s" % (entity_name, fields))
        
class FieldNotFoundException(Exception):
    def __init(self, entity_name, field_name):
        Exception.__init__("%s missing '%s' field" % (entity_name, field_name))
        
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
    
    # To act as user service for Auth
    def get_user_with_id(self, id):
        return self.users.with_id(id)
    
    # To act as user service for Auth
    def get_user_with_username(self, username):
        try: return self.users.with_username(username)
        except: return self.users.with_email(username)
    
    def create_thread(self, question, post):
        thread = Thread(question=question, startedBy=post.author)
        self.threads.save(thread)
        post.thread = thread
        self.posts.save(post)
        return thread
    
    def delete_thread(self, thread):
        self.posts.with_thread(thread).delete()
        thread.delete()
    
    def post_to_thread(self, thread, post):
        post.thread = thread
        self.posts.save(post)
        return post
    
    def delete_post(self, post):
        post.delete()
        
    def register_website_user(self, username, email, password, phonenumber, facebook_user_id, facebook_token):
        user = User(username=username, email=email, origin="web",
                    password=current_app.password_encryptor.encrypt(password),
                    phoneNumber=phonenumber, facebookUserId=facebook_user_id, facebookToken=facebook_token)
        self.users.save(user)
        return user
    