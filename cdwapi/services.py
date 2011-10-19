import beanstalkc, os
from cdw.services import cdw
from cdw.forms import normalize_phonenumber
from twilio.rest import TwilioRestClient
from flask import current_app

class TwilioService(object):
    def send_message(self, message, sender, recipients=[], raise_queue_errors=False):
        if not current_app.config['CDW']['smsqueue']['use']:
            return self._do_send_message(message, sender, recipients)
            
        # Quick msg validation
        message = message.strip()
        if len(message) == 0:
            raise Exception("Message length must be greater than 0")
        
        try:
            host = current_app.config['CDW']['beanstalk']['host']
            port = current_app.config['CDW']['beanstalk']['port']
            beanstalk = beanstalkc.Connection(host=host, port=port)
            beanstalk.use(current_app.config['CDW']['smsqueue']['tube_name'])
        except Exception, e:
            current_app.logger.error('Could not connect to beanstalk at %s:%s' % (host, port))
            return
        
        msg_amt = 0;
        for recipient in recipients:
            try:
                beanstalk.put(str({
                    "account_id": current_app.config['CDW']['twilio']['account_sid'],
                    "auth_token": current_app.config['CDW']['twilio']['auth_token'],
                    "app_id": current_app.config['CDW']['twilio']['app_id'],
                    "sender": normalize_phonenumber(sender),
                    "recipient": normalize_phonenumber(recipient),
                    "message": message,
                }))
                msg_amt += 1
            except Exception, e:
                current_app.logger.error('Could not add SMS message into beanstalk queue: %s' % e)
        
        beanstalk.close()        
        current_app.logger.info('Added %s messages ot the outgoing SMS queue' % msg_amt)
                
    def _do_send_message(self, message, sender, recipients=[]):
        # Stupid hack to not post to Twilio every time we run the unit tests
        # See /test/__init__.py for environment variable
        
        current_app.logger.warning('Sending %s SMS messages to Twilio via web app and not SMS queue. Performance could be compromised.' % len(recipients))
        client = TwilioRestClient(current_app.config['CDW']['twilio']['account_sid'], 
                                  current_app.config['CDW']['twilio']['auth_token'])
        successful = 0;
        failed = 0;    
        for recipient in recipients: 
            try:
                current_app.logger.info("Sending SMS Message to %s\n%s" % (recipient, message))
                
                if not current_app.config['TESTING']:
                    client.sms.messages.create(recipient, sender, message, None, 
                                               current_app.config['CDW']['twilio']['app_id'])
                else:
                    current_app.logger.debug('SMS will not be sent in testing mode')
                    
                successful += 1
            except Exception, e:
                failed += 1
                current_app.logger.error('Unable to call Twilio API: %s' % e)
                
        if successful > 0:
            current_app.logger.info("Successfully sent %s SMS messages to Twilio for processing." % successful)
            
        if failed > 0:
            current_app.logger.error("Failed to send %s SMS messages to Twilio for processing." % failed)