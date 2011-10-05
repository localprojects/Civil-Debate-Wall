from cdw.models import User
from cdw.utils import normalize_phonenumber, InvalidPhoneNumberException
from flask import current_app
from flaskext.wtf import (Form, TextField, PasswordField, SubmitField, HiddenField, 
                          Required, ValidationError, CheckboxInput, Length, Optional, Regexp)

def check_if_username_exists(form, field):
    try: current_app.cdw.users.with_username(field.data)
    except: return
    raise ValidationError('Username %s exists' % field.data)

def validate_phonenumber(form, field):
    try:
        normalize_phonenumber(field.data)
    except InvalidPhoneNumberException, e:
        raise ValidationError("Invalid phone number: %s" % field.data)

class KioskUserForm(Form):
    username = TextField(validators=[
        Required(message='Username required'),
        Regexp('^[a-zA-Z0-9_.-]+$', message="Username contains invalid characters"), 
        Length(min=2, max=16, message="Username must be between 2 and 16 characters"),
        check_if_username_exists,
    ])
    
    phonenumber = TextField(validators=[validate_phonenumber, Optional()])
    
    def to_user(self):
        return User(username=self.username.data, phonenumber=self.phonenumber.data, origin="kiosk")