"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
import datetime
import random
import urllib
import bitlyapi
from cdw import utils
from auth import auth_provider
from cdw.forms import (UserRegistrationForm, SuggestQuestionForm, 
                       VerifyPhoneForm, EditProfileForm)
from cdw.models import PhoneVerificationAttempt, ShareRecord, Thread
from cdw.services import cdw, connection_service 
from flask import (current_app, render_template, request, redirect,
                   session, flash, abort, jsonify)
from flaskext.login import login_required, current_user, login_user
from lib import facebook
from werkzeug.exceptions import BadRequest

def get_facebook_profile(token):
    graph = facebook.GraphAPI(token)
    return graph.get_object("me")

def init(app):
    @app.route("/")
    def index():
        debate_offset = session.pop('debate_offset', 'current')
        
        return render_template("index.html",
                               debate_offset=debate_offset, 
                               section_selector="home", 
                               page_selector="index")
    
    @app.route("/login")
    def login():
        form = auth_provider.login_form(request.args)
        return render_template("login.html", login_form=form, 
                               section_selector="login", page_selector="index")
    
    @app.route("/profile")
    @login_required
    def profile():
        # oddly needed for lookup
        user = cdw.users.with_id(current_user.get_id())
         
        threads = cdw.get_threads_started_by_user(current_user)[:5]
        posts = cdw.posts.with_fields(author=user)[:5]
        current_app.logger.debug(posts)
        return render_template("profile.html",
                               section_selector="profile", 
                               page_selector="index",
                               threads=threads,
                               posts=posts)
        
    @app.route("/profile/edit", methods=['GET','POST'])
    @login_required
    def profile_edit():
        user = current_user
        form = EditProfileForm()
        
        if request.method == 'POST' and form.validate():
            user = cdw.update_user_profile(user.get_id(),
                                           form.username.data,
                                           form.email.data,
                                           form.password.data)
            
            flash('Your profile has been updated.')
            return redirect('/profile')
            
        form.username.data = user.username
        form.email.data = user.email
        
        phoneForm = VerifyPhoneForm(csrf_enabled=False)
        phoneForm.phonenumber.data = user.phoneNumber
        
        return render_template("profile_edit.html", 
                               form=form,
                               phoneForm=phoneForm,
                               section_selector="profile", 
                               page_selector="edit")
        
    @app.route("/profile/photo", methods=['POST'])
    @login_required
    def profile_photo():
        try:
            current_app.user_profile_image_store.saveProfileImage(
                current_user, request.form.get('photo'))
            
            return jsonify(current_user.as_dict())
        except Exception, e:
            current_app.logger.error("Error saving profile image: %s" % e)
            abort(400)
    
    
    @app.route("/register", methods=['POST'])
    def register_post():
        if current_user.is_authenticated():
            return redirect("/")
        
        current_app.logger.debug('Attempting to register a user')
        
        # Always clear out any verified phone numbers
        #session.pop('verified_phone', None)
        
        form = UserRegistrationForm()
        
        if form.validate():
            # Register the user
            user = cdw.register_website_user(
                form.username.data, 
                form.email.data, 
                form.password.data, 
                session.pop('verified_phone', None)
            )
            
            # Try connecting their facebook account if a token
            # is in the session
            try:
                handler = current_app.social.facebook.connect_handler
                
                conn = handler.get_connection_values({
                    "access_token": session['facebooktoken'] 
                })
                
                conn['user_id'] = str(user.id)
                current_app.logger.debug('Saving connection: %s' % conn)
                connection_service.save_connection(**conn)
            except KeyError, e:
                current_app.logger.error(e)
                pass
            except Exception, e:
                current_app.logger.error(
                    'Could not save connection to Facebook: %s' % e)
                
            # Log the user in
            login_user(user)
            
            # Clear out the temporary facebook data
            session.pop('facebookuserid', None)
            session.pop('facebooktoken', None)
            
            # Send them to get their picture taken
            return redirect("/register/photo")
        
        current_app.logger.debug(form.errors)
        
        return render_template('register.html', 
                               section_selector="register", 
                               page_selector="email", 
                               form=form, 
                               show_errors=True,
                               phoneForm=VerifyPhoneForm(csrf_enabled=False))
        
    
    @app.route("/register/email", methods=['GET', 'POST'])
    def register_email():
        if current_user.is_authenticated():
            return redirect("/")
        
        form = UserRegistrationForm()
        # You'd think this wouldn't need to be called here but
        # a CSRF error will come up when the form is POSTed to 
        # /register. So below there's a show_errors flag in the
        # template context blow
        form.validate()
        
        # See if a password was passed from the register modal
        form.password.data = request.form.get('password', '')
        
        
        return render_template('register.html', 
                               section_selector="register", 
                               page_selector="email", 
                               form=form, 
                               show_errors=False,
                               phoneForm=VerifyPhoneForm(csrf_enabled=False))
    
    @app.route("/register/facebook", methods=['GET'])
    def register_facebook():
        if current_user.is_authenticated():
            return redirect("/")
        # Always clear out any verified phone numbers
        session.pop('verified_phone', None)
        
        # Try getting their facebook profile
        profile = get_facebook_profile(session['facebooktoken'])
        
        phoneForm = VerifyPhoneForm(csrf_enabled=False)
        form = UserRegistrationForm(username=profile['first_name'], 
                                    email=profile['email'],
                                    csrf_enabled=False)
        
        form.password.data = request.form.get('password', '')
        form.validate()
        
        return render_template('register.html',
                               form=form, 
                               phoneForm=phoneForm,
                               facebook_profile=profile, 
                               show_errors=False,
                               section_selector="register", 
                               page_selector="facebook")
    
    @app.route("/register/photo")
    @login_required
    def register_photo():
        # If they set their phone number see if they used the kiosk
        # and use their photograph
        import urllib2
        
        if current_user.phoneNumber:
            kiosk_users = cdw.users.with_fields(origin="kiosk", 
                phoneNumber=current_user.phoneNumber)
            
            for user in kiosk_users:
                image_url = '%s/images/users/%s-web.jpg' % (
                                current_app.config['MEDIA_ROOT'],
                                str(user.id))
                try:
                    urllib2.urlopen(image_url)
                    
                except:
                    pass 
            
        return render_template('register_photo.html',
                               section_selector="register", 
                               page_selector="photo")
        
    @app.route("/register/complete")
    @login_required
    def register_complete():
        return render_template('register_complete.html',
                               section_selector="register", 
                               page_selector="complete")
    
    
    @app.route("/privacy", methods=['GET'])
    def privacy():
        return render_template('privacy.html', 
                               section_selector="privacy", 
                               page_selector="index")
    
    @app.route("/contact", methods=['GET','POST'])
    def contact():
        if request.method == 'POST':
            from cdw import emailers
            emailers.send_contact(**request.form.to_dict())
            flash("Thank you for your feedback.")
            
        return render_template('contact.html', 
                               section_selector="contact", 
                               page_selector="index")
    
    
    @app.route("/suggest", methods=['GET','POST'])
    @login_required
    def suggest():
        form = SuggestQuestionForm(request.form) 
        
        if request.method == 'POST':
            if form.validate():
                form.to_question().save()
                flash('We have received your question. Thanks for the suggestion!');
        
        return render_template('suggest.html',
                               section_selector="suggest", 
                               page_selector="index",
                               form=form);
                               
    @app.route("/verify/phone", methods=['POST'])
    def verify_phone():
        session.pop('phone_verify_id', None)
        session.pop('verified_phone', None)
        
        form = VerifyPhoneForm(csrf_enabled=False)
        
        if form.validate():
            
            while(True):
                token = str(random.randint(100000, 999999))
                
                try:
                    # Make sure a random token doesn't exist yet
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
        
        current_app.logger.debug(form.phonenumber.errors)
        raise BadRequest(form.phonenumber.errors[0])
    
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
                
                if current_user.is_authenticated():
                    current_user.phoneNumber = pva.phoneNumber
                    cdw.users.save(current_user)
                    
                else:
                    # Save it in the session for a little bit
                    # in case this is a registration process
                    session['verified_phone'] = pva.phoneNumber
                
                current_app.logger.debug(
                    'Verified phone number: %s' % pva.phoneNumber)
                
                return 'success'
            
        except:
            pass
            
        raise BadRequest(msg)
    
    @app.route("/questions/<question_id>")
    def question_show(question_id):
        try:
            cdw.questions.with_id(question_id)
            return redirect('/#/questions/%s' % question_id)
        except:
            abort(404)
        
    
    @app.route("/questions/<question_id>/debates/<debate_id>")
    def debate_show(question_id, debate_id):
        try:
            cdw.questions.with_id(question_id)
            cdw.threads.with_id(debate_id)
            session['debate_offset'] = debate_id
            return redirect('/#/questions/%s/debates/%s' % 
                            (question_id, debate_id))
        except Exception, e:
            abort(404)
    
    @app.route("/questions/archive")
    def questions_archive():
        now = datetime.datetime.utcnow()
        questions = cdw.questions.with_fields(endDate__lt=now)
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
        
    @app.route("/share/<provider_id>/<debate_id>")
    def share(provider_id, debate_id):
        if provider_id not in ['facebook','twitter']:
            abort(404)
            
        try:
            thread = cdw.threads.with_id(debate_id)
        except:
            abort(404)
            
        record = ShareRecord(provider=provider_id, debateId=debate_id)
        record.save()
        
        config = current_app.config
        lr = config['LOCAL_REQUEST']
        question_id = str(thread.question.id)
        
        url = "%s/questions/%s/debates/%s" % (lr, question_id, debate_id)
        
        username = config['CDW']['bitly']['username']
        api_key = config['CDW']['bitly']['api_key']
        
        b = bitlyapi.BitLy(username, api_key)
        res = b.shorten(longUrl=url)
        short_url = res['url']
        
        if provider_id == 'facebook':
            msg = "I just debated on The Wall"
            # TODO: Ugly, make nicer
            app_id = config['SOCIAL_PROVIDERS']['facebook']['oauth']['consumer_key']
            
            fb_url = "http://www.facebook.com/dialog/feed?" \
                     "app_id=%s" \
                     "&link=%s" \
                     "&name=%s" \
                     "&description=%s" \
                     "&message=%s" \
                     "&redirect_uri=%s" \
                     "&display=page"

            redirect_url = urllib.quote_plus('%s/share/close' % lr)
            fb_url = fb_url % (app_id, 
                               urllib.quote_plus(url),
                               urllib.quote_plus('The Wall'),
                               urllib.quote_plus('A place for civil debate'), 
                               urllib.quote_plus(msg), 
                               redirect_url)
            
            current_app.logger.debug(fb_url)
            
            return redirect(fb_url)
            
        if provider_id == 'twitter':
            msg = "I just debated on The Wall. %s" % short_url
            msg = urllib.quote_plus(msg)
            return redirect('http://twitter.com/home?status=%s' % msg)
            
    @app.route('/share/close')
    def share_close():
        """A callback to close the window from sharing on facebook"""
        return render_template("close.html")
    
    @app.route('/forgot', methods=['POST'])
    def forgot():
        email = request.form.get('email', None)
        print email
        if email:
            try:
                user = cdw.users.with_email(email)
            except Exception, e:
                return jsonify({"success": False})
            
            from cdw import emailers
            emailers.send_forgot_password(user.email, user.password)
            return jsonify({"success": True})
        
    @app.route("/whatisthis")
    def whatisthis():
        return render_template("/whatisthis.html",
                               section_selector="whatisthis", 
                               page_selector="index",)
        
        
        
    @app.route("/notifications/unsubscribe/<user_id>/all")
    def unsubscribe_all(user_id):
        try:
            user = cdw.users.with_id(user_id)
            threads = Thread.objects(emailSubscribers=user)
            for t in threads:
                t.emailSubscribers.remove(user)
                t.save()
        except Exception, e:
            current_app.logger("Error unsubscribing user from all email "
                               "notifications: %s:%s" % (e.__class__.__name, e))
            abort(404)
            
    @app.route("/notifications/unsubscribe/<user_id>/<thread_id>")
    def unsubscribe_one(user_id, thread_id):
        try:
            user = cdw.users.with_id(user_id)
            thread = cdw.threads.with_id(thread_id)
            thread.emailSubscribers.remove(user)
            thread.save()
        except Exception, e:
            current_app.logger("Error unsubscribing user from notifications "
                               "for specific thread: %s:%s" % (e.__class__.__name, e))
            abort(404)
            