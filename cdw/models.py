"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from flaskext.login import UserMixin
from mongoengine import *
import copy
import datetime

class Settings(Document):
    badwords = StringField()
    graylist = StringField()

class ShareRecord(Document):
    provider = StringField()
    debateId = StringField()

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
    
    def __str__(self):
        return '<PhoneVerificationAttempt phoneNumber=%s, token=%s' % (
                    self.phoneNumber, self.token)

class UserPhoto(Document, EntityMixin):
    thumbnail = StringField(required=True)
    fullsize = StringField(required=True)
    
    
class User(Document, EntityMixin, UserMixin):
    username = StringField(required=True, max_length=20, min_length=2)
    phoneNumber = StringField(max_length=10, required=False, default=None)
    email = EmailField()
    password = StringField(default=None)
    origin = StringField(required=True)
    photos = ListField(ReferenceField(UserPhoto), default=list)
    isAdmin = BooleanField(default=False)
    threadSubscription = ReferenceField('Thread', default=None)
    previousThreadSubscription = ReferenceField('Thread', default=None)
    receiveSMSUpdates = BooleanField(default=True)
    webProfilePicture = StringField(default='avatar.jpg')
    webProfilePictureThumbnail = StringField(default='avatar-thumbnail.jpg')
    active = BooleanField(default=True)
    lastPostDate = DateTimeField()
    
    def get_profile_image(self, img_type):
        img_type = img_type or 'web'
        
        if self.origin == 'kiosk':
            now = datetime.datetime.utcnow()
            
            if now - self.created > datetime.timedelta(minutes=8):
                img_type = 'thumbnails' if img_type == 'thumbnail' else img_type
                return '/media/images/%s/%s.jpg' % (img_type, str(self.id))
            
            else:
                if img_type == 'web':
                    return '/images/users/avatar.jpg'
                return '/images/users/avatar-thumbnail.jpg'
        
        
        field_ref = self.webProfilePicture if img_type == 'web' else self.webProfilePictureThumbnail
        return '/images/users/%s' % field_ref
    
    def is_active(self):
        return self.active
    
    def as_dict(self):
        return {
            "id": str(self.id),
            "username": self.username,
            "origin": self.origin,
            "webImages": { 
                "large": self.get_profile_image('web'), 
                "thumb": self.get_profile_image('thumbnail') 
            },
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
        
    def __str__(self):
        return self.name

class SuggestedQuestion(Document, EntityMixin):
    author = ReferenceField(User)
    text = StringField(required=True)
    category = ReferenceField(Category)
    
class Question(Document, EntityMixin):
    #author = ReferenceField(User)
    endDate = DateTimeField()
    text = StringField(required=True)
    category = ReferenceField(Category)
    active = BooleanField(default=False)
    approved = BooleanField(default=True)
    archived = BooleanField(default=False)
    archiveDate = DateTimeField()
    
    def as_dict(self):
        return {
            "id": str(self.id),
            #"author": self.author.as_dict(),
            "text": self.text,
            "category": self.category.as_dict(),
            "active": self.active,
        }
        
    def __str__(self):
        return self.text
    
class Thread(Document, EntityMixin):
    question = ReferenceField(Question)
    firstPost = ReferenceField('Post')
    postCount = IntField(default=1)
    yesNo = IntField()
    origin = StringField()
    authorId = ObjectIdField()
    flags = IntField(default=0)
    emailSubscribers = ListField(ReferenceField(User), default=list)
    
    def as_dict(self):
        result = {}
        result['id'] = str(self.id)
        result['created'] = str(self.created)
        result['createdPretty'] = self.created.strftime('%I:%M%p on %m/%d/%Y')
        result['firstPost'] = self.firstPost.as_dict()
        result['postCount'] = self.postCount
        result['yesNo'] = self.yesNo
        result['origin'] = self.origin
        result['authorId'] = str(self.authorId)
        result['flags'] = self.flags
        #result['startedBy'] = self.firstPost.author.as_dict()
        result['posts'] = { "count": len(Post.objects(thread=self))}
        return result
    
    def __str__(self):
        return 'Thread(%s)' % str(self.id)
    
    @queryset_manager
    def objects(doc_cls, queryset):
        return queryset.order_by('+created')
    
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
        # Deep-copy the object so that we don't corrupt the parent data
        #     don't copy.copy() since it may not be deep enough
        resp = copy.deepcopy(self._data)
        if resp.get(None) and not resp.get('id'):
            resp['id'] = str(resp[None])
            del resp[None]
            
        # Get the parent questionId since we'll need it for later
        questionId = None
        if self.thread:
            questionId = str(self.thread.question.id)
            
        # Dereference all reference fields
        for k,v in resp.items():
            if k in ['thread', 'responseTo'] and v: 
                if isinstance(resp[k], (str, unicode)): continue
                resp[k] = str(getattr(self, k).id)
                continue

            if not v: continue
            
            if self._fields[k].__class__.__name__ == 'ReferenceField':
                # Eg. self.author.as_dict()
                resp[k] = getattr(self, k).as_dict() 

            elif isinstance(v, (datetime.datetime)):
                resp['%sPretty' % k] = (getattr(self, k)).strftime('%I:%M%p on %m/%d/%Y')
                resp[k] = str(v)

        # Add the parent question-id in
        resp['question'] = questionId
        
        return resp            
        
    @queryset_manager
    def objects_recent_first(doc_cls, queryset):
        return queryset.order_by('-created')
    
    @queryset_manager
    def objects(doc_cls, queryset):
        return queryset.order_by('+created')
    
    def __str__(self):
        return "Post(id=%s, text=%s, thread=%s)" % (self.id, self.text, self.thread)
