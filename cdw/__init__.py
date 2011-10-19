from flask import Flask

app = Flask(__name__)
app.config.from_object('cdw.config')

try: app.config.from_object('instance.config')
except: pass

# Application specific stuff
from cdw import assets
assets.init(app)

from cdw import database
database.init(app)

from cdw import filestores
filestores.init(app)

from cdw import logging
logging.init(app)

from cdw import middleware
middleware.init(app)

from cdw import services
services.init(app)

from cdw import signals
signals.init(app)

from cdw import views
views.init(app)

# Other stuff
import auth
auth.Auth(app)

import social
social.Social(app)

import cdwapi
cdwapi.CDWApi(app)

@app.context_processor
def inject_common_values():
    return { 
        'facebook_app_id': app.config['SOCIAL_PROVIDERS']['facebook']['oauth']['consumer_key'],
        'media_root': app.config['MEDIA_ROOT'], 
    }