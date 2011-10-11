"""
Auth!!!
"""
import hashlib
from utils import classutils
from flask import (current_app, Blueprint, flash, redirect, request, session, 
                   _request_ctx_stack, url_for, abort, jsonify)
from flaskext.login import (UserMixin, LoginManager, AnonymousUser, login_required, 
                            login_user, logout_user)
from flaskext.wtf import (Form, TextField, PasswordField, SubmitField, HiddenField, 
                          Required, ValidationError, CheckboxInput, Email)
from werkzeug.local import LocalProxy

#blueprint = Blueprint('auth', __name__)
password_encoder = LocalProxy(lambda: current_app.password_encryptor)
auth_provider = LocalProxy(lambda: current_app.auth_provider)

URL_PREFIX_KEY = "URL_PREFIX"
AUTH_PROVIDER_KEY = 'AUTH_PROVIDER'
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
Auth cofig dictionary with default values
"""
default_config = {
    URL_PREFIX_KEY:            None,
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
    
    def authenticate(self, formdata):
        # first some basic validation
        form = self.login_form(formdata)
        
        if not form.validate():
            if form.username.errors:
                raise BadCredentialsException(form.username.errors[0])
            if form.password.errors:
                raise BadCredentialsException(form.password.errors[0])
        
        return self.do_authenticate(form.username.data, form.password.data)
        
    def do_authenticate(self, username, password):
        try:
            service = getattr(current_app, self.service_name)
        except AttributeError, e:
            self.auth_error("Could not find user service with name '%s'" % self.service_name)
            
        try:
            user = service.get_user_with_username(username)
        except UsernameNotFoundException, e:
            raise BadCredentialsException("Specified user does not exist")
        except AttributeError, e:
            self.auth_error('Invalid user service: %s' % e)
        except Exception, e:
            self.auth_error('Unexpected authentication error: %s' % e)
        
        # compare passwords
        encrypted_pw = current_app.password_encryptor.encrypt(password)
        if user.password == encrypted_pw:
            return user
        # bad match
        raise BadCredentialsException("Password does not match")
    
    def auth_error(self, msg):
        current_app.logger.error(msg)
        raise AuthenticationException(msg)

"""
Utility method
"""
def get_class_from_config(key, config):
    try:
        return classutils.get_class_by_name(config[key])
    except Exception, e:
        raise AttributeError("Could not get class '%s' for Auth setting '%s' >> %s" % 
                             (config[key], key, e)) 

def get_url(value):
    # try building the url or assume its a url already
    try: return url_for(value)
    except: return value
    
def find_redirect(key, config):
    # Look in the session first, and if not there go to the config, and
    # if its not there either just go to the root url
    result = (get_url(session.get(key.lower(), None)) or 
              get_url(config[key.upper()] or None) or '/')
    # Try and delete the session value if it was used
    try: del session[key.lower()]
    except: pass
    return result

class Auth(object):
    
    def __init__(self, app=None):
        self.init_app(app)
    
    def init_app(self, app):
        if app is None: return
        
        blueprint = Blueprint('auth', __name__)
        
        config = default_config.copy()
        config.update(app.config.get('AUTH', {}))
        app.config['AUTH'] = config
        
        app.logger.debug("Auth Configuration: %s" % config)
        
        # setup the login manager extension
        login_manager = LoginManager()
        login_manager.anonymous_user = Anonymous
        login_manager.login_view = config[LOGIN_VIEW_KEY]
        login_manager.setup_app(app)
            
        # get some things form the config
        Provider = get_class_from_config(AUTH_PROVIDER_KEY, config)
        Encryptor = get_class_from_config(PASSWORD_ENCRYPTOR_KEY, config)
        Form = get_class_from_config(LOGIN_FORM_KEY, config)
        
        # create the service and auth provider and add it to the app
        # so it can be referenced elsewhere
        app.password_encryptor = Encryptor(config[SALT_KEY])
        app.auth_provider = Provider(config[USER_SERVICE_NAME_KEY], Form)
        
        INFO_LOGIN = 'User %s logged in. Redirecting to: %s'
        ERROR_LOGIN = 'Unsuccessful authentication attempt: %s. Redirecting to: %s'
        INFO_LOGOUT = 'User logged out, redirecting to: %s'
        FLASH_INACTIVE = 'Inactive user'
        
        @login_manager.user_loader
        def load_user(id):
            try: 
                return getattr(current_app, config[USER_SERVICE_NAME_KEY]).get_user_with_id(id)
            except Exception, e:
                current_app.logger.error('Error getting user: %s' % e) 
                return None
            
        @blueprint.route(config[AUTH_URL_KEY], methods=['POST'], endpoint='authenticate')
        def authenticate():
            is_ajax = 'application/json' in request.headers['Accept']
            
            try:
                user = auth_provider.authenticate(request.form)
                
                if login_user(user):
                    redirect_url = (get_url(request.form.get('next')) or 
                                    find_redirect(POST_LOGIN_VIEW_KEY, config))
                    current_app.logger.info(INFO_LOGIN % (user, redirect_url))
                    return redirect(redirect_url) if not is_ajax else jsonify({ "success":True })
                else:
                    if is_ajax:
                        return jsonify({ "success":False, "error": FLASH_INACTIVE })
                    else:
                        raise BadCredentialsException(FLASH_INACTIVE)
                
            except BadCredentialsException, e:
                message = '%s' % e
                if is_ajax:
                    return jsonify({"success":False, "error": message })
                else:
                    current_app.logger.error(ERROR_LOGIN % (message, redirect_url))
                    flash(message)
                    redirect_url = request.referrer or login_manager.login_view
                    return redirect(redirect_url)
        
        @blueprint.route(config[LOGOUT_URL_KEY], endpoint='logout')
        @login_required
        def logout():
            logout_user()
            redirect_url = find_redirect(POST_LOGOUT_VIEW_KEY, config)
            current_app.logger.info(INFO_LOGOUT % redirect_url)
            return redirect(redirect_url)
        
        app.register_blueprint(blueprint, url_prefix=config[URL_PREFIX_KEY])