"""
Default configuration values
"""
import os

ENVIRONMENT = 'development'

DEBUG = True
TESTING = False
SECRET_KEY = 'secretkey'

HOST_SCHEME = 'http'
HOST_DOMAIN = 'dev.www.civildebatewall.com'
HOST_PORT = 5000

ADMIN_EMAILS = ['matt@localprojects.net']

# Logging
LOG_EMAIL_SENDER = 'errors@framework.com'
LOG_EMAIL_SERVER = '127.0.0.1'
LOG_EMAIL_LEVEL = 'ERROR'

LOG_FILE_NAME = '%s/log/main.log' % os.getcwd()
LOG_FILE_LEVEL = 'DEBUG'

MEDIA_ROOT = '/static'

CDW = {
    'mongodb': {
        'db': 'cdw_flask',
        'username': None,
        'password': None,
        'host': 'localhost',
        'port': 27017,
    },
       
    'image_storage': {
        'type': 'local',
        'temp_dir': '%s/static/tmp' % os.getcwd(),
        'user_images_dir': '%s/static/images/users' % os.getcwd(),
    },
       
    'kiosks': {
        'kiosk_1': '3522755271',
        'kiosk_2': 'phone_number',
        'kiosk_3': 'phone_number',
        'kiosk_4': 'phone_number',
        'kiosk_5': 'phone_number',
    },
       
    'twilio': {
        'account_sid': 'AC758bf16fe0a49b5b12dd6d7b2bbf8a73',
        'auth_token': 'b58daf22df0816a600dd99abf3d35bd4',
        'app_id': 'AP05417dd84e5b31bfe413da236755d6de',
        'switchboard_number': '+13525052006',
        'incoming_sms_collection': 'smsreceive',
        'status_sms_collection': 'smsstatus',
    },
      
    'aws': {
        'access_key_id': 'AKIAIUP6UG5LN4CTQS7A',
        'secret_access_key': '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',
        's3bucket': 'cdw-testing',
    },
       
    'beanstalk': {
        'host': 'localhost',
        'port': 11300,
    },
    
    'smsqueue': {
        'use': False,
        'tube_name': 'sms_outgoing',
    },
       
   'bitly': {
        'username': 'o_3r5u8hlsd5',
        'api_key': 'R_e064bcd77e5670e8060e3f130b12fea9',
    },  
}

CDWAPI = {
    'url_prefix': '/api',
    'secret_key': 'secretkey',
}

AUTH = {
  'user_service_name': 'cdw',
  'password_encryptor': 'auth.NoOpPasswordEncryptor',
  'salt': 'salty',
}

# Flask-Cache
CACHE_TYPE = 'filesystem'
CACHE_DIR = '/Users/mattwright/Workspace/framework-flask/cache'

# Social
SOCIAL_PROVIDERS = {
    'facebook': {
        'oauth': {
            'consumer_key':    '264488170238614',
            'consumer_secret': 'f2ff313593d664850c028fb1450a09e4',
            'request_token_params': {
                'scope': 'email',
            }
        }
    }
}

LOCAL_REQUEST = 'http://dev.www.civildebatewall.com:5000'

