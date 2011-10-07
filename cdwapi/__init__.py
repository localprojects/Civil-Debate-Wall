import hashlib
from flask import Blueprint, abort, current_app, request, make_response, json
from flaskext.login import current_user, request
from functools import wraps
from cdw.services import EntityNotFoundException
from mongoengine.queryset import QuerySet

default_config = {
    'URL_PREFIX': None,
    'SECRET_KEY': 'secretkey',
}

# need this because flask's jsonify function doesn't support lists
def jsonify(data, status=200):
    def try_as_dict(data):
        try: return data.as_dict()
        except: return data
    
    if isinstance(data, list) or isinstance(data, QuerySet):
        data = [try_as_dict(x) for x in data]
    elif not isinstance(data, dict):
        data = try_as_dict(data)
    
    default_value = [] if isinstance(data, list) else {}
    response = make_response(
        json.dumps(data, default=default_value, indent=2 ), status)
    response.headers['Content-Type'] = "application/json"
    return response

def has_valid_auth_token():
    secret_key = current_app.config['CDWAPI']['SECRET_KEY']
    hash = hashlib.sha1(secret_key).hexdigest()
    http_token = request.headers.get('X-Auth-Token', None)
    return True if hash == http_token or secret_key.lower() == "false" or secret_key == "none" else False 

def not_found_on_error(fn):
    @wraps(fn)
    def decorated_view(*args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except EntityNotFoundException:
            abort(404)
    return decorated_view

def auth_token_required(fn):
    @wraps(fn)
    def decorated_view(*args, **kwargs):
        if has_valid_auth_token():
            return fn(*args, **kwargs)
        else:
            abort(403)
    return decorated_view
     
def auth_token_or_logged_in_required(fn):
    @wraps(fn)
    def decorated_view(*args, **kwargs):
        if has_valid_auth_token() or current_user.is_authenticated():
            return fn(*args, **kwargs)
        else:
            abort(403)   
    return decorated_view   


class CDWApi(object):
    def __init__(self, app=None):
        self.init_app(app)
        
    def init_app(self, app):
        if app is None: return
        
        blueprint = Blueprint('cdwapi', __name__)
        
        config = default_config.copy()
        config.update(app.config.get('CDWAPI', {}))
        self.config = config
        
        app.cdwapi = self
        
        from cdwapi.views import load_views
        load_views(blueprint)
        
        app.register_blueprint(blueprint, url_prefix=config['URL_PREFIX'])