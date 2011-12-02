"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
import hashlib
from cdw.forms import has_bad_words
from cdw.models import Post
from cdw.services import cdw, EntityNotFoundException, MongoengineService
from cdwapi.models import SMSRegistrationMessage
from cdwapi.services import TwilioService
from flask import Blueprint, abort, current_app, request, make_response, json
from flaskext.login import current_user, request
from functools import wraps
from mongoengine.queryset import QuerySet
from werkzeug.local import LocalProxy

cdwapi = LocalProxy(lambda: current_app.cdwapi)

default_config = {
    'URL_PREFIX': None,
    'SECRET_KEY': 'secretkey',
}

# need this because flask's jsonify function doesn't support lists
def jsonify(data, status=200):
    def try_as_dict(data):
        try: return data.as_dict()
        except: return data
    
    if isinstance(data, list) or isinstance(data, QuerySet):
        data = [try_as_dict(x) for x in data]
    elif not isinstance(data, dict):
        data = try_as_dict(data)
    
    default_value = [] if isinstance(data, list) else {}
    response = make_response(
        json.dumps(data, default=default_value, indent=2 ), status)
    response.headers['Content-Type'] = "application/json"
    return response

def has_valid_auth_token():
    secret_key = current_app.config['CDWAPI']['secret_key']
    hashed = hashlib.sha1(secret_key).hexdigest()
    http_token = request.headers.get('X-Auth-Token', None)
    return True if hashed == http_token or \
                   secret_key.lower() == "false" or \
                   secret_key == "none" else False 

def not_found_on_error(fn):
    @wraps(fn)
    def decorated_view(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except EntityNotFoundException:
            abort(404)
    return decorated_view

def auth_token_required(fn):
    @wraps(fn)
    def decorated_view(*args, **kwargs):
        if has_valid_auth_token():
            return fn(*args, **kwargs)
        else:
            abort(403)
    return decorated_view
     
def auth_token_or_logged_in_required(fn):
    @wraps(fn)
    def decorated_view(*args, **kwargs):
        if has_valid_auth_token() or current_user.is_authenticated():
            return fn(*args, **kwargs)
        else:
            abort(403)   
    return decorated_view

def admin_required(fn):
    @wraps(fn)
    def decorated_view(*args, **kwargs):
        if current_user.is_admin():
            return fn(*args, **kwargs)
        else:
            abort(403)
    return decorated_view

class CDWApi(object):
    def __init__(self, app=None):
        self.init_app(app)
        
    def init_app(self, app):
        if app is None: return
        
        blueprint = Blueprint('cdwapi', __name__)
        
        config = default_config.copy()
        config.update(app.config.get('CDWAPI', {}))
        
        self.config = config
        self.sms = MongoengineService(SMSRegistrationMessage)
        self.switchboard_number = app.config['CDW']['twilio']['switchboard_number']
        app.twilio = TwilioService()
        
        app.cdwapi = self
        
        from cdwapi.views import load_views
        load_views(blueprint)
        
        app.register_blueprint(blueprint, url_prefix=config['url_prefix'])
        
    def save_incoming_sms(self, kiosk_number, phone, message):
        msg = SMSRegistrationMessage(kioskNumber=kiosk_number, phoneNumber=phone, 
                                     message=message, profane=has_bad_words(message))
        self.sms.save(msg)
        return msg
    
    def get_recent_sms_messages(self, kiosk_number):
        return [x.as_dict() for x in self.sms.with_fields(
                    **{"kioskNumber":kiosk_number}).order_by('-created')[:5]]
    
    def stop_sms_updates(self, user):
        if user.phoneNumber == None: return False
        
        if user.receiveSMSUpdates:
            user.receiveSMSUpdates = False;
            cdw.users.save(user)
            
            current_app.logger.info('Stopped SMS updates, sending notification '
                                    'to %s' % user.phoneNumber)
            
            msg = "Message following stopped. To start again, text " \
                  "back START, or begin a new debate at the wall."
                  
            current_app.twilio.send_message(msg, 
                                            self.switchboard_number, 
                                            [user.phoneNumber])
            return True
        
        return False
    
    def start_sms_updates(self, user, thread=None):
        if user.phoneNumber == None:
            return False
        
        user.threadSubscription = thread or user.threadSubscription
        user.receiveSMSUpdates = True;
        cdw.users.save(user)
            
        current_app.logger.info('Started SMS updates, sending notification '
                                'to %s' % user.phoneNumber)
        
        msg = "Message following started. To stop, text back STOP."
        
        current_app.twilio.send_message(msg, 
                                        self.switchboard_number, 
                                        [user.phoneNumber])
        return True
    
    def revert_sms_subscription(self, user):
        if user.phoneNumber == None: return False
        
        if user.previousThreadSubscription != None:
            user.threadSubscription = user.previousThreadSubscription;
            user.previousThreadSubscription = None
            cdw.users.save(user)
            
            current_app.logger.info('Reverted SMS subscription '
                                    'for %s' % user.phoneNumber)
            
            msg = "Got it. We've changed your subscription " \
                  "to the previous debate."
                  
            current_app.twilio.send_message(msg, 
                                            self.switchboard_number, 
                                            [user.phoneNumber])
            
            return True
        return False
    
    def post_via_sms(self, user, message):
        if not user.receiveSMSUpdates:
            # TODO: Send a message that says they need to turn on SMS updates?
            abort(500)
        
        if user.threadSubscription == None:
            # TODO: Send a message saying they haven't posted anything yet?
            abort(500)
        
        if has_bad_words(message):
            current_app.logger.info('Received an SMS message with some ' 
                                    'foul language: %s' % message)
            
            msg = "Looks like you used some foul language. " \
                  "Try sending a more 'civil' message!"
                  
            current_app.twilio.send_message(msg, 
                                            self.switchboard_number, 
                                            [user.phoneNumber])
            abort(500)
        
        try:
            thread = user.threadSubscription
            lastPost = cdw.posts.with_fields_first(
                        **{"author": user, "thread": user.threadSubscription})
            
            p = Post(yesNo=lastPost.yesNo, 
                     author=user, 
                     text=message, 
                     thread=thread, 
                     origin="cell")
            
            cdw.posts.save(p)
            
            current_app.logger.info('Message posted via SMS: from: '
                            '"%s", message="%s"' % (user.phoneNumber, message))
            
            subscribers = [u.phoneNumber for u in cdw.users.with_fields(
                **{"threadSubscription":thread}) if str(u.id) != str(user.id) and u.receiveSMSUpdates]
            
            message = "%s: %s" % (p.author.username, p.text)
            
            current_app.twilio.send_message(message, 
                                            self.switchboard_number, 
                                            subscribers)
        except Exception, e:
            current_app.logger.error('Error posting via SMS: %e' % e)
            abort(500)