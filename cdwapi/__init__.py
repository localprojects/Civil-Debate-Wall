"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
import hashlib
import time
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
        if not user.phoneNumber or \
           not user.receiveSMSUpdates: 
            return False
        
        user.receiveSMSUpdates = False;
        cdw.users.save(user)
        
        msg = "Message following stopped. To start again, text " \
              "back START, or begin a new debate."
              
        current_app.twilio.send_message(msg, 
                                        self.switchboard_number, 
                                        [user.phoneNumber])
        return True
    
    def resume_sms_updates(self, user):
        if not user.phoneNumber or \
           user.receiveSMSUpdates or \
           not user.threadSubscription:
            return False
        
        user.receiveSMSUpdates = True
        cdw.users.save(user)
        
        message = "You will now begin to receive SMS updates for the last " \
                  "debate you participated in."
                  
        self.send_sms_message(message, [user.phoneNumber])
    
    def start_sms_updates(self, user, thread):
        if not user.phoneNumber or \
           user.threadSubscription == thread:
            return False
        
        switched_msg = "You can follow one debate at a time via SMS. We " \
                       "will switch to the debate you joined" \
                       ". If you want to stay in your previous debate, " \
                       "text back STAY."
                       
        message = "You are now subscribed to the debate you joined. " \
                  "You can reply to messages you receive via SMS " \
                  "to continue the debate. To stop these messages " \
                  "text back STOP."
        
        all_users = cdw.users.with_fields(
                        phoneNumber=user.phoneNumber).order_by('-lastPostDate')
        
        previous = None
        
        if len(all_users) == 1:
            
            if user.threadSubscription != None:
                previous = user.threadSubscription
                message = switched_msg
                
        else:
            if user.origin == 'web' and \
               user.previousThreadSubscription == None and \
               all_users[1].origin =='kiosk' and \
               all_users[1].threadSubscription != None:
            
                current_app.logger.info('Setting previous thread subscription '
                                        'for web user based on last kiosk '
                                        'interaction')
                
                previous = all_users[1].threadSubscription
                message = switched_msg
                
            if user.origin == 'kiosk' and \
               user.previousThreadSubscription == None and \
               all_users[1].origin =='web' and \
               all_users[1].threadSubscription != None:
            
                current_app.logger.info('Setting previous thread subscription '
                                        'for kiosk user based on last web '
                                        'interaction')
                
                previous = all_users[1].threadSubscription
                message = switched_msg
           
        for u in all_users[1:]:
            u.threadSubscription = None
            u.previousThreadSubscription = None
            cdw.users.save(u)
        
        user.threadSubscription = thread
        user.previousThreadSubscription = previous
        user.receiveSMSUpdates = True;
        cdw.users.save(user)
        
        current_app.twilio.send_message(message, 
                                        self.switchboard_number, 
                                        [user.phoneNumber])
        return True
    
    def revert_sms_updates(self, user):
        if not user.phoneNumber or \
           not user.previousThreadSubscription:
            return False
        
        user.threadSubscription = user.previousThreadSubscription;
        user.previousThreadSubscription = None
        cdw.users.save(user)
        
        msg = "Got it. We've changed your subscription " \
              "to the previous debate."
              
        current_app.twilio.send_message(msg, 
            self.switchboard_number, [user.phoneNumber])
        
        return True
        
    def send_sms_message(self, message, recipients):
        current_app.twilio.send_message(message, 
            self.switchboard_number, recipients)
            
    def notify_sms_subscribers(self, thread, exclude, message):
        subscribers = cdw.users.with_fields(threadSubscription=thread)
        
        # Just their phone numbers
        subscribers = [ u.phoneNumber \
                        for u in subscribers \
                        if u.phoneNumber not in exclude and u.receiveSMSUpdates ]
        
        self.send_sms_message(message, subscribers)
        
    def start_email_updates(self, user, thread):
        if user not in thread.emailSubscribers:
            thread.emailSubscribers.append(user)
            cdw.threads.save(thread)
        
    def stop_email_updates(self, user, thread):
        thread.emailSubscribers.remove(user)
        cdw.threads.save(thread)
        
    def stop_all_email_updates(self, user):
        thread_subscriptions = cdw.threads.with_fields(emailSubscribers=user)
        
        for thread in thread_subscriptions:
            self.stop_email_updates(user, thread)
            
    def notify_email_subscribers(self, thread, exclude, message):
        subscribers = [u for u in thread.emailSubscribers \
                       if u.email not in exclude]
        
        from cdw.emailers import send_reply_notification
        
        for s in subscribers:
            ctx = dict(question_id=str(thread.question.id),
                       thread_id=str(thread.id), 
                       user_id=str(s.id),
                       local_request=current_app.config['LOCAL_REQUEST'],
                       message=message)
            
            attempts = 0;
            attempts_allowed = 5
            
            current_app.logger.debug('Attempting to send email to %s' % s.email)
            
            while True:
                try:
                    send_reply_notification(s.email, ctx)
                    break
                
                except Exception, e:
                    attempts += 1
                    if attempts == attempts_allowed:
                        current_app.logger.error(
                            "Error sending email notification: %s" % e)
                        break;
                    else:
                        current_app.logger.warn(
                            "Attempt %s to send email failed. "
                            "Error: %s" % (attempts, e))
                        
                    time.sleep(1)
                
    def post_via_sms(self, user, message):
        if not user.receiveSMSUpdates or \
           user.threadSubscription == None:
            abort(500)
        
        
        if has_bad_words(message):
            msg = "Looks like you used some foul language. " \
                  "Try sending a more 'civil' message!"
                  
            self.send_sms_message(msg, [user.phoneNumber])
        
        current_app.logger.debug('post via sms')
        
        try:
            thread = user.threadSubscription
            current_app.logger.debug('thread: ' % thread)
            
            lastPost = cdw.posts.with_fields_first(
                author=user, thread=thread)
            
            p = Post(yesNo=lastPost.yesNo, 
                     author=user, 
                     text=message, 
                     thread=thread, 
                     origin="cell")
            
            cdw.post_to_thread(thread, p)
            
        except Exception, e:
            current_app.logger.error('Error posting via SMS: %s' % e)
        
        #abort(500)