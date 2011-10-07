from auth import auth_provider
from cdw import cdw
from flask import current_app, render_template, request
from flaskext.login import login_required, current_user


def load_views(blueprint):
    @blueprint.route("/")
    def index():
        return render_template("index.html")
    
    @blueprint.route("/login")
    def login():
        form = auth_provider.login_form(request.args)
        return render_template("login.html", login_form=form)
    
    @blueprint.route("/profile")
    @login_required
    def profile():
        return render_template("profile.html")