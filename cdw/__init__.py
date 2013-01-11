"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
import datetime
from flask import Flask
from flask.ext.wtf import Form
from flask.ext.login import current_user
from flask import abort, request, current_app
from functools import wraps

def admin_required(fn):
    @wraps(fn)
    def decorated_view(*args, **kwargs):
        if not current_user.is_authenticated() or not current_user.isAdmin:
            abort(403)
        else:
            return fn(*args, **kwargs)
    return decorated_view

def jsonp(func):
    """Wraps jsonify'ed output for jsonp requests"""
    @wraps(func)
    def decorated_function(*args, **kwargs):
        callback = request.args.get('callback', False)
        if callback:
            data = str(func(*args, **kwargs).data)
            content = str(callback) + '(' + data + ')'
            mimetype = 'application/javascript'
            return current_app.response_class(content, mimetype=mimetype)
        else:
            return func(*args, **kwargs)
    return decorated_function

def login_cookie(func):
    """Wraps response to include the current logged-in user info in a cookie"""
    @wraps(func)
    def decorated_function(*args, **kwargs):
        if current_user.is_authenticated():
            resp = func(*args, **kwargs)
            cookie = make_login_cookie(current_user)
            resp.set_cookie("login", ",".join(cookie) )
            return resp
        else:
            return func(*args, **kwargs)
    return decorated_function

def make_login_cookie(user):
    cookie = []
    profile = user.profile_dict()
    for key, val in profile.items():
        if val and not isinstance(val, (list, dict)):
            cookie.append("%s=%s" % (key, str(val)))

    return cookie

app = Flask(__name__)
# app = Flask(__name__, static_folder="mobile")
app.config.from_object('instance.config')
app.url_map.strict_slashes = False
    
# Application specific stuff
from . import assets
assets.init(app)

from . import database
database.init(app)

from . import filestores
filestores.init(app)

from . import log
log.init(app)

from . import middleware
middleware.init(app)

from . import services
services.init(app)

from . import emailers
emailers.init(app)

from . import signals
signals.init(app)

from . import views
views.init(app)

from . import views_admin
views_admin.init(app)

from . import views_crud
views_crud.init(app)

import auth
auth.Auth(app)

import social
social.Social(app)

import cdwapi
cdwapi.CDWApi(app)

#app.logger.debug(app.url_map)



@app.context_processor
def inject_common_values():
    form = Form(csrf_enabled=True)
    ga_id = app.config['CDW']['google_analytics_id']
    ga_id = None if ga_id == 'None' or ga_id == '' else ga_id 
    intro_video_id = app.config['CDW']['intro_video_id']
    
    return {
        'facebook_app_id': app.config['SOCIAL_PROVIDERS']['facebook']['oauth']['consumer_key'],
        'google_analytics_id': ga_id,
        'media_root': app.config['MEDIA_ROOT'], 
        'csrf_token': form.csrf_token,
        'intro_video_id': intro_video_id,
        'local_request': app.config['LOCAL_REQUEST']
    }

@app.template_filter()
def datetimeformat(value, f='%H:%M / %d-%m-%Y'):
    return value.strftime(f)

@app.template_filter()
def friendly_time(dt, past_="ago", 
    future_="from now", 
    default="just now"):
    """
    Returns string representing "time since"
    or "time until" e.g.
    3 days ago, 5 hours from now etc.
    """

    now = datetime.utcnow()
    if now > dt:
        diff = now - dt
        dt_is_past = True
    else:
        diff = dt - now
        dt_is_past = False

    periods = (
        (diff.days / 365, "year", "years"),
        (diff.days / 30, "month", "months"),
        (diff.days / 7, "week", "weeks"),
        (diff.days, "day", "days"),
        (diff.seconds / 3600, "hour", "hours"),
        (diff.seconds / 60, "minute", "minutes"),
        (diff.seconds, "second", "seconds"),
    )

    for period, singular, plural in periods:
        
        if period:
            return "%d %s %s" % (period, \
                singular if period == 1 else plural, \
                past_ if dt_is_past else future_)

    return default
