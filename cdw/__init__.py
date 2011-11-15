from flask import Flask
from flaskext.wtf import Form
from flaskext.login import current_user
from flask import abort
from functools import wraps

def admin_required(fn):
    @wraps(fn)
    def decorated_view(*args, **kwargs):
        if not current_user.is_authenticated() or not current_user.isAdmin:
            abort(403)
        else:
            return fn(*args, **kwargs)
    return decorated_view

app = Flask(__name__)
try: 
    print 'loading config'
    app.config.from_object('instance.config')
except Exception, e: 
    print 'could not load config: %s' % e
    
print app.config
# Application specific stuff
from . import assets
assets.init(app)

from . import database
database.init(app)

from . import filestores
filestores.init(app)

from . import logging
logging.init(app)

from . import middleware
middleware.init(app)

from . import services
services.init(app)

from . import signals
signals.init(app)

from . import views
views.init(app)

from . import views_admin
views_admin.init(app)

from . import views_crud
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
    ga_id = app.config['CDW']['google_analytics_id']
    ga_id = None if ga_id == 'None' or ga_id == '' else ga_id 
    return {
        'facebook_app_id': app.config['SOCIAL_PROVIDERS']['facebook']['oauth']['consumer_key'],
        'google_analytics_id': ga_id,
        'media_root': app.config['MEDIA_ROOT'], 
        'csrf_token': form.csrf.data, 
    }