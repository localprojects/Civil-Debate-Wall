"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
from cdw.models import User, Question, Post, SuggestedQuestion, Thread
from cdw.services import cdw, settings
from cdw.utils import normalize_phonenumber, InvalidPhoneNumberException
from flask import current_app
from flaskext.login import current_user
from flaskext.mongoengine.wtf import model_form
from flaskext.wtf import (Form, TextField, PasswordField, SubmitField, 
                          HiddenField, AnyOf, Email, Required, ValidationError, 
                          BooleanField, Length, Optional, Regexp, EqualTo, 
                          SelectField, TextAreaField, SelectMultipleField, IntegerField)

# Various form validators
def has_bad_words(content):
    word_list = settings.get_bad_words().lower().split(" ")
    content_words = content.lower().split(" ")
    for word in word_list:
        if word in content_words:
            current_app.logger.debug("Found bad word: %s" % word)
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
    
def check_if_thread_exists(form, field):
    try: cdw.threads.with_id(field.data)
    except: raise ValidationError("Invalid thread ID")
    
def check_if_category_exists(form, field):
    try: cdw.categories.with_id(field.data)
    except: raise ValidationError('Invalid category ID')

def check_if_user_does_not_exist(form, field):
    def check_id(uid):
        try: 
            cdw.users.with_id(uid)
        except: 
            raise ValidationError('Invalid user ID')
        
    if isinstance(field.data, list):
        for uid in field.data:
            check_id(uid)
        
    else:
        check_id(field.data)
        

def check_if_username_exists(form, field):
    try: cdw.users.with_username(field.data)
    except: return
    raise ValidationError('Username %s exists' % field.data)

def email_is_unique(form, field):
    try:cdw.users.with_email(field.data)
    except: return
    raise ValidationError('Email is already associated with an account')

def phone_is_unique(form, field):
    try: user = cdw.users.with_fields(origin="web", phoneNumber=field.data).first()
    except: return
    if user != None:
        raise ValidationError('Phone number is associated with an account already')

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
    
def valid_question(form, field):
    try:
        cdw.questions.with_id(field.data)
    except:
        raise ValidationError("Invalid Question ID")

class KioskUserForm(Form):
    username = TextField(validators=[
        Required(message='Username required'),
        Regexp('^[a-zA-Z0-9_.-]+$', 
               message="Username contains invalid characters"), 
        Length(min=2, max=16, 
               message="Username must be between 2 and 16 characters"),
        does_not_have_bad_words
    ])
    
    phonenumber = TextField(validators=[validate_phonenumber, Optional()])
    
    def get_phone(self):
        has_phone = len(self.phonenumber.data) == 10
        return self.phonenumber.data if has_phone else None 
    
    def to_user(self):
        return User(username=self.username.data, 
                    phoneNumber=self.phonenumber.data, 
                    origin="kiosk")
    
class QuestionForm(Form):
    category = SelectField("Category", validators=[
                           Required(), check_if_category_exists])
    
    author = TextField("Author", validators=[
                       check_if_user_does_not_exist, Optional()])
    
    text = TextAreaField("Text", validators=[
        Length(min=1, max=140, 
               message="Question must be between 2 and 256 characters"),
        Required()])
    
    def __init__(self, *args, **kwargs):
        super(QuestionForm, self).__init__(*args, **kwargs)
        cat_choices = [(str(c.id), c.name) for c in cdw.categories.all()]
        self.category.choices = cat_choices
    
    def to_question(self):
        try:
            user = cdw.users.with_id(self.author.data)
        except:
            user = None
        
        return Question(
            category=cdw.categories.with_id(self.category.data),
            author=user,
            text = self.text.data)
        
MongoQuestionForm = model_form(Question)
        
class PostForm(Form):
    yesno = TextField(validators=[AnyOf(["1","0"])])
    
    text = TextField(validators=[
        Length(min=1, max=140, 
               message="Post must be between 2 and 140 characters"), 
        Required(), does_not_have_bad_words])
    
    author = TextField(validators=[Required(), check_if_user_does_not_exist])
    origin = TextField(validators=[Required(), AnyOf(["web","kiosk","cell"])])
    responseto = TextField(validators=[check_if_post_exists, Optional()])
    
    follow_sms = TextField(validators=[AnyOf(["on","start","yes"]), Optional()])
    follow_email = TextField(validators=[AnyOf(["on","start","yes"]), Optional()])
    
    def get_follow_sms(self):
        return self.follow_sms.data in ["on","start","yes"]
    
    def get_follow_email(self):
        return self.follow_email.data in ["on","start","yes"]
    
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
        Regexp('^[a-zA-Z0-9_.-]+$', 
               message="Username contains invalid characters"), 
        Length(min=2, max=18, 
               message="Username must be between 2 and 18 characters"),
        does_not_have_bad_words])
    
    email = TextField("Email Address:", validators=[
        Required(message='Email required'),
        Email(message="Invalid email address"),
        email_is_unique])
    
    password = PasswordField("Password", validators=[
        Required(message='Password required')])
    
    """
    terms = BooleanField(validators=[
        Required(message="You must accept the terms of service")])
    """
    
class SuggestQuestionForm(Form):
    question = TextField(validators=[Required(), Length(min=10, max=200, 
                message='Question must be between 10 and 200 characters')])
    category = SelectField(validators=[existing_category, Required()])
    
    def __init__(self, *args, **kwargs):
        super(SuggestQuestionForm, self).__init__(*args, **kwargs)
        cat_choices = [(str(c.id), c.name) for c in cdw.categories.all()]
        self.category.choices = cat_choices
    
    def to_question(self):
        try:
            category = cdw.categories.with_id(self.category.data)
        except:
            category =  None
        return SuggestedQuestion(
            author=cdw.users.with_id(current_user.get_id()),
            category=category, 
            text=self.question.data)
        
class VerifyPhoneForm(Form):
    phonenumber = HiddenField(validators=[Required(), 
                                          validate_phonenumber, 
                                          phone_is_unique])
    
class EditProfileForm(Form):
    username = TextField("Username", validators=[
        Regexp('^[a-zA-Z0-9_.-]+$', 
            message="Username contains invalid characters"), 
        Length(min=2, max=16, 
            message="Username must be between 2 and 16 characters"),
        username_same_or_exists, does_not_have_bad_words])
    
    email = TextField("Email Address", validators=[
        Required(message='Email required'),
        Email(message="Invalid email address")])
    
    password = PasswordField("Change Password", validators=[
        Length(min=4, max=32, 
            message="Username must be between 2 and 16 characters"), 
        EqualTo('password2', message='Passwords must match'),
        Optional()])
    
    password2 = PasswordField("Repeat password", validators=[Optional()])
    
    
class PostCrudForm(Form):   
    yesno = SelectField("Yes or No?", 
        validators=[AnyOf(["1","0"]), Required()],
        choices=[("1",'Yes'),("0",'No')])
    
    debate_id = HiddenField(validators=[check_if_thread_exists])
    
    text = TextAreaField(validators=[
        Length(min=1, max=140, 
               message="Post must be between 2 and 140 characters"), 
        Required(), does_not_have_bad_words])
    
    author_id = SelectMultipleField("Author", 
        validators=[check_if_user_does_not_exist])
    
    origin = SelectField(validators=[Required(), 
                                     AnyOf(["web","kiosk","cell"]),],
                                     choices=[("web",'Web'),("kiosk",'Kiosk'), ("cel", "Cell")])
    
    likes = IntegerField("Likes", validators=[Optional()])
    
    def __init__(self, debate_id=None, *args, **kwargs):
        super(PostCrudForm, self).__init__(*args, **kwargs)
        if debate_id:
            self.debate_id.data = debate_id
            
        self.author_id.choices = [(str(u.id),'%s (%s)' % (u.username, u.origin)) for u in cdw.users.all().order_by("+username")]
    
    def to_post(self):
        try:
            responseTo = cdw.posts.with_id(self.responseto.data)
        except:
            responseTo = None
            
        return Post(yesNo=int(self.yesno.data), 
                    text=self.text.data, 
                    author=User.objects.with_id(self.author_id.data[0]),
                    origin=self.origin.data,
                    likes=self.likes.data,
                    responseTo=responseTo) 
    
class ThreadCrudForm(Form):
    question_id = HiddenField(validators=[Required(),valid_question])
    
    author_id = SelectMultipleField("Author", 
        validators=[check_if_user_does_not_exist])
     
    yesno = SelectField("Yes or No?", 
        validators=[AnyOf(["1","0"]), Required()],
        choices=[("1",'Yes'),("0",'No')])
    
    text = TextAreaField("Opinion", 
        validators=[
            Length(min=1, max=140, 
                message="Post must be between 2 and 140 characters"), 
            Required(), 
            does_not_have_bad_words])
    
    likes = IntegerField("Likes", validators=[Optional()])
    
    def __init__(self, question_id=None, *args, **kwargs):
        super(ThreadCrudForm, self).__init__(*args, **kwargs)
        if question_id:
            self.question_id.data = question_id
        self.author_id.choices = [(str(u.id),'%s (%s)' % (u.username, u.origin)) for u in cdw.users.all().order_by("+username")]
        
class ContactForm(Form):
    firstname = TextField(validators=[
        Length(min=2, max=16, 
            message="First name must be between 2 and 16 characters"),
        Required(message='First name is required')])
    
    lastname = TextField(validators=[
        Length(min=2, max=16, 
            message="Last name must be between 2 and 16 characters"),
        Required(message='Last name is required')])
    
    email = TextField("Email Address", validators=[
        Required(message='Email is required'),
        Email(message="Invalid email address")])
    
    feedback = SelectField(validators=[
            Required("A feedback type is required"),
            AnyOf(["question", "comment", "bug"]), Required()],
        choices=[("question",'Question'),("comment",'Comment'),("bug",'Bug')])
    
    comment = TextAreaField(validators=[
            Length(min=1, max=300, 
                message="Please provide some feedback"), 
            Required("A comment is required")])
    
    def __init__(self, *args, **kwargs):
        super(ContactForm, self).__init__(*args, **kwargs)
        if self.firstname.data and \
           'first' == self.firstname.data.lower():
            self.firstname.data = ''
            
        if self.lastname.data and \
           'last' == self.lastname.data.lower():
            self.lastname.data = ''
            
        if self.email.data and \
           'i.e. ' in self.email.data:
            self.email.data = ''
    
    def to_dict(self):
        return dict(firstname=self.firstname.data,
                    lastname=self.firstname.data,
                    email=self.email.data,
                    feedback=self.feedback.data,
                    comment=self.comment.data)