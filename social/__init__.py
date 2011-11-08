try: import twitter
except: pass

try: from lib import facebook
except: pass

from auth import user_service, login_manager, BadCredentialsException
from flask import current_app, redirect, flash, Blueprint, session, request, abort
from flask.signals import Namespace
from flaskext.login import current_user, login_user, login_required
from flaskext.oauth import OAuth
from werkzeug.local import LocalProxy
from utils.classutils import get_class_by_name
 
_signals = Namespace()

connection_service = LocalProxy(lambda: getattr(current_app, current_app.config['SOCIAL']['connection_service_name']))
        
default_config = {
    'url_prefix': None,
    'connection_service_name': 'connection_service',
    'connect_allow_view': '/profile',
    'connect_deny_view': '/profile',
}

default_provider_config = {
    'twitter': {
        'display_name': 'Twitter',
        'login_handler': 'social.TwitterLoginHandler',
        'connect_handler': 'social.TwitterConnectHandler',
        'connection_factory': 'social.TwitterConnectionFactory',
        'oauth': {
            'base_url': 'http://api.twitter.com/1/',
            'request_token_url': 'http://api.twitter.com/oauth/request_token',
            'access_token_url': 'http://api.twitter.com/oauth/access_token',
            'authorize_url': 'http://api.twitter.com/oauth/authenticate',
        },
    },
    'facebook': {
        'display_name': 'Facebook',
        'login_handler': 'social.FacebookLoginHandler',
        'connect_handler': 'social.FacebookConnectHandler',
        'connection_factory': 'social.FacebookConnectionFactory',
        'oauth': {
            'base_url': 'https://graph.facebook.com/',
            'request_token_url': None,
            'access_token_url': '/oauth/access_token',
            'authorize_url': 'https://www.facebook.com/dialog/oauth',
        },
    }
}

def get_display_name(provider_id, config=None):
    config = current_app.config['SOCIAL_PROVIDERS'] if config is None else config
    return config[provider_id]['display_name']

def get_authorize_callback(endpoint):
    return '%s%s' % (current_app.config['LOCAL_REQUEST'], endpoint)

def get_remote_app(provider_id):
    return getattr(current_app.social, provider_id)

class ConnectionNotFoundError(Exception): pass
class ConnectionExistsError(Exception): pass

class Connection(object):
    """
    A Connection represents a connection between a remote SaaS account with
    a user account of the local application.
    """
    def __init__(self, user_id, provider_id, provider_user_id, access_token, secret, 
                 display_name, profile_url=None, image_url=None, api=None, **kwargs):
        self.user_id = user_id
        self.provider_id = provider_id
        self.provider_user_id = provider_user_id
        self.access_token = access_token
        self.secret = secret
        self.display_name = display_name
        self.profile_url = profile_url
        self.image_url = image_url
        self.api = api
            
class ConnectionService(object):
    """
    A ConnectionService handles the persistence and querying of connections with
    SaaS providers to the local application's users.
    """
    
    def remove_connection(self, user_id, provider_id, provider_user_id, **kwargs):
        """
        Remove a single connection from a SaaS provider for the specified user
        """
        raise NotImplementedError("remove_connection method not implemented")
    
    def remove_all_connections(self, user_id, provider_id, **kwargs):
        """
        Remove all connections from a SaaS provider for the specified user
        """
        raise NotImplementedError("remove_all_connections method not implemented")
    
    def save_connection(self, user_id, provider_id, provider_user_id, access_token, secret, **kwargs):
        """
        Save a connection between a SaaS provider account and a local user account
        """
        raise NotImplementedError("save_connection method not implemented")
    
    def get_connection_by_provider_user_id(self, provider_id, provider_user_id, **kwargs):
        """
        Find a connection to a SaaS provider for the specified SaaS provider user ID
        """
        raise NotImplementedError("get_connection_by_provider_user_id method not implemented")
    
    def get_primary_connection(self, user_id, provider_id, **kwargs):
        """
        Get the first connection found for the specified SaaS provider to the currently logged in user.
        """
        raise NotImplementedError("get_current_user_connection method not implemented")
    
    def get_connection(self, user_id, provider_id, provider_user_id, **kwargs):
        """
        Get a specific connection for the specified user, provider, and provider user
        """
        raise NotImplementedError("get_connection method not implemented")


def _login_handler(provider_id, provider_user_id, oauth_response):
    """
    Shared method to handle the signin process
    """
    if current_user.is_authenticated():
        return redirect("/")
    
    display_name = get_display_name(provider_id)
    
    try:
        current_app.logger.debug('Attempting login via %s with provider user %s' % (display_name, provider_user_id))
        connection = connection_service.get_connection_by_provider_user_id(provider_id, provider_user_id)
        user = user_service.get_user_with_id(connection['user_id'])
        
        if login_user(user): 
            redirect_url = session.get('post_oauth_login_url', current_app.config['AUTH']['post_login_view'])
            session.pop('post_oauth_login_url', None)
            current_app.logger.debug('User logged in via %s. Redirecting to %s' % (display_name, redirect_url))
            return redirect(redirect_url)
        else: 
            current_app.logger.info('Inactive local user attempted login via %s.' % display_name)
            flash("Inactive user")
        
    except ConnectionNotFoundError:
        current_app.logger.info('Login attempt via %s failed because connection was not found.' % display_name)
        flash('%s account not associated with an existing user' % display_name)
        # TODO: Maybe redirect to a register page?
        
    except Exception, e:
        
        current_app.logger.error('Unexpected error signing in via %s: %s' % (display_name, e))
        
    social_login_failed.send(current_app._get_current_object(), provider_id=provider_id, oauth_response=oauth_response)
    redirect_url = session.get('oauth_login_fail_url', login_manager.login_view)
    session.pop('oauth_login_fail_url', None)
    return redirect(redirect_url)

def _connect_handler(connection_values, provider_id):
    """
    Shared method to handle the connection process
    """
    display_name = get_display_name(provider_id)
    
    try:
        connection = connection_service.save_connection(**connection_values)
        current_app.logger.debug('Connection to %s established for %s' % (display_name, current_user))
        social_connection_created.send(current_app._get_current_object(), user=current_user, connection=connection)
        flash("Connection established to %s" % display_name)
    except ConnectionExistsError, e:
        current_app.logger.debug('Connection to %s exists already for %s' % (display_name, current_user))
        flash("A connection is already established with %s to your account" % display_name)
        
    except Exception, e:
        current_app.logger.error('Unexpected error connecting %s account for user %s. Reason: %s' % (display_name, current_user, e))
        flash("Could not make connection to %s. Please try again later." % display_name)
    
    redirect_url = session.get('post_oauth_connect_url', current_app.config['SOCIAL']['connect_allow_view'])
    session.pop('post_oauth_connect_url', None)
    return redirect(redirect_url)

class ConnectionFactory(object):
    def __init__(self, provider_id, login_handler, connect_handler, **kwargs):
        self.provider_id = provider_id
        self.login_handler = login_handler
        self.connect_handler = connect_handler
        
    def _get_current_user_primary_connection(self):
        return self._get_primary_connection(current_user.get_id())
    
    def _get_primary_connection(self, user_id):
        return connection_service.get_primary_connection(user_id, self.provider_id)
    
    def _get_specific_connection(self, user_id, provider_user_id):
        return connection_service.get_connection(user_id, self.provider_id, provider_user_id)
    
    def _create_api(self, connection):
        raise NotImplementedError("create_api method not implemented")
    
    def get_connection(self, user_id=None, provider_user_id=None, **kwargs):
        if user_id == None and provider_user_id == None:
            connection = self._get_current_user_primary_connection()
        if user_id != None and provider_user_id == None:
            connection = self._get_primary_connection(user_id)
        if user_id != None and provider_user_id != None:
            connection = self._get_specific_connection(user_id, provider_user_id)
        
        return Connection(api=self._create_api(connection), **connection)
    
    def __call__(self, **kwargs):
        return self.get_connection(**kwargs)
    
class FacebookConnectionFactory(ConnectionFactory):
    def __init__(self, **kwargs):
        super(FacebookConnectionFactory, self).__init__('facebook', kwargs['login_handler'], kwargs['connect_handler'])
        
    def _create_api(self, connection):
        return facebook.GraphAPI(connection['access_token'])
    
class TwitterConnectionFactory(ConnectionFactory):
    def __init__(self, consumer_key, consumer_secret, **kwargs):
        super(TwitterConnectionFactory, self).__init__('twitter', kwargs['login_handler'], kwargs['connect_handler'])
        self.consumer_key = consumer_key
        self.consumer_secret = consumer_secret
        
    def _create_api(self, connection):
        return twitter.Api(consumer_key=self.consumer_key,
                           consumer_secret=self.consumer_secret, 
                           access_token_key=connection['access_token'], 
                           access_token_secret=connection['secret']) 
        
class OAuthHandler(object):
    """
    OAuthHandler
    """
    def __init__(self, provider_id):
        self.provider_id = provider_id
        
class LoginHandler(OAuthHandler):
    """
    A LoginHandler handles the login procedure after receiving authorization
    from the service provider. The goal of a LoginHandler is to retrieve the
    user ID of the account that granted access to the local application. This
    ID is then used to find a connection within the local application to the
    provider. If a connection is found, the local user is retrieved from the
    user service and logged in autmoatically. 
    """
    def get_provider_user_id(self, response):
        raise NotImplementedError("get_provider_user_id method not implemented")
    
    def __call__(self, response):
        display_name = get_display_name(self.provider_id)
        current_app.logger.debug('Received login response from %s. %s' % (display_name, response))
        
        if response is None:
            flash("Access was denied to your % account" % display_name)
            return redirect(login_manager.login_view)
        
        return _login_handler(self.provider_id, self.get_provider_user_id(response), response)
    
class TwitterLoginHandler(LoginHandler):
    """
    TwitterLoginHandler handles the authorization response from Twitter. The
    Twitter account's user ID is passed with the authorization response and an
    extra API call is not necessary, which is pretty convenient.
    """ 
    def __init__(self, **kwargs):
        super(TwitterLoginHandler, self).__init__('twitter')
        
    def get_provider_user_id(self, response):
        return response['user_id'] if response != None else None
    
    
class FacebookLoginHandler(LoginHandler):
    """
    FacebookLoginHandler handles the authorization response from Facebook. The
    Facebook account's user ID is not passed in the response, thus it must be
    retrieved with an API call. This handler is dependent on the Python Facebook
    library to perform the API call.
    """
    def __init__(self, **kwargs):
        super(FacebookLoginHandler, self).__init__('facebook')
        
    def get_provider_user_id(self, response):
        if response != None:
            graph = facebook.GraphAPI(response['access_token'])
            profile = graph.get_object("me")
            return profile['id']
        return None

class ConnectHandler(OAuthHandler):
    """
    A ConnectionHandler handles the connection procedure after receiving 
    authorization from the service provider. The goal of a ConnectHandler is 
    to retrieve the connection values that will be persisted by the connection
    service. The connection values should be a dictionary holding values for
    the following keys: user_id, provider_id, provider_user_id, access_token,
    and secret. 
    """ 
    def get_connection_values(self, response):
        raise NotImplementedError("get_connection_values method not implemented")
    
    def __call__(self, response):
        display_name = get_display_name(self.provider_id)
        current_app.logger.debug('Received connect response from %s. %s' % (display_name, response))
        
        if response is None:
            flash("Access was denied by %s" % display_name)
            return redirect(current_app.config['SOCIAL']['connect_deny_view'])
        
        return _connect_handler(self.get_connection_values(response), self.provider_id)
    
        
class TwitterConnectHandler(ConnectHandler):
    """
    TwitterConnectHandler handles the connection procedure after a user authorizes
    a connection from Twitter. The connection values are all retrieved from the 
    response, no extra API calls are necessary.
    """
    def __init__(self, **kwargs):
        super(TwitterConnectHandler, self).__init__('twitter')
        self.consumer_key = kwargs['consumer_key']
        self.consumer_secret = kwargs['consumer_secret']
        
    def get_connection_values(self, response=None):
        api = twitter.Api(consumer_key=self.consumer_key,
                           consumer_secret=self.consumer_secret, 
                           access_token_key=response['oauth_token'], 
                           access_token_secret=response['oauth_token_secret'])
        
        user = api.VerifyCredentials()
        
        return None if response == None else {
            "user_id": current_user.get_id(),
            "provider_id": self.provider_id,
            "provider_user_id": user.id,
            "access_token": response['oauth_token'],
            "secret": response['oauth_token_secret'],
            "display_name": '@%s' % user.screen_name,
            "profile_url": "http://twitter.com/%s" % user.screen_name,
            "image_url": user.profile_image_url
        }
        
class FacebookConnectHandler(ConnectHandler):
    """
    FacebookConnectHandler handles the connection procedure after a user authorizes
    a connection from Facebook. The Facebook acount's user ID is retrieved via an
    API call, otherwise the token is provided by the response from Facebook.
    """
    def __init__(self, **kwargs):
        super(FacebookConnectHandler, self).__init__('facebook')
        
    def get_connection_values(self, response):
        if response:
            access_token = response['access_token']
            
            graph = facebook.GraphAPI(access_token)
            profile = graph.get_object("me")
            
            return {
                "user_id": current_user.get_id(),
                "provider_id": self.provider_id,
                "provider_user_id": profile['id'],
                "access_token": access_token,
                "secret": None,
                "display_name": profile['username'],
                "profile_url": "http://facebook.com/profile.php?id=%s" % profile['id'],
                "image_url": "http://graph.facebook.com/%s/picture" % profile['id']
            }
            
        return None

def _configure_provider(app, blueprint, oauth, provider_id, provider_config):
    """
    Configures the service provider and its connect and login routes. The remote 
    app is then registered with the main application and is accessible through:
    
        from flask import current_app
        current_app.social.<provider_id>
    """
    oauth_config = provider_config['oauth']
    
    try:
        oauth_config['consumer_key']
        oauth_config['consumer_secret']
    except KeyError:
        raise Exception('consumer_key and/or consumer_secret not found for provider %s' % provider_config['display_name'])
    
    service_provider = oauth.remote_app(provider_id, **oauth_config)
    connect_handler = get_class_by_name(provider_config['connect_handler'])(**oauth_config)
    login_handler = get_class_by_name(provider_config['login_handler'])(**oauth_config)
    
    factory = get_class_by_name(provider_config['connection_factory'])(login_handler=login_handler, connect_handler=connect_handler, **oauth_config)
    setattr(factory, 'remote_app', service_provider)
    setattr(app.social, provider_id, factory)
    
    @service_provider.tokengetter
    def get_token():
        # No need to return a token since the remote app from the oauth extension
        # is kind of bogus. Using API wrappers/bindings for specific services is
        # preferred and accessed through the connection factories
        return None    
    
    @blueprint.route('/connect/%s' % provider_id, methods=['GET'], endpoint='connect_%s_callback' % provider_id)
    @login_required
    @service_provider.authorized_handler
    def connect_callback(response):
        return connect_handler(response)
    
    @blueprint.route('/login/%s' % provider_id, methods=['GET'], endpoint='login_%s_callback' % provider_id)
    @service_provider.authorized_handler
    def login_callback(response):
        return login_handler(response)
    
        
class Social(object):
    """
    Social adds integration with various SaaS providers to your application. Currently Twitter
    and Facebook are supported. When properly configured, Social will add endpoints to your app
    that allows for users to login via SaaS providers and connect their SaaS provider accounts
    with their local account.
    """
    def __init__(self, app=None):
        self.init_app(app)
        
    def init_app(self, app):
        if app is None: return
        
        blueprint = Blueprint('social', __name__)
        
        config = default_config.copy()
        try: config.update(app.config['SOCIAL'])
        except: pass
        app.config['SOCIAL'] = config
        
        # Update the service provider configurations
        social_providers_config = {}
        
        if 'SOCIAL_PROVIDERS' in app.config:
            for provider, provider_config in default_provider_config.items():
                if provider in app.config['SOCIAL_PROVIDERS']:
                    d_config = provider_config.copy()
                    d_oauth_config = d_config['oauth'].copy()
                    
                    d_config.update(app.config['SOCIAL_PROVIDERS'][provider])
                    d_oauth_config.update(app.config['SOCIAL_PROVIDERS'][provider]['oauth'])
                    d_config['oauth'] = d_oauth_config
                    
                    social_providers_config[provider] = d_config
                
        app.config['SOCIAL_PROVIDERS'] = social_providers_config
                
        app.logger.debug('Social Configuration: %s' % app.config['SOCIAL'])
        app.logger.debug('Social Provider Configuration: %s' % app.config['SOCIAL_PROVIDERS'])
        
        # Connection service name
        app.oauth = OAuth()
        app.social = self
        
        @blueprint.route('/login/<provider_id>', methods=['POST'])
        def login(provider_id):
            if current_user.is_authenticated():
                return redirect("/")
            callback_url = get_authorize_callback('/login/%s' % provider_id)
            current_app.logger.debug('Starting login via %s account. Callback URL = %s' % (get_display_name(provider_id), callback_url))
            session['post_oauth_login_url'] = request.form.get('next', current_app.config['AUTH']['post_login_view'])
            return get_remote_app(provider_id).remote_app.authorize(callback_url)
        
        @blueprint.route('/connect/<provider_id>', methods=['POST'])
        @login_required
        def connect(provider_id):
            callback_url = get_authorize_callback('/connect/%s' % provider_id)
            current_app.logger.debug('Starting process of connecting %s account to user account %s. Callback URL = %s' % (get_display_name(provider_id), current_user, callback_url))
            session['post_oauth_connect_url'] = request.form.get('next', current_app.config['SOCIAL']['connect_allow_view'])
            return get_remote_app(provider_id).remote_app.authorize(callback_url)
        
        @blueprint.route('/connect/<provider_id>', methods=['DELETE'])
        @login_required
        def remove_all_connections(provider_id):
            try:
                display_name = get_display_name(provider_id)
                connection_service.remove_all_connections(current_user.get_id(), provider_id)
                current_app.logger.debug('Removed all connections to %s for %s' % (provider_id, current_user))
                flash("Connections to %s removed" % display_name)
            except: 
                current_app.logger.error('Unable to remove all connections to %s for %s' % (get_display_name(provider_id), current_user))
                flash("Unabled to remove connection")
            return redirect(request.referrer)
            
        @blueprint.route('/connect/<provider_id>/<provider_user_id>', methods=['DELETE'])
        @login_required
        def remove_connection(provider_id, provider_user_id):
            try:
                display_name = get_display_name(provider_id)
                connection_service.remove_connection(current_user.get_id(), provider_id, provider_user_id)
                current_app.logger.debug('Removed connection to %s for %s' % (provider_id, current_user))
                flash("Connection to %s removed" % display_name)
            except:
                current_app.logger.error('Unable to remove connection to %s/%s for %s' % (get_display_name(provider_id), provider_user_id, current_user))
                flash("Unabled to remove connection")
            return redirect(request.referrer)
        
        # Setup handlers for the configured providers
        for provider_id, provider_config in app.config['SOCIAL_PROVIDERS'].items():
            _configure_provider(app, blueprint, app.oauth, provider_id, provider_config)
            
        app.register_blueprint(blueprint, url_prefix=app.config['SOCIAL']['url_prefix'])
        
        
        
# Signals

social_connection_created = _signals.signal("connection-created")

social_login_failed = _signals.signal("login-failed")