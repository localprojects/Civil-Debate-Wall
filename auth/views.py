from flask import current_app, flash, redirect, request, session, url_for
from flaskext.login import login_required, login_user, logout_user
from auth import (AUTH_URL_KEY, LOGOUT_URL_KEY, POST_LOGIN_VIEW_KEY, 
                  POST_LOGOUT_VIEW_KEY, USER_SERVICE_NAME_KEY, 
                  BadCredentialsException, blueprint, settings, login_manager)

INFO_LOGIN = 'User %s logged in. Redirecting to: %s'
ERROR_LOGIN = 'Unsuccessful authentication attempt: %s. Redirecting to: %s'
INFO_LOGOUT = 'User logged out, redirecting to: %s'
FLASH_INACTIVE = 'Inactive user'

def get_url(value):
    # try building the url or assume its a url already
    try: return url_for(value)
    except: return value
    
def find_redirect(key, settings):
    # Look in the session first, and if not there go to the settings, and
    # if its not there either just go to the root url
    result = (get_url(session.get(key.lower(), None)) or 
              get_url(settings[key.upper()] or None) or '/')
    # Try and delete the session value if it was used
    try: del session[key.lower()]
    except: pass
    return result

def load_views():
    @login_manager.user_loader
    def load_user(id):
        try:
            return getattr(current_app, settings[USER_SERVICE_NAME_KEY]).get_user_with_id(id)
        except:
            return None
        
    @blueprint.route(settings[AUTH_URL_KEY], methods=['POST'], endpoint='authenticate')
    def authenticate():
        try:
            provider = current_app.authentication_provider
            user = provider.authenticate(provider.login_form(request.form))
            
            if login_user(user):
                redirect_url = (get_url(request.form.get('next')) or 
                                find_redirect(POST_LOGIN_VIEW_KEY, settings))
                current_app.logger.info(INFO_LOGIN % (user, redirect_url))
                return redirect(redirect_url)
            else:
                raise BadCredentialsException(FLASH_INACTIVE)
            
        except BadCredentialsException, e:
            flash('%s' % e)
            redirect_url = request.referrer or current_app.login_manager.login_view
            current_app.logger.error(ERROR_LOGIN % (e, redirect_url))
            return redirect(redirect_url)
    
    @blueprint.route(settings[LOGOUT_URL_KEY], endpoint='logout')
    @login_required
    def logout():
        logout_user()
        redirect_url = find_redirect(POST_LOGOUT_VIEW_KEY, settings)
        current_app.logger.info(INFO_LOGOUT % redirect_url)
        return redirect(redirect_url)