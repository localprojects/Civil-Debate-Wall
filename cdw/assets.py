"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from flask.ext.assets import Environment, Bundle

def init(app):
    """Initialize CSS and JavaScript asset bundles
    """
    js_libs = Bundle("js/libs/jquery-1.6.2.min.js",
                     "js/libs/jquery.dropkick-1.0.0.js", 
                     "js/libs/json2.js", 
                     "js/libs/underscore.js", 
                     "js/libs/backbone.js", 
                     "js/libs/swfobject.js", 
                     "js/libs/spin-1.2.2.js",
                     filters="jsmin", 
                     output="libs.js")
    
    js_common = Bundle("js/app/tools.js", 
                       "js/app/common.js", 
                       filters="jsmin", 
                       output="common.js")
    
    js_home = Bundle("js/app/stats.js",
                     "js/app/home.js",
                     filters="jsmin", 
                     output="home.js")
    
    js_profile = Bundle("js/app/profile.js", 
                        filters="jsmin", 
                        output="profile.js")
    
    css_less = Bundle("css/style.less", 
                      filters="less", 
                      output="style.css", 
                      debug=False)
    
    css_main = Bundle(Bundle("css/lib/screen.css",
                             "css/lib/dropkick.css"), 
                      css_less, 
                      filters="cssmin", 
                      output="main.css")
    
    css_ie8 = Bundle("css/ie8.css",filters="cssmin", output="ie8.css")
    
    # Admin Assets
    js_admin_libs = Bundle("js/libs/jquery-1.6.2.min.js", 
                           "js/libs/jquery-ui-1.8.16.min.js",
                           "js/libs/json2.js", 
                           "js/libs/underscore.js", 
                           "js/libs/backbone.js",
                           filters="jsmin", 
                           output="admin_libs.js")
    
    js_admin_common = Bundle("js/app/admin_tools.js", 
                             "js/app/admin.js",
                             filters="jsmin", 
                             output="admin_common.js")
    
    css_admin_less = Bundle("css/admin.less",
                            filters="less", 
                            output="admin.css", 
                            debug=False)
    
    css_admin_main = Bundle("css/lib/screen.css", 
                            "css/lib/smoothness/jquery-ui-1.8.16.css", 
                            css_admin_less, 
                            filters="cssmin", 
                            output="admin_main.css")
    
    assets = Environment(app)
    assets.debug = app.config['ENVIRONMENT'] in ['development', 'staging']
    
    assets.register('js_libs', js_libs)
    assets.register('js_common', js_common)
    assets.register('js_home', js_home)
    assets.register('js_profile', js_profile)
    assets.register("css_main", css_main)
    assets.register("css_ie8", css_ie8)
    
    assets.register("js_admin_libs", js_admin_libs)
    assets.register("js_admin_common", js_admin_common)
    assets.register("css_admin_main", css_admin_main)
