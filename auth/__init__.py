"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""

from cdw import jsonp
from cdw.CONSTANTS import *
from cdw.utils import is_ajax
from flask import (current_app, Blueprint, flash, redirect, request, session, 
    _request_ctx_stack, url_for, abort, jsonify)
from flask.ext.login import (UserMixin, LoginManager, AnonymousUser, 
    login_required, login_user, logout_user, current_user)
from flask.ext.wtf import (Form, TextField, PasswordField, SubmitField, 
    HiddenField, Required, ValidationError, CheckboxInput)
from utils import classutils
from werkzeug.local import LocalProxy
import datetime
import hashlib


AUTH_CONFIG_KEY = 'AUTH'
URL_PREFIX_KEY = "url_prefix"
AUTH_PROVIDER_KEY = 'auth_provider'
PASSWORD_ENCRYPTOR_KEY = 'password_encryptor'
USER_SERVICE_NAME_KEY = 'user_service_name'
LOGIN_FORM_CLASS_KEY = 'login_form'
AUTH_URL_KEY = 'auth_url'
LOGOUT_URL_KEY = 'logout_url'
LOGIN_VIEW_KEY = 'login_view'
POST_LOGIN_VIEW_KEY = 'post_login_view'
POST_LOGOUT_VIEW_KEY = 'post_logout_view'
SALT_KEY = 'salt'

def get_cv(key):
    """Get an Auth config value
    :param key: Config key name
    """
    return getattr(current_app, current_app.config[AUTH_CONFIG_KEY][key])

login_manager = LocalProxy(lambda: current_app.login_manager)
password_encoder = LocalProxy(lambda: current_app.password_encryptor)
auth_provider = LocalProxy(lambda: current_app.auth_provider)
user_service = LocalProxy(lambda: get_cv(USER_SERVICE_NAME_KEY))

# Default configuration values
default_config = {
    URL_PREFIX_KEY:            None,
    AUTH_PROVIDER_KEY:         'auth.AuthenticationProvider',
    PASSWORD_ENCRYPTOR_KEY:    'plaintext',
    USER_SERVICE_NAME_KEY:     'user_service',
    LOGIN_FORM_CLASS_KEY:      'auth.DefaultLoginForm',
    AUTH_URL_KEY:              '/auth',
    LOGOUT_URL_KEY:            '/logout',
    LOGIN_VIEW_KEY:            '/login',
    POST_LOGIN_VIEW_KEY:       '/',
    POST_LOGOUT_VIEW_KEY:      '/',
    SALT_KEY:                  'salty',
}

# Exceptions
class BadCredentialsException(Exception): pass
class AuthenticationException(Exception): pass
class UsernameNotFoundException(Exception): pass
class UserIdNotFoundException(Exception): pass
class UserServiceException(Exception): pass


#
LoginForm = None

class DefaultLoginForm(Form):
    """The default login form used by Auth
    """
    username = TextField("Username or Email", 
        validators=[Required(message="Username not provided")])
    password = PasswordField("Password", 
        validators=[Required(message="Password not provided")])
    remember = CheckboxInput("Remember Me")
    next = HiddenField()
    submit = SubmitField("Login")
    
   
class Anonymous(AnonymousUser):
    """Anonymous user class
    """

class User(UserMixin):
    """Authenticated user class
    """
    def __init__(self, id, username, email, password, active=True, **kwargs):
        self.id = id
        self.username = username
        self.email = email
        self.password = password
        self.active = active

        
    def is_active(self):
        return self.active
    
    def __str__(self):
        return "User(id=%s, username=%s, email=%s, active=%s)" % (
                            self.id, self.username, self.email, self.active)
   
class PasswordEncryptor(object):
    """Password encryptor base class
    """
    def __init__(self, salt=None):
        self.salt = salt
        
    def encrypt(self, password):
        raise NotImplementedError("encrypt")

    def matches_encryption_pattern(self, password):
        """Validate whether the pattern of the password matches the usual output of the encryptor
        
        :param password: String of password characters
        """
        # The default implementation should fail, since each encryptor is 
        #    expected to implement its own checks
        raise NotImplementedError("encryptor pattern match")

class NoOpPasswordEncryptor(PasswordEncryptor):
    """Plain text password encryptor
    """
    def encrypt(self, password):
        return password
    
    def matches_encryption_pattern(self, password):
        # The NoOp encryptor must assume that every pattern is valid
        return True
    
class MD5PasswordEncryptor(PasswordEncryptor):
    """MD5 password encryptor
    """
    def encrypt(self, password):
        seasoned = "%s%s" % (password, self.salt)
        return hashlib.md5(seasoned.encode('utf-8')).hexdigest()
    
    def matches_encryption_pattern(self, password):
        # md5.hexdigest returns string of length 32, containing only hexadecimal digits
        try:
            int(password, 16)
            if len(password) == 32:
                return True
            
        except ValueError:
            current_app.logger.debug("Password doesn't match MD5 pattern")
            
        return False
        

class SHA1PasswordEncryptor(PasswordEncryptor):
    def encrypt(self, password):
        seasoned = "%s%s" % (password, self.salt)
        return hashlib.sha1(seasoned.encode('utf-8')).hexdigest()

    def matches_encryption_pattern(self, password):
        # md5.hexdigest returns string of length 40, containing only hexadecimal digits
        try:
            int(password, 16)
            if len(password) == 40:
                return True
            
        except ValueError:
            current_app.logger.debug("Password doesn't match SHA1 pattern")
            
        return False

class SHA256PasswordEncryptor(PasswordEncryptor):
    def encrypt(self, password):
        seasoned = "%s%s" % (password, self.salt)
        return hashlib.sha256(seasoned.encode('utf-8')).hexdigest()
    
class UserService(object):
    """User service base class
    """
    def __init__(self, password_encryptor):
        if password_encryptor is None:
            raise AttributeError('passwordEncryptor argument cannot be None')
        self.password_encryptor = password_encryptor
        
    def get_user_with_id(self, id):
        raise NotImplementedError("get_user_with_id")
    
    def get_user_with_username(self, username):
        raise NotImplementedError("get_user_with_username")

class MockUserService(UserService):
    """A mock user service to use when you don't have anything else or just 
    want to prototype something"""
    
    def __init__(self, password_encryptor):
        super(MockUserService, self).__init__(password_encryptor)
        self.users = [{'id':1, 'username':'joe', 'email':'joe@joe.com', 
                       'password':password_encryptor.encrypt('password'), 
                       'active':True}, 
                      {'id':2, 'username':'matt', 'email':'matt@matt.com', 
                       'password':password_encryptor.encrypt('password'), 
                       'active':True},
                      {'id':3, 'username':'kate', 'email':'kate@kate.com', 
                       'password':password_encryptor.encrypt('password'), 
                       'active':True},
                      {'id':4, 'username':'jen', 'email':'jen@jen.com', 
                       'password':password_encryptor.encrypt('password'), 
                       'active':False}]
    
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
    
class AuthenticationProvider(object):
    """The default authentication provider. It requires a user service in order
    to retrieve users and handle authentication."""
    
    def __init__(self, login_form_class=None):
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
        # We have to load the exception here since otherwise we'll have a
        # circular import up on top
        from cdw.services import EntityNotFoundException
        try:
            user = user_service.get_user_with_username(username)
        except AttributeError, e:
            self.auth_error("Could not find user service")
        except UsernameNotFoundException, e:
            raise BadCredentialsException("Specified user does not exist")
        except EntityNotFoundException, e:
            raise BadCredentialsException("Specified user does not exist")
        except AttributeError, e:
            self.auth_error('Invalid user service: %s' % e)
        except Exception, e:
            self.auth_error('Unexpected authentication error: %s' % e)
        
        # compare passwords
        encrypted_password = current_app.password_encryptor.encrypt(password)
        if user.password == encrypted_password:
            return user
        elif user.password == password:
            # Convert plain-text to encrypted password
            current_app.logger.debug("Found plain-text password. Encrypting with %s" % 
                                     current_app.config.get('AUTH').get('password_encryptor'))
            user.password = encrypted_password
            user.save()
            
            #current_app.logger.debug("SHA'ed pass: " + user.password)
            return user
        # bad match
        raise BadCredentialsException("Password does not match")
    
    def auth_error(self, msg):
        current_app.logger.error(msg)
        raise AuthenticationException(msg)

def get_class_from_config(key, config):
    """Get a reference to a class by its name from the config dictionary
    """
    try:
        return classutils.get_class_by_name(config[key])
    except Exception, e:
        raise AttributeError("Could not get class '%s' for Auth setting "
                             "'%s' >> %s" % (config[key], key, e)) 

def get_url(value):
    # try building the url or assume its a url already
    try: return url_for(value)
    except: return value
    
def get_post_login_redirect():
    return (get_url(request.args.get('next')) or 
            get_url(request.form.get('next')) or 
            find_redirect(POST_LOGIN_VIEW_KEY, 
                          current_app.config[AUTH_CONFIG_KEY]))
    
def find_redirect(key, config):
    # Look in the session first, and if not there go to the config, and
    # if its not there either just go to the root url
    result = (get_url(session.get(key, None)) or 
              get_url(config[key] or None) or '/')
    # Try and delete the session value if it was used
    try: del session[key]
    except: pass
    return result

class Auth(object):
    """The Auth class is the bootstrap for Auth. Initialize Auth with your app
    like so:
    
        from auth import Auth
        from flask import Flask
        
        app = Flask(__name__)
        Auth(app)
    """
    def __init__(self, app=None):
        self.init_app(app)


    def init_app(self, app):        
        if app is None: return
        
        blueprint = Blueprint(AUTH_CONFIG_KEY.lower(), __name__)
        
        config = default_config.copy()
        try: config.update(app.config.get(AUTH_CONFIG_KEY, {}))
        except: pass
        app.config[AUTH_CONFIG_KEY] = config
        
        app.logger.debug("Auth Configuration: %s" % config)
        
        # setup the login manager extension
        login_manager = LoginManager()
        login_manager.anonymous_user = Anonymous
        login_manager.login_view = config[LOGIN_VIEW_KEY]
        login_manager.setup_app(app)
            
        # get some things form the config
        Provider = get_class_from_config(AUTH_PROVIDER_KEY, config)
        Encryptor = get_class_from_config(PASSWORD_ENCRYPTOR_KEY, config)
        Form = get_class_from_config(LOGIN_FORM_CLASS_KEY, config)
        
        # create the service and auth provider and add it to the app
        # so it can be referenced elsewhere
        app.login_manager = login_manager
        app.password_encryptor = Encryptor(config[SALT_KEY])
        app.auth_provider = Provider(Form)
        
        DEBUG_LOGIN = 'User %s logged in. Redirecting to: %s'
        DEBUG_XHR_LOGIN = 'User %s logged in. Returning status'
        ERROR_LOGIN = 'Unsuccessful auth attempt: %s. Redirecting to: %s'
        DEBUG_LOGOUT = 'User logged out, redirecting to: %s'
        FLASH_INACTIVE = 'Inactive user'
        
        @login_manager.user_loader
        def load_user(id):
            try: 
                user = user_service.get_user_with_username(id)
                # check if the password matches encryptor pattern
                if not current_app.password_encryptor.matches_encryption_pattern(user.password):
                    encrypted_password = current_app.password_encryptor.encrypt(user.password)
                    user.password = encrypted_password
                    user.save()

                return user
            except Exception, e:
                current_app.logger.error('Error getting user: %s' % e) 
                return None
            
        @blueprint.route(config[AUTH_URL_KEY], 
                         methods=['POST'], 
                         endpoint='authenticate')
        def authenticate():
            try:
                if current_user and current_user.is_authenticated:
                    return jsonify(current_user_data())

            except:
                pass # Continue as though we're not logged in
            
            try:
                user = auth_provider.authenticate(request.form)

                if login_user(user):
                    redirect_url = get_post_login_redirect()
                    if not is_ajax():
                        current_app.logger.debug(DEBUG_LOGIN % (user, redirect_url))
                        return redirect(redirect_url)
                    else: 
                        current_app.logger.debug(DEBUG_XHR_LOGIN % (user))
                        loginStatus = user.profile_dict()
                        loginStatus.update({'success': True})

                        # Add the login cookie.
                        # Note that because we have not yet set the current_user
                        #     is_authenticated state, we can't just wrap this in
                        #     the login_cookie decorator
                        cookie = []
                        for key, val in loginStatus.items():
                            if not isinstance(val, (list, dict)):
                                cookie.append("%s=%s" % (key, str(val)))
                                
                        resp = jsonify(loginStatus)
                        resp.set_cookie("login", ",".join(cookie) )
                        return resp

                else:
                    if is_ajax():
                        return jsonify({ "success":False, 
                                         "error": FLASH_INACTIVE })
                    else:
                        raise BadCredentialsException(FLASH_INACTIVE)
                
            except BadCredentialsException, e:
                message = '%s' % e
                if is_ajax():
                    return jsonify({"success":False, "error": message })
                else:
                    flash(message)
                    redirect_url = request.referrer or login_manager.login_view
                    msg = ERROR_LOGIN % (message, redirect_url)
                    current_app.logger.error(msg)
                    return redirect(redirect_url)
        
        @blueprint.route('/authenticated', methods=['GET', 'POST'])
        @jsonp
        def is_logged_in():
            try:
                if current_user and current_user.is_authenticated():
                    return jsonify(current_user_data())
                else:
                    return jsonify({'status': STATUS_NOT_FOUND, 'message': "Not Logged in"})
                
            except Exception, exc:
                return jsonify({'status': STATUS_FAIL, 'result': {'message': str(exc)}})
            
        @blueprint.route(config[LOGOUT_URL_KEY], endpoint='logout')
        def logout():
            if current_user and current_user.is_authenticated():
                logout_user()
            resp = None
            if is_ajax():
                resp = current_app.make_response(jsonify({"success":True, "message": "Logged out user" }))
            else:    
                redirect_url = find_redirect(POST_LOGOUT_VIEW_KEY, config)
                current_app.logger.debug(DEBUG_LOGOUT % redirect_url)
                
                resp = current_app.make_response(redirect(redirect_url))  
                
            # Expire the login cookie
            yesterday = (datetime.datetime.utcnow() + 
                         datetime.timedelta(-1)).strftime("%a, %d %b %Y %H:%M:%S GMT")
            resp.set_cookie("login", expires=yesterday)
            
            return resp
        
        app.register_blueprint(blueprint, url_prefix=config[URL_PREFIX_KEY])


def current_user_data():
    resp = { "status": STATUS_ALREADY_OK,
             "message": "Already authenticated",
             "result": current_user.profile_dict(full_path=True)
            }
    return resp
