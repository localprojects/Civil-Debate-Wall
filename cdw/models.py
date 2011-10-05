import datetime
from flaskext.login import UserMixin
from mongoengine import *

class EntityMixin():
    created = DateTimeField()
    modified = DateTimeField()
    
    def is_new(self):
        return True if self.id is None else False

class SMSRegistrationMessage(Document, EntityMixin):
    kioskNumber = StringField(required=True)
    phoneNumber = StringField(required=True)
    message = StringField(required=True, default='')
    profane = BooleanField()

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
    facebookUserId = StringField(default=None)
    facebookToken = StringField(default=None)
    webProfilePicture = StringField(default=None)
    webProfilePictureThumbnail = StringField(default=None)
    active = BooleanField(default=True)
    
    def is_active(self):
        return self.active
    
    def __str__(self):
        return "User(id=%s, username=%s)" % (self.id, self.username)
    
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
    
class Category(Document, EntityMixin):
    name = StringField(required=True, max_length=20, min_length=2)
    
    def as_dict(self):
        return {
            "id": str(self.id),
            "name": self.name,
        }
    
class Question(Document, EntityMixin):
    author = ReferenceField(User)
    startDate = DateTimeField()
    endDate = DateTimeField()
    text = StringField(required=True)
    category = ReferenceField(Category)
    
    def as_dict(self):
        return {
            "id": str(self.id),
            "author": self.author.as_dict(),
            "text": self.text,
            "category": self.category.as_dict()
        }
    
class Thread(Document, EntityMixin):
    question = ReferenceField(Question)
    startedBy = ReferenceField(User)
    
    def as_dict(self, include_question=True, include_posts=False):
        result = {}
        result['id'] = str(self.id)
        result['created'] = str(self.created)
        result['startedBy'] = self.startedBy.as_dict() if self.startedBy is not None else None,
        if include_question: result['question'] = self.question.as_dict()
        if include_posts: 
            result['posts'] = [x.as_dict() for x in self.get_posts()]
        else:
            try:
                result['posts'] = [self.get_posts()[0].as_dict()]
            except:
                pass
        return result
    
class Post(Document, EntityMixin):
    yesNo = IntField(required=True, choices=[0,1])
    author = ReferenceField(User, required=True)
    origin = StringField(required=True, choices=["kiosk","web","cell"])
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
    
    def __str__(self):
        return "Post(id=%s, text=%s)" % (self.id, self.text)