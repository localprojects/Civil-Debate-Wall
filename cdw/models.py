import datetime
from flaskext.login import UserMixin
from mongoengine import *

class EntityMixin():
    created = DateTimeField()
    modified = DateTimeField()
    
    def is_new(self):
        return True if self.id is None else False
    
class PhoneVerificationAttempt(Document):
    expires = DateTimeField()
    phoneNumber = StringField()
    token = StringField()
    
    def is_new(self):
        return True if self.id is None else False
    
    def __repr__(self):
        return '<PhoneVerificationAttempt phoneNumber=%(phoneNumber)s, token=%(token)s' % self.__dict__

class UserPhoto(Document, EntityMixin):
    thumbnail = StringField(required=True)
    fullsize = StringField(required=True)
    
    
class User(Document, EntityMixin, UserMixin):
    username = StringField(required=True, max_length=20, min_length=2, unique=True)
    phoneNumber = StringField(max_length=10, required=False)
    email = EmailField()
    password = StringField(default=None)
    origin = StringField(required=True)
    photos = ListField(ReferenceField(UserPhoto), default=list)
    isAdmin = BooleanField(default=False)
    threadSubscription = ReferenceField('Thread', default=None)
    previousThreadSubscription = ReferenceField('Thread', default=None)
    receiveSMSUpdates = BooleanField(default=True)
    webProfilePicture = StringField(default=None)
    webProfilePictureThumbnail = StringField(default=None)
    active = BooleanField(default=True)
    
    def is_active(self):
        return self.active
    
    def as_dict(self):
        return {
            "id": str(self.id),
            "username": self.username,
            "origin": self.origin,
            "photos": [x.as_dict() for x in self.photos],
            "webImages": { 
                "large": self.webProfilePicture or "avatar.jpg", 
                "thumb": self.webProfilePictureThumbnail or "avatar-thumbnail.jpg" },
        }
    
    def __str__(self):
        return "User(id=%s, username=%s)" % (self.id, self.username)
    
class SaasConnection(Document):
    user = ReferenceField(User, required=True)
    provider_id = StringField(required=True)
    provider_user_id = StringField(required=True)
    access_token = StringField(required=True)
    secret = StringField(required=False)
    display_name = StringField()
    profile_url = StringField()
    image_url = StringField()
    
    def as_dict(self):
        return {
            "user_id": str(self.user.id),
            "provider_id": self.provider_id,
            "provider_user_id": self.provider_user_id,
            "access_token": self.access_token,
            "secret": self.secret,
            "display_name": self.display_name,
            "profile_url": self.profile_url,
            "image_url": self.image_url,
        }
    
class Category(Document, EntityMixin):
    name = StringField(required=True, max_length=20, min_length=2)
    
    def as_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
        }
    
class Question(Document, EntityMixin):
    author = ReferenceField(User)
    endDate = DateTimeField()
    text = StringField(required=True)
    category = ReferenceField(Category)
    active = BooleanField(default=False)
    approved = BooleanField(default=True)
    
    def as_dict(self):
        return {
            "id": str(self.id),
            "author": self.author.as_dict(),
            "text": self.text,
            "category": self.category.as_dict(),
            "active": self.active,
        }
    
class Thread(Document, EntityMixin):
    question = ReferenceField(Question)
    firstPost = ReferenceField('Post')
    
    def as_dict(self):
        result = {}
        result['id'] = str(self.id)
        result['created'] = str(self.created)
        result['firstPost'] = self.firstPost.as_dict()
        return result
    
class Post(Document, EntityMixin):
    yesNo = IntField(required=True)
    author = ReferenceField(User, required=True)
    origin = StringField(required=True)
    text = StringField(required=True, min_length=1, max_length=140)
    likes = IntField(default=0)
    flags = IntField(default=0)
    thread = ReferenceField(Thread)
    responseTo = ReferenceField('Post', default=None)
    
    def as_dict(self):
        responseToId = None if self.responseTo is None else str(self.responseTo.id)
        return {
            "id": str(self.id),
            "yesNo": self.yesNo,
            "author": self.author.as_dict(),
            "text": self.text,
            "flags": self.flags,
            "likes": self.likes,
            "created": str(self.created),
            "origin": self.origin,
            "responseTo": responseToId,
        }
        
    @queryset_manager
    def objects_recent_first(doc_cls, queryset):
        return queryset.order_by('-created')
    
    @queryset_manager
    def objects(doc_cls, queryset):
        return queryset.order_by('+created')
    
    
    
    def __str__(self):
        return "Post(id=%s, text=%s)" % (self.id, self.text)