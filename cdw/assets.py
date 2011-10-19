from flaskext.assets import Environment, Bundle

def init(app):
    # Web assets
    js_libs = Bundle("js/libs/jquery-1.6.2.min.js", "js/libs/json2.js", 
                     "js/libs/underscore.js", "js/libs/backbone.js", 
                     filters="jsmin", output="libs.js")
    
    js_common = Bundle("js/app/tools.js", "js/app/common.js", 
                       filters="jsmin", output="common.js")
    
    js_home = Bundle("js/app/home.js", 
                     filters="jsmin", output="home.js")
    
    css_less = Bundle("css/style.less", 
                      filters="less", output="style.css", debug=False)
    
    css_main = Bundle(Bundle("css/lib/screen.css"), css_less, 
                      filters="cssmin", output="main.css")
    
    assets = Environment(app)
    assets.debug = app.debug
    assets.register('js_libs', js_libs)
    assets.register('js_common', js_common)
    assets.register('js_home', js_home)
    assets.register("css_main", css_main)
