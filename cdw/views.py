from auth import auth_provider
from cdw.forms import UserRegistrationForm
from cdw.services import cdw
from flask import current_app, render_template, request, redirect, session
from flaskext.login import login_required, current_user, request, login_user

def init(app):
    @app.route("/")
    def index():
        return render_template("index.html")
    
    @app.route("/login")
    def login():
        form = auth_provider.login_form(request.args)
        return render_template("login.html", login_form=form)
    
    @app.route("/profile")
    @login_required
    def profile():
        return render_template("profile.html")
    
    @app.route("/register", methods=['GET'])
    def register():
        if current_user.is_authenticated():
            return redirect("/")
        
        return render_template("register.html")
    
    @app.route("/register", methods=['POST'])
    def register_post():
        if current_user.is_authenticated():
            return redirect("/")
        
        profile = None
        #try: profile = get_facebook_profile(session['facebooktoken'])
        #except: profile = session['facebookuserid'] = session['facebooktoken'] = None
        
        form = UserRegistrationForm(request.form)
        
        if form.validate():
            user = cdw.register_website_user(form.username.data, form.email.data, 
                                             form.password.data, form.phonenumber.data,
                                             session['facebookuserid'], session['facebooktoken'])
            login_user(user)
            del session['facebookuserid']
            del session['facebooktoken']
            return redirect("/profile")
        
        return render_template('register.html', form=form, facebook_profile=profile)
    
    @app.route("/register/email", methods=['POST'])
    def register_complete():
        form = UserRegistrationForm()
        return render_template('register.html', form=form)
    
    
    @app.route("/register/facebook", methods=['GET'])
    def register_facebook():
        #token = get_facebook_token("/register/facebook")
        #profile = get_facebook_profile(token)
        
        try:
            # They already have an account
            if login_user(cdw.users.with_facebookUserId(profile['id'])):
                return redirect("/")
        except:
            pass
        
        #session['facebookuserid'] = profile['id']
        #session['facebooktoken'] = token 
        
        default_username = ''
        default_email = profile['email']
        try: cdw.users.with_username(profile['username'])
        except: default_username = profile['username']
        
        form = UserRegistrationForm(username=default_username, email=default_email)
        return render_template('register.html', form=form, facebook_profile=profile)
    
    