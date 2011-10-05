from flask import current_app, render_template, request
from flaskext.login import login_required, current_user
from cdw import blueprint, settings

def load_views():
    @blueprint.route("/")
    def index():
        return render_template("index.html")
    
    @blueprint.route("/login")
    def login():
        form = current_app.authentication_provider.login_form(request.args)
        return render_template("auth/login.html", login_form=form)
    
    @blueprint.route("/profile")
    @login_required
    def profile():
        return render_template("profile.html")