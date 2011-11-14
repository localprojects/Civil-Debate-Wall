from flask import Flask
from flaskext.wtf import Form

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

from cdw import views_admin
views_admin.init(app)

from cdw import views_crud
views_crud.init(app)

# Other stuff
import auth
auth.Auth(app)

import social
social.Social(app)

import cdwapi
cdwapi.CDWApi(app)

app.logger.debug(app.url_map)

@app.context_processor
def inject_common_values():
    form = Form() 
    return {
        'twitter_api_key': app.config['CDW']['twitter']['app_id'], 
        'facebook_app_id': app.config['SOCIAL_PROVIDERS']['facebook']['oauth']['consumer_key'],
        'media_root': app.config['MEDIA_ROOT'], 
        'csrf_token': form.csrf.data, 
    }