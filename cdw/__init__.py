import sys, mongoengine
from flask import Blueprint, render_template, current_app, request
from flaskext.login import login_required, current_user
from cdw.services import CDW

blueprint = Blueprint('cdw', __name__, template_folder='templates')

settings = {}

def lower_keys(x):
    if isinstance(x, list):
        return [lower_keys(v) for v in x]
    if isinstance(x, dict):
        return dict((k.lower(), lower_keys(v)) for k, v in x.iteritems())
    return x

def connect_mongo(settings):
    return mongoengine.connect(**lower_keys(settings))

def initialize(app, settingz):
    settings.update(settingz)
    
    app.logger.debug("CDW Settings: %s" % settings)
    
    app.database = connect_mongo(settings['MONGODB'])
    app.cdw = CDW()
    
    from cdw.views import load_views
    load_views()