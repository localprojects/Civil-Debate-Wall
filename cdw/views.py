from auth import auth_provider
from cdw.forms import UserRegistrationForm
from cdw.services import cdw, connection_service
from flask import current_app, render_template, request, redirect, session, flash
from flaskext.login import login_required, current_user, request, login_user
from lib import facebook

def get_facebook_profile(token):
    graph = facebook.GraphAPI(token)
    return graph.get_object("me")

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
        
        form = UserRegistrationForm(request.form)
        
        if form.validate():
            user = cdw.register_website_user(form.username.data, form.email.data, 
                                             form.password.data, form.phonenumber.data)
            
            try:
                conn = current_app.social.facebook.connect_handler.get_connection_values({"access_token":session['facebooktoken']})
                conn['user_id'] = str(user.id)
                connection_service.save_connection(**conn)
            except KeyError:
                pass
            except Exception, e:
                current_app.logger.error('Could not save connection to Facebook: %s' % e)
            
            
            login_user(user)
            session.pop('facebookuserid', None)
            session.pop('facebooktoken', None)
            flash('Thanks for joining')
            return redirect("/profile")
        
        return render_template('register.html', form=form, facebook_profile=profile)
    
    @app.route("/register/email", methods=['POST'])
    def register_complete():
        form = UserRegistrationForm()
        return render_template('register.html', form=form)
    
    
    @app.route("/register/facebook", methods=['GET'])
    def register_facebook():
        try: 
            profile = get_facebook_profile(session['facebooktoken'])
            default_email = profile['email']
        except: 
            profile = None
            default_username = ''
        
        try: 
            cdw.users.with_username(profile['username'])
            default_username = ''
        except: 
            default_username = profile['username']
        
        form = UserRegistrationForm(username=default_username, email=default_email)
        return render_template('register.html', form=form, facebook_profile=profile)
    
    