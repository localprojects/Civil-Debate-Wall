import types
import smtplib

from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.utils import COMMASPACE

from boto.ses import SESConnection
from flask import current_app

class AmazonSender(object):

    client = None

    def __init__(self, aws_key, aws_secret):
        self.aws_key = aws_key
        self.aws_secret = aws_secret

    def send_email(self, sender,
                         to_addresses,
                         subject,
                         text,
                         html=None,
                         reply_addresses=None,
                         sender_ascii=None):
        if current_app.config['ENVIRONMENT'] == 'development':
            current_app.logger.debug('No email will be sent in development mode')
            return
        
        if not sender_ascii:
            sender_ascii = sender

        client = self.get_client()

        message = MIMEMultipart('alternative')
        message.set_charset('UTF-8')

        message['Subject'] = _encode_str(subject)
        message['From'] = _encode_str(sender)
        message['To'] = _convert_to_strings(to_addresses)

        if reply_addresses:
            message['Reply-To'] = _convert_to_strings(reply_addresses)

        message.attach(MIMEText(_encode_str(text), 'plain'))

        if html:
            message.attach(MIMEText(_encode_str(html), 'html'))
        
        
        return client.send_raw_email(message.as_string(), sender_ascii,
                                     destinations=to_addresses)

    def vertify_email(self, email):
        client = self.get_client()
        return client.verify_email_address(email)

    def get_client(self):
        if not self.client:
            self.client = SESConnection(self.aws_key,
                                        self.aws_secret)
        return self.client


#--- Helpers ----------------------------------------------
def _convert_to_strings(list_of_strs):
    if isinstance(list_of_strs, (list, tuple)):
        result = COMMASPACE.join(list_of_strs)
    else:
        result = list_of_strs
    return _encode_str(result)

def _encode_str(s):
    if type(s) == types.UnicodeType:
        return s.encode('utf8')
    return s


def send_contact(**kwargs):
    msg = """
First Name: %(firstname)s
Last Name: %(lastname)s
Email: %(email)s
Feedback Type: %(feedback)s

Comment:
%(comment)s
"""
    contact_email = current_app.config['CDW']['contact_email']
    current_app.emailer.send_email(
        contact_email,
        [contact_email],
        'The Wall Contact Form: %s' % kwargs['feedback'],
        msg % kwargs)
    
def send_forgot_password(recipient, password):
    msg = """
Your password for civildebatewall.com is:

%s
"""
    contact_email = current_app.config['CDW']['contact_email']
    current_app.emailer.send_email(
        contact_email,
        [recipient],
        'Your password for civildebatewall.com',
        msg % password)
    
def send_reply_notification(recipient, context):
    msg = """
%(message)s

Do not reply to this email.

Click the link below to unsubscribe from email notifications about this debate
%(local_request)s/notifications/unsubscribe/%(user_id)s/%(thread_id)s

Click the link below to unsubscribe from all email notifications
%(local_request)s/notifications/unsubscribe/%(user_id)s/all
"""

    msg_html = """
<p>%(message)s</p>

<p><em>Do not reply to this email.</em></p>

<p><a href="%(local_request)s/notifications/unsubscribe/%(user_id)s/%(thread_id)s">Click here to unsubscribe from email notifications of this debate</a><br/>
<a href="%(local_request)s/notifications/unsubscribe/%(user_id)s/all">Click here to unsubscribe from all email notifications</a></p>
"""
    contact_email = current_app.config['CDW']['contact_email']
    current_app.emailer.send_email(
        contact_email,
        [recipient],
        'A user replied to a debate you are following',
        msg % context,
        html=msg_html % context)
    
def forgot_password():
    pass

def init(app):
    app.emailer = AmazonSender(app.config['CDW']['aws']['access_key_id'],
                               app.config['CDW']['aws']['secret_access_key'])