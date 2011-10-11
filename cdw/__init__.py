import sys, mongoengine, subprocess, os, urllib
from cdw.services import CDWService
from flask import Blueprint, render_template, current_app, request
from flaskext.login import login_required, current_user
from flaskext.assets import Environment, Bundle
from werkzeug.local import LocalProxy
from cdw.filestores import LocalUserProfileImageStore, S3UserProfileImageStore

database = LocalProxy(lambda: current_app.database)
cdw = LocalProxy(lambda: current_app.cdw)
user_profile_image_store = LocalProxy(lambda: current_app.user_profile_image_store)

default_config = {
    'MONGODB': {
        'DB': 'cdw',
        'USERNAME': None, 
        'PASSWORD': None, 
        'HOST': 'localhost',
        'PORT': 27017,
    }
}

def get_facebook_auth_redirect_url(app_id, path):
    args = {
        "client_id": app_id,
        "redirect_uri": path,
        "scope": "email",
    }
    return "https://graph.facebook.com/oauth/authorize?%s" % urllib.urlencode(args)

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
        
        config = default_config.copy()
        config.update(app.config.get('CDW', {}))
        self.config = config
        
        app.logger.debug("CDW Settings: %s" % config)
        
        app.database = connect_mongo(config['MONGODB'])
        app.cdw = CDWService()
        
        stores = { "local": LocalUserProfileImageStore, "s3": S3UserProfileImageStore }
        app.user_profile_image_store = stores[self.config['IMAGE_STORAGE']['METHOD']]()
        
        from cdw.views import load_views
        load_views(app)
        
        js_libs = Bundle("js/libs/jquery-1.6.2.min.js", "js/libs/json2.js", "js/libs/underscore.js", "js/libs/backbone.js", filters="jsmin", output="libs.js")
        js_common = Bundle("js/app/tools.js", "js/app/common.js", filters="jsmin", output="common.js")
        js_home = Bundle("js/app/home.js", filters="jsmin", output="home.js")
        
        css_less = Bundle("css/style.less", filters="less", output="style.css", debug=False)
        css_main = Bundle(Bundle("css/lib/screen.css"), css_less, filters="cssmin", output="main.css")
        
        assets = Environment(app)
        assets.debug = app.debug
        assets.register('js_libs', js_libs)
        assets.register('js_common', js_common)
        assets.register('js_home', js_home)
        assets.register("css_main", css_main)
        
        @app.context_processor
        def inject_common_values():
            return { 
                'facebook_app_id': self.config['FACEBOOK']['APP_ID'],
                'facebook_register_url': get_facebook_auth_redirect_url(self.config['FACEBOOK']['APP_ID'], 'http://%s/register/facebook' % current_app.config['HOST_NAME']),
                'facebook_signin_url': get_facebook_auth_redirect_url(self.config['FACEBOOK']['APP_ID'], '%s/signin/facebook' % current_app.config['HOST_NAME']),
                'media_root': self.config['MEDIA_ROOT'],
                'media_root_versioned': self.config['MEDIA_ROOT'] if current_app.debug else '%s/%s' % (self.config['MEDIA_ROOT'], current_app.config['RELEASE']) 
            }