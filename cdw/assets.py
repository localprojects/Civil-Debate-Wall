from flaskext.assets import Environment, Bundle

def init(app):
    # Public assets
    js_libs = Bundle("js/libs/jquery-1.6.2.min.js", 
                     "js/libs/json2.js", 
                     "js/libs/underscore.js", 
                     "js/libs/backbone.js", 
                     "js/libs/swfobject.js", 
                     filters="jsmin", 
                     output="libs.js")
    
    js_common = Bundle("js/app/tools.js", 
                       "js/app/common.js", 
                       filters="jsmin", 
                       output="common.js")
    
    js_home = Bundle("js/app/home.js", 
                     filters="jsmin", 
                     output="home.js")
    
    js_profile = Bundle("js/app/profile.js", 
                        filters="jsmin", 
                        output="profile.js")
    
    css_less = Bundle("css/style.less", 
                      filters="less", 
                      output="style.css", 
                      debug=False)
    
    css_main = Bundle(Bundle("css/lib/screen.css"), 
                      css_less, 
                      filters="cssmin", 
                      output="main.css")
    
    # Admin Assets
    js_admin_libs = Bundle("js/libs/jquery-1.6.2.min.js", 
                           "js/libs/jquery-ui-1.8.16.min.js",
                           "js/libs/json2.js", 
                           "js/libs/underscore.js", 
                           "js/libs/backbone.js",
                           filters="jsmin", 
                           output="admin_libs.js")
    
    js_admin_common = Bundle("js/app/tools.js", 
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
    assets.debug = app.debug
    
    assets.register('js_libs', js_libs)
    assets.register('js_common', js_common)
    assets.register('js_home', js_home)
    assets.register('js_profile', js_profile)
    assets.register("css_main", css_main)
    
    assets.register("js_admin_libs", js_admin_libs)
    assets.register("js_admin_common", js_admin_common)
    assets.register("css_admin_main", css_admin_main)
