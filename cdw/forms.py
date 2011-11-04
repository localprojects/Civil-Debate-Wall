from cdw.models import User, Question, Post
from cdw.services import cdw
from cdw.utils import normalize_phonenumber, InvalidPhoneNumberException
from flaskext.login import current_user
from flaskext.mongoengine.wtf import model_form
from flaskext.wtf import (Form, TextField, PasswordField, SubmitField, HiddenField, AnyOf, Email,
                          Required, ValidationError, BooleanField, Length, Optional, Regexp, EqualTo,
                          SelectField)

badwords_list = 'shit fuck twat cunt blowjob buttplug dildo felching fudgepacker jizz smegma clitoris asshole bullshit bullshitter bullshitters bullshitting chickenshit chickenshits clit cockhead cocksuck cocksucker cocksucking cum cumming cums cunt cuntree cuntry cunts dipshit dipshits dumbfuck dumbfucks dumbshit dumbshits fuck fucka fucke fucked fucken fucker fuckers fuckface fuckhead fuckheads fuckhed fuckin fucking fucks fuckup fuckups kunt kuntree kuntry kunts motherfuck motherfucken motherfucker motherfuckers motherfuckin motherfucking shit shitface shitfaced shithead shitheads shithed shits shitting shitty jerk meanie stupid dumb crap'


def has_bad_words(content):
    word_list = badwords_list.split(" ")
    for word in word_list:
        if word in content.lower():
            return True
    return False

def existing_category(form, field):
    try: cdw.categories.with_id(field.data)
    except: raise ValidationError("Invalid category")

def does_not_have_bad_words(form, field):
    if has_bad_words(field.data):
        raise ValidationError('Content contains bad words')

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

def username_same_or_exists(form, field):
    if field.data == current_user.username:
        return
    check_if_username_exists(form, field)

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
    category = SelectField("Category", validators=[Required(), check_if_category_exists])
    author = TextField("Author", validators=[check_if_user_does_not_exist, Optional()])
    text = TextField("Text", validators=[Required(), Length(min=1, max=256, message="Question must be between 2 and 256 characters")])
    
    def to_question(self):
        return Question(
            category=cdw.categories.with_id(self.category.data),
            author=cdw.users.with_id(self.author.data),
            text = self.text.data)
        
MongoQuestionForm = model_form(Question)
        
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
        
class UserRegistrationForm(Form):
    username = TextField("Create a Username...", validators=[
        Required(message='Username required'),
        Regexp('^[a-zA-Z0-9_.-]+$', message="Username contains invalid characters"), 
        Length(min=2, max=18, message="Username must be between 2 and 18 characters"),
        check_if_username_exists, does_not_have_bad_words])
    
    email = TextField("Email Address:", validators=[
        Required(message='Email required'),
        Email(message="Invalid email address")])
    
    password = PasswordField("Password", validators=[
        Required(message='Password required')])
    
    """
    terms = BooleanField(validators=[
        Required(message="You must accept the terms of service")])
    """
    
class SuggestQuestionForm(Form):
    question = TextField(validators=[Required(), Length(min=10, max=200, message='Question must be between 10 and 200 characters')])
    category = TextField(validators=[existing_category, Optional()])
    
    def to_question(self):
        return Question(author=cdw.users.with_id(current_user.get_id()),
                        category=cdw.categories.with_id(self.category.data), 
                        text=self.question.data, 
                        approved=False)
        
class VerifyPhoneForm(Form):
    phonenumber = HiddenField(validators=[Required(), validate_phonenumber])
    
class EditProfileForm(Form):
    username = TextField("Username", validators=[
        Regexp('^[a-zA-Z0-9_.-]+$', message="Username contains invalid characters"), 
        Length(min=2, max=16, message="Username must be between 2 and 16 characters"),
        username_same_or_exists, does_not_have_bad_words])
    
    email = TextField("Email", validators=[
        Required(message='Email required'),
        Email(message="Invalid email address")])
    
    password = PasswordField("Change Password", validators=[ 
        EqualTo('password2', message='Passwords must match'),
        Optional()])
    
    password2 = PasswordField("Repeat password", validators=[Optional()])
    
    

    