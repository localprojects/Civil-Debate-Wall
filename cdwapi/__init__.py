from flask import Blueprint

blueprint = Blueprint('api', __name__)
settings = {}

def initialize(app, settingz):
    settings.update(settingz)
    
    from cdwapi.views import load_views
    load_views()