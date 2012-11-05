"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from flask import current_app, request, session, abort, jsonify
from cdw import jsonp
from cdw.forms import UserRegistrationForm, EditProfileForm
from cdw.services import cdw
from cdwapi import auth_token_or_logged_in_required
from flaskext.login import current_user


def load_views(blueprint):
    @blueprint.route("/profile", methods=['GET'])
    @auth_token_or_logged_in_required
    @jsonp
    def profile():
        # oddly needed for lookup
        user = cdw.users.with_id(current_user.get_id())
         
        threads = cdw.get_threads_started_by_user(current_user)[:5]
        all_posts = cdw.posts.with_fields(author=user).order_by('-created')
        debates = []
        
        for p in all_posts:
            try:
                debates.append(cdw.threads.with_firstPost(p))
            except:
                pass
                    
        return jsonify(threads=threads,
                       posts=all_posts,
                       debates=debates)


    @blueprint.route("/profile/edit", methods=['POST'])
    @auth_token_or_logged_in_required
    @jsonp
    def profile_edit():
        user = current_user
        form = EditProfileForm(csrf_enable=False)
        
        user = cdw.update_user_profile(user.get_id(),
                                       form.username.data,
                                       form.email.data,
                                       form.password.data)
            
        return jsonify(message="Ok")
        
    @blueprint.route("/profile/photo", methods=['POST'])
    @auth_token_or_logged_in_required
    @jsonp
    def profile_photo():
        try:
            current_app.user_profile_image_store.saveProfileImage(
                current_user, request.form.get('photo'))
            
            return jsonify(current_user.as_dict())
        except Exception, e:
            current_app.logger.error("Error saving profile image: %s" % e)
            abort(400)

    #--------------------------------------------
    # Registration via API
    #--------------------------------------------
    
    @blueprint.route("/register", methods=['POST'])
    def register_user():
#        if current_user.is_authenticated():
#            return redirect("/")
#        
#        current_app.logger.debug('Attempting to register a user')
        
        form = UserRegistrationForm(csrf_enabled=False)
        
        if form.validate():
            # Register the user
            user, created = cdw.register_website_user(
                form.username.data, 
                form.email.data, 
                form.password.data, 
                session.pop('verified_phone', None)
            )
            return jsonify(message="OK")
            
#            # Try connecting their facebook account if a token
#            # is in the session
#            try:
#                handler = current_app.social.facebook.connect_handler
#                
#                conn = handler.get_connection_values({
#                    "access_token": session['facebooktoken'] 
#                })
#                
#                conn['user_id'] = str(user.id)
#                current_app.logger.debug('Saving connection: %s' % conn)
#                connection_service.save_connection(**conn)
#            except KeyError, e:
#                current_app.logger.error(e)
#                pass
#            except Exception, e:
#                current_app.logger.error(
#                    'Could not save connection to Facebook: %s' % e)
#            # Clear out the temporary facebook data
#            session.pop('facebookuserid', None)
#            session.pop('facebooktoken', None)
                
            # Log the user in
            # login_user(user)
            
            # Send them to get their picture taken
            # return redirect("/register/photo")
        
        # current_app.logger.debug(form.errors)
        return jsonify(form.errors)        
    
#    @blueprint.route("/register/email", methods=['GET', 'POST'])
#    def register_email():
#        if current_user.is_authenticated():
#            return redirect("/")
#        
#        form = UserRegistrationForm()
#        # You'd think this wouldn't need to be called here but
#        # a CSRF error will come up when the form is POSTed to 
#        # /register. So below there's a show_errors flag in the
#        # template context blow
#        form.validate()
#        
#        # See if a password was passed from the register modal
#        form.password.data = request.form.get('password', '')
#        
#        
#        return render_template('register.html', 
#                               section_selector="register", 
#                               page_selector="email", 
#                               form=form, 
#                               show_errors=False,
#                               phoneForm=VerifyPhoneForm(csrf_enabled=False))
#    
#    @app.route("/register/facebook", methods=['GET'])
#    def register_facebook():
#        if current_user.is_authenticated():
#            return redirect("/")
#        # Always clear out any verified phone numbers
#        session.pop('verified_phone', None)
#        
#        # Try getting their facebook profile
#        profile = get_facebook_profile(session['facebooktoken'])
#        
#        phoneForm = VerifyPhoneForm(csrf_enabled=False)
#        form = UserRegistrationForm(username=profile['first_name'], 
#                                    email=profile['email'],
#                                    csrf_enabled=False)
#        
#        form.password.data = request.form.get('password', '')
#        form.validate()
#        
#        return render_template('register.html',
#                               form=form, 
#                               phoneForm=phoneForm,
#                               facebook_profile=profile, 
#                               show_errors=False,
#                               section_selector="register", 
#                               page_selector="facebook")
#    
#    @app.route("/register/photo")
#    @login_required
#    def register_photo():
#        # If they set their phone number see if they used the kiosk
#        # and use their photograph
#        found_kiosk_image = False
#        
#        if current_user.phoneNumber and len(current_user.phoneNumber) > 1:
#            current_app.logger.debug('The user set their phone number during '
#                                     'the registration process. Check to see '
#                                     'if they have used the kiosk before.')
#            
#            # Find the first kiosk user with the same phone number
#            user = cdw.users.with_id(current_user.get_id())
#            kiosk_user = cdw.users.with_fields(origin="kiosk", 
#                    phoneNumber=current_user.phoneNumber).first()
#                    
#            if kiosk_user:
#                current_app.logger.debug("Found a kiosk user with the same "
#                                         "phone number. Check if the images "
#                                         "have been uploaded to S3 yet...")
#                import urllib2
#                from boto.s3.connection import S3Connection
#                
#                try:
#                    image_url = '%s/media/images/web/%s.jpg' % (current_app.config['MEDIA_ROOT'], str(kiosk_user.id))
#                    image2_url = '%s/media/images/thumbnails/%s.jpg' % (current_app.config['MEDIA_ROOT'], str(kiosk_user.id))
#                    current_app.logger.debug("Checking if %s exists" % image_url)
#                    urllib2.urlopen(image_url)
#                    current_app.logger.debug("Checking if %s exists" % image2_url)
#                    urllib2.urlopen(image2_url)
#                    
#                    aws_conf = current_app.config['CDW']['aws']
#                    key_id = aws_conf['access_key_id']
#                    secret_key = aws_conf['secret_access_key']
#                    bucket_name = aws_conf['s3bucket']
#                    
#                    conn = S3Connection(key_id, secret_key)
#                    bucket = conn.get_bucket(bucket_name)
#                    
#                    source_web_key = 'media/images/web/%s.jpg' % str(kiosk_user.id)
#                    source_thumb_key = 'media/images/thumbnails/%s.jpg' % str(kiosk_user.id)
#                    
#                    new_web_key = 'images/users/%s-web.jpg' % str(user.id)
#                    new_thumb_key = 'images/users/%s-thumbnail.jpg' % str(user.id)
#                    
#                    current_app.logger.debug("Copying web image %s to %s" % (source_web_key, new_web_key))
#                    bucket.copy_key(new_web_key, bucket_name, source_web_key, preserve_acl=True)
#                    
#                    current_app.logger.debug("Copying thumbnail image %s to %s" % (source_thumb_key, new_thumb_key))
#                    bucket.copy_key(new_thumb_key, bucket_name, source_thumb_key, preserve_acl=True)
#                    
#                    current_app.logger.debug("Setting user image")
#                    current_user.webProfilePicture = user.webProfilePicture = '%s-web.jpg' % str(user.id)
#                    current_user.webProfilePictureThumbnail = user.webProfilePictureThumbnail = '%s-thumbnail.jpg' % str(user.id)
#                    user.save()
#                    found_kiosk_image = True
#                except Exception, e:
#                    current_app.logger.warn("Unable to copy kiosk image for "
#                                            "web user: %s" % e)
#                
#            
#        return render_template('register_photo.html',
#                               section_selector="register", 
#                               page_selector="photo",
#                               found_kiosk_image=found_kiosk_image)
#        
#    @app.route("/register/complete")
#    @login_required
#    def register_complete():
#        return render_template('register_complete.html',
#                               section_selector="register", 
#                               page_selector="complete")
