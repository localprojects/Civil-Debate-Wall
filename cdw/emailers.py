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
    current_app.emailer.send_email(
        kwargs['email'],
        [current_app.config['CDW']['contact_email']],
        'The Wall Contact Form: %s' % kwargs['feedback'],
        msg % kwargs)
    
    
def send_reply_notification():
    pass

def forgot_password():
    pass

def init(app):
    app.emailer = AmazonSender(app.config['CDW']['aws']['access_key_id'],
                               app.config['CDW']['aws']['secret_access_key'])