import social
from flask import current_app

def init(app):
    def on_social_login_failed(sender, oauth_response):
        current_app.logger.debug('Social Login Failed. Redirect to register?')
        current_app.logger.debug("OAuth response: %s" % oauth_response)
        
    social.social_login_failed.connect(on_social_login_failed, app)

