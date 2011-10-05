"""
Auth!!!
"""
import hashlib
from utils import classutils
from flask import current_app, Blueprint
from flaskext.login import UserMixin, LoginManager, AnonymousUser
from flaskext.wtf import (Form, TextField, PasswordField, SubmitField, HiddenField, 
                          Required, ValidationError, CheckboxInput, Email)

blueprint = Blueprint('auth', __name__)
login_manager = LoginManager()

AUTH_PROVIDER_KEY = 'AUTHENTICATION_PROVIDER'
PASSWORD_ENCRYPTOR_KEY = 'PASSWORD_ENCRYPTOR'
USER_SERVICE_NAME_KEY = 'USER_SERVICE_NAME'
LOGIN_FORM_KEY = 'LOGIN_FORM'
AUTH_URL_KEY = 'AUTH_URL'
LOGOUT_URL_KEY = 'LOGOUT_URL'
LOGIN_VIEW_KEY = 'LOGIN_VIEW'
POST_LOGIN_VIEW_KEY = 'POST_LOGIN_VIEW'
POST_LOGOUT_VIEW_KEY = 'POST_LOGOUT_VIEW'
SALT_KEY = 'SALT'

"""
Auth settings dictionary with default values
"""
default_settings = {
    AUTH_PROVIDER_KEY:         'auth.AuthenticationProvider',
    PASSWORD_ENCRYPTOR_KEY:    'auth.NoOpPasswordEncryptor',
    USER_SERVICE_NAME_KEY:     'user_service',
    LOGIN_FORM_KEY:            'auth.DefaultLoginForm',
    AUTH_URL_KEY:              '/auth',
    LOGOUT_URL_KEY:            '/logout',
    LOGIN_VIEW_KEY:            '/login',
    POST_LOGIN_VIEW_KEY:       '/',
    POST_LOGOUT_VIEW_KEY:      '/',
    SALT_KEY:                  'salty',
}

settings = {}

"""
Up here there's a bunch of required classes 'n what not for the Auth package,
starting with some exceptions used throughout the package 
"""
class BadCredentialsException(Exception): pass
class AuthenticationException(Exception): pass
class UsernameNotFoundException(Exception): pass
class UserIdNotFoundException(Exception): pass
class UserServiceException(Exception): pass


"""
Here are some forms, useing the WTForm extension for Flask because, well, its nice
to have a form library when building web apps
"""
LoginForm = None

class DefaultLoginForm(Form):
    username = TextField("Username or Email", 
        validators=[Required(message="Username not provided")])
    password = PasswordField("Password", 
        validators=[Required(message="Password not provided")])
    remember = CheckboxInput("Remember Me")
    next = HiddenField()
    submit = SubmitField("Login")
    
        
    
"""
Here are classes that represent users of the application. They could be used as a base 
class for more complex needs if it was necessary. If that was the case, a custom user
service would have to be created as well to create a proper instance
"""
class Anonymous(AnonymousUser):
    pass

class User(UserMixin):
    def __init__(self, id, username, email, password, active=True):
        self.id = id
        self.username = username
        self.email = email
        self.password = password
        self.active = active
        
    def is_active(self):
        return self.active
   
class PasswordEncryptor(object):
    def __init__(self, salt=None):
        self.salt = salt
        
    def encrypt(self, password):
        raise NotImplementedError("Password encryptor does not implement encrypt method")
     
"""
Here are some password encoders, more could be added as well, but just some to get
started. These are used by the user service and authentication providers. 
"""
class NoOpPasswordEncryptor(PasswordEncryptor):
    def encrypt(self, password):
        return password
    
class MD5PasswordEncryptor(PasswordEncryptor):
    def encrypt(self, password):
        seasoned = "%s%s" % (password, self.salt)
        return hashlib.md5(seasoned.encode('utf-8')).hexdigest()

"""
A sort of abstract user service
"""
class UserService(object):
    def __init__(self, password_encryptor):
        if password_encryptor is None:
            raise AttributeError('passwordEncryptor argument cannot be None')
        self.password_encryptor = password_encryptor
        
    def get_user_with_id(self, id):
        raise NotImplementedError("User service does not implement with_id method")
    
    def get_user_with_username(self, username):
        raise NotImplementedError("User service does not implement with_username method")

"""
A mock user service to use when you don't have anything else or just want to prototype something
"""
class MockUserService(UserService):
    def __init__(self, password_encryptor):
        super(MockUserService, self).__init__(password_encryptor)
        self.users = [{'id':1, 'username':'joe', 'email':'joe@joe.com', 'password':password_encryptor.encrypt('password'), 'active':True}, 
                      {'id':2, 'username':'matt', 'email':'matt@matt.com', 'password':password_encryptor.encrypt('password'), 'active':True},
                      {'id':3, 'username':'kate', 'email':'kate@kate.com', 'password':password_encryptor.encrypt('password'), 'active':True},
                      {'id':4, 'username':'jen', 'email':'jen@jen.com', 'password':password_encryptor.encrypt('password'), 'active':False}]
    
    def get_user_with_id(self, id):
        for x in self.users:
            if x['id'] == int(id):
                return User(**x)
        raise UserIdNotFoundException("User ID %s does not exist" % id)
    
    def get_user_with_username(self, username):
        for x in self.users:
            if x['username'] == username or x['email'] == username:
                return User(**x)
        raise UsernameNotFoundException("User '%s' does not exist" % username)
    
"""
Here we have the default authentication provider. It requires a user service in order
to retrieve users and handle authentication.
"""
class AuthenticationProvider(object):
    def __init__(self, service_name, login_form_class=None):
        self.service_name = service_name
        self.login_form_class = login_form_class or DefaultLoginForm
        
    def login_form(self, formdata=None):
        return self.login_form_class(formdata)
    
    def authenticate(self, form):
        # first some basic validation
        if not form.validate():
            if form.username.errors:
                raise BadCredentialsException(form.username.errors[0])
            if form.password.errors:
                raise BadCredentialsException(form.password.errors[0])
        
        try:
            # try to authenticate
            return self.do_authenticate(form.username.data, form.password.data)
        except BadCredentialsException, e:
            # catch this exception and raise because its ok to
            raise e
        except Exception, e:
            current_app.logger.error('Unexpected authentication error: %s' % e)
            raise AuthenticationException("Unexpected authentication error: %s" % e)
        
    def do_authenticate(self, username, password):
        try:
            # try and get the user
            user = getattr(current_app, self.service_name).get_user_with_username(username)
        except Exception, e:
            # only should raise an authentication type exception
            current_app.logger.debug('Error getting user: %s' % e)
            raise BadCredentialsException("Specified user does not exist")
        
        # compare passwords
        encrypted_pw = current_app.password_encryptor.encrypt(password)
        if user.password == encrypted_pw:
            return user
        # bad match
        raise BadCredentialsException("Password does not match")

"""
Utility method
"""
def get_class_from_settings(key, settings):
    try:
        return classutils.get_class_by_name(settings[key])
    except Exception, e:
        raise AttributeError("Could not get class '%s' for Auth setting '%s' >> %s" % 
                             (settings[key], key, e)) 
"""
Initialize function is called from the main context so the app
can be initialized with anything necessary.
"""
def initialize(app, settingz):
    settings.update(default_settings)
    settings.update(settingz)
    
    app.logger.debug("Auth Settings: %s" % settings)
    
    from auth.views import load_views
    load_views()
    
    # setup the login manager extension
    #login_manager = LoginManager()
    login_manager.anonymous_user = Anonymous
    login_manager.login_view = settings[LOGIN_VIEW_KEY]
    login_manager.setup_app(app)
        
    # get some things form the settings
    Provider = get_class_from_settings(AUTH_PROVIDER_KEY, settings)
    Encryptor = get_class_from_settings(PASSWORD_ENCRYPTOR_KEY, settings)
    Form = get_class_from_settings(LOGIN_FORM_KEY, settings)
    
    # create the service and auth provider and add it to the app
    # so it can be referenced elsewhere
    app.password_encryptor = Encryptor(settings[SALT_KEY])
    app.authentication_provider = Provider(settings[USER_SERVICE_NAME_KEY], Form)