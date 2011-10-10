from cdw import cdw
from cdw.models import User, Question, Category, Post
from cdw.utils import normalize_phonenumber, InvalidPhoneNumberException
from flaskext.wtf import (Form, TextField, PasswordField, SubmitField, HiddenField, AnyOf,
                          Required, ValidationError, CheckboxInput, Length, Optional, Regexp)

def does_not_have_bad_words(form, field):
    # TODO: Impelement bad words!
    pass

def check_if_post_exists(form, field):
    try: cdw.posts.with_id(field.data)
    except: raise ValidationError("Invalid post ID")

def check_if_category_exists(form, field):
    try: cdw.categories.with_id(field.data)
    except: raise ValidationError('Invalid category ID')

def check_if_user_does_not_exist(form, field):
    try: cdw.users.with_id(field.data)
    except: raise ValidationError('Invalid user ID')

def check_if_username_exists(form, field):
    try: cdw.users.with_username(field.data)
    except: return
    raise ValidationError('Username %s exists' % field.data)

def validate_phonenumber(form, field):
    try:
        normalize_phonenumber(field.data)
    except InvalidPhoneNumberException, e:
        raise ValidationError("Invalid phone number: %s" % field.data)
    except AttributeError:
        pass

class KioskUserForm(Form):
    username = TextField(validators=[
        Required(message='Username required'),
        Regexp('^[a-zA-Z0-9_.-]+$', message="Username contains invalid characters"), 
        Length(min=2, max=16, message="Username must be between 2 and 16 characters"),
        check_if_username_exists, does_not_have_bad_words
    ])
    
    phonenumber = TextField(validators=[validate_phonenumber, Optional()])
    
    def to_user(self):
        return User(username=self.username.data, phonenumber=self.phonenumber.data, origin="kiosk")
    
class QuestionForm(Form):
    category = TextField(validators=[Required(), check_if_category_exists])
    author = TextField(validators=[check_if_user_does_not_exist, Optional()])
    text = TextField(validators=[Required(), Length(min=1, max=256, message="Question must be between 2 and 256 characters")])
    
    def to_question(self):
        return Question(
            category=cdw.categories.with_id(self.category.data),
            author=cdw.users.with_id(self.author.data),
            text = self.text.data)
        
class PostForm(Form):
    yesno = TextField(validators=[AnyOf(["1","0"])])
    text = TextField(validators=[Length(min=1, max=140, message="Post must be between 2 and 140 characters"), 
                     Required(), does_not_have_bad_words])
    author = TextField(validators=[Required(), check_if_user_does_not_exist])
    origin = TextField(validators=[Required(), AnyOf(["web","kiosk","cell"])])
    responseto = TextField(validators=[check_if_post_exists, Optional()])
    
    def to_post(self):
        try:
            responseTo = cdw.posts.with_id(self.responseto.data)
        except:
            responseTo = None
            
        return Post(yesNo=int(self.yesno.data), 
                    text=self.text.data, 
                    author=User.objects.with_id(self.author.data),
                    origin=self.origin.data,
                    responseTo=responseTo)