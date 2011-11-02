import datetime
import random
import urllib
from cdw import utils
from auth import auth_provider
from cdw.forms import (UserRegistrationForm, SuggestQuestionForm, 
                       VerifyPhoneForm, EditProfileForm)
from cdw.models import PhoneVerificationAttempt
from cdw.services import cdw, connection_service 
from flask import (current_app, render_template, request, redirect,
                   session, flash, abort, jsonify)
from flaskext.login import login_required, current_user, request, login_user
from lib import facebook

def get_facebook_profile(token):
    graph = facebook.GraphAPI(token)
    return graph.get_object("me")

def init(app):
    @app.route("/")
    def index():
        return render_template("index.html", section_selector="home", 
                               page_selector="index")
    
    @app.route("/login")
    def login():
        form = auth_provider.login_form(request.args)
        return render_template("login.html", login_form=form, 
                               section_selector="login", page_selector="index")
    
    @app.route("/profile")
    @login_required
    def profile():
        form = EditProfileForm()
        threads = cdw.get_threads_started_by_user(current_user)
        current_app.logger.debug(threads)
        posts = cdw.posts.with_author(cdw.users.with_id(current_user.get_id()))
        
        return render_template("profile.html", 
                               threads=threads,
                               posts=posts,
                               section_selector="profile", 
                               form=form,
                               page_selector="index")
    
    @app.route("/profile", methods=['UPDATE'])
    @login_required    
    def profile_update():
        form = EditProfileForm()
        result = False;
        
        if form.validate():
            result = True
            
        jsonify(result)
            
    
    
    @app.route("/register", methods=['GET','POST'])
    def register_post():
        if current_user.is_authenticated():
            return redirect("/")
        
        form = UserRegistrationForm(request.form)
        
        if request.method == 'POST':
            if form.validate():
                user = cdw.register_website_user(
                    form.username.data, form.email.data, 
                    form.password.data, form.phonenumber.data)
                
                try:
                    handler = current_app.social.facebook.connect_handler
                    
                    conn = handler.get_connection_values({
                        "access_token":session['facebooktoken'] 
                    })
                    
                    conn['user_id'] = str(user.id)
                    connection_service.save_connection(**conn)
                except KeyError:
                    pass
                except Exception, e:
                    current_app.logger.error(
                        'Could not save connection to Facebook: %s' % e)
                
                
                login_user(user)
                session.pop('facebookuserid', None)
                session.pop('facebooktoken', None)
                flash('Thanks for joining')
                return redirect("/profile")
        
        return render_template('register.html', 
                               section_selector="register", 
                               page_selector="index", 
                               form=form, 
                               facebook_profile=profile)
    
    @app.route("/register/email", methods=['POST'])
    def register_complete():
        form = UserRegistrationForm()
        return render_template('register.html', form=form, 
                               section_selector="register", 
                               page_selector="email")
    
    
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
        
        form = UserRegistrationForm(username=default_username, 
                                    email=default_email)
        
        return render_template('register.html',
                               form=form, 
                               facebook_profile=profile, 
                               section_selector="register", 
                               page_selector="facebook")
    
    
    @app.route("/privacy", methods=['GET'])
    def privacy():
        return render_template('privacy.html', 
                               section_selector="privacy", 
                               page_selector="index")
    
    @app.route("/contact")
    def contact():
        return render_template('contact.html', 
                               section_selector="contact", 
                               page_selector="index")
    
    
    @app.route("/suggest", methods=['GET','POST'])
    @login_required
    def suggest():
        form = SuggestQuestionForm(request.form) 
        
        if request.method == 'POST':
            if form.validate():
                cdw.questions.save(form.to_question())
                flash('Thanks for suggesting a question!');
                return redirect("/")
        
        return render_template('suggest.html',
                               section_selector="suggest", 
                               page_selector="index",
                               form=form, 
                               categories=cdw.categories.all());
                               
    @app.route("/verify/phone", methods=['POST'])
    def verify_phone():
        session.pop('verified_phone', None)
        
        form = VerifyPhoneForm(csrf_enabled=False)
        
        if form.validate():
            
            while(True):
                token = str(random.randint(100000, 999999))
                
                try:
                    current_app.cdw.phoneverifications.with_token(token)
                except:
                    expires = (datetime.datetime.utcnow() + 
                               datetime.timedelta(minutes=5))
                    
                    phone = utils.normalize_phonenumber(form.phonenumber.data)
                    
                    pva = PhoneVerificationAttempt(expires=expires, 
                                                   token=token, 
                                                   phoneNumber=phone)
                    
                    current_app.cdw.phoneverifications.save(pva)
                    session['phone_verify_id'] = str(pva.id)
                    
                    current_app.logger.debug(
                        'Saved phone number verification attempt: %s' % pva)
                    
                    config = current_app.config['CDW']['twilio']
                    sender = config['switchboard_number']
                    current_app.twilio.send_message(pva.token, sender, [phone])
                    
                    break # out of the while loop
            
            return 'success'
        
        return 'invalid'
    
    @app.route("/verify/code", methods=['POST'])
    def verify_code():
        session.pop('verified_phone', None)
        msg = 'no match'
        
        try:
            pva_id = session['phone_verify_id']
            pva = current_app.cdw.phoneverifications.with_id(pva_id)
            
            if pva.expires < datetime.datetime.utcnow():
                msg = 'expired'
            
            if request.form['code'] == pva.token:
                session.pop('phone_verify_id', None)
                session['verified_phone'] = pva.phoneNumber
                
                current_app.logger.debug(
                    'Verified phone number: %s' % pva.phoneNumber)
                
                return 'success'
            
        except:
            pass
            
        return msg
    
    @app.route("/questions/<question_id>")
    def question_show(question_id):
        try:
            cdw.questions.with_id(question_id)
        except:
            abort(404)
            
        return render_template("index.html",
                               question_id=question_id, 
                               section_selector="questions", 
                               page_selector="show")
    
    @app.route("/questions/archive")
    def questions_archive():
        now = datetime.datetime.utcnow()
        questions = cdw.questions.with_fields(endDate__lt=now),
        return render_template('questions_archive.html', 
                               questions=questions,
                               categories=cdw.categories.all(),
                               section_selector="questions", 
                               page_selector="archive")
        
    @app.route("/questions/archive/<category_id>")
    def questions_archive_category(category_id):
        try:
            cat = cdw.categories.with_id(category_id)
            questions = cdw.questions.with_fields(archived=True, category=cat)
            return render_template('questions_archive.html', 
                                   current_category=cat,
                                   questions=questions,
                                   categories=cdw.categories.all(),
                                   section_selector="questions", 
                                   page_selector="archive")
        except Exception, e:
            current_app.logger.error("Error getting archive category: %s" % e)
            abort(404)
        
        
    @app.route("/questions/<question_id>/stats")
    def stats(question_id):
        try:
            question = cdw.questions.with_id(question_id)
        except:
            abort(404)
            
        return render_template('stats.html', question=question,
            section_selector="stats", page_selector="show")