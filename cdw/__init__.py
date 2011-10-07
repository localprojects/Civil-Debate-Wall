import sys, mongoengine
from cdw.services import CDWService
from flask import Blueprint, render_template, current_app, request
from flaskext.login import login_required, current_user
from werkzeug.local import LocalProxy

database = LocalProxy(lambda: current_app.database)
cdw = LocalProxy(lambda: current_app.cdw)

default_config = {
    'MONGODB': {
        'DB': 'cdw',
        'USERNAME': None, 
        'PASSWORD': None, 
        'HOST': 'localhost',
        'PORT': 27017,
    }
}

def lower_keys(x):
    if isinstance(x, list):
        return [lower_keys(v) for v in x]
    if isinstance(x, dict):
        return dict((k.lower(), lower_keys(v)) for k, v in x.iteritems())
    return x

def connect_mongo(settings):
    return mongoengine.connect(**lower_keys(settings))

class CDW(object):
    def __init__(self, app=None):
        self.init_app(app)
        
    def init_app(self, app):
        if app is None: return
        
        #blueprint = Blueprint('cdw', __name__, template_folder='templates', static_folder='/cdw/static')
        
        config = default_config.copy()
        config.update(app.config.get('CDW', {}))
        self.config = config
        
        app.logger.debug("CDW Settings: %s" % config)
        
        app.database = connect_mongo(config['MONGODB'])
        app.cdw = CDWService()
        
        
        from cdw.views import load_views
        load_views(app)
        
        #app.register_blueprint(blueprint)
