"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
from cdw.forms import PostForm
from cdw.services import cdw
from cdwapi import (jsonify, not_found_on_error, 
                    auth_token_or_logged_in_required)                          
from flask import request, current_app
from flaskext.login import current_user

def load_views(blueprint):
    
    @blueprint.route('/threads/<id>', methods=['GET'])
    @not_found_on_error
    def threads_show(id):
        thread = cdw.threads.with_id(id)
        result = thread.as_dict()
        result.update({
            "posts": [p.as_dict() for p in cdw.posts.with_fields(**{"thread": thread})]
        })
        return jsonify(result)
    
    @blueprint.route('/threads/<id>/remove', methods=['POST'])
    @not_found_on_error
    @auth_token_or_logged_in_required
    def threads_remove(id):
        return jsonify(cdw.delete_thread(cdw.threads.with_id(id)))
    
    @blueprint.route('/threads/<id>/posts', methods=['GET'])
    @not_found_on_error
    def threads_posts_get(id):
        return jsonify(cdw.posts.with_fields(
                    **{"thread":cdw.threads.with_id(id)}))
    
    @blueprint.route('/threads/<id>/posts', methods=['POST'])
    @not_found_on_error
    @auth_token_or_logged_in_required
    def threads_posts_post(id):
        form = PostForm(request.form, csrf_enabled=False)
        
        if form.validate():
            thread = cdw.threads.with_id(id)
            post = form.to_post()
            
            try:
                follow_sms = request.form.get('follow_sms', None)
                user = cdw.users.with_id(form.author.data)
                if user.origin == 'kiosk' or follow_sms == 'on': 
                    current_app.cdwapi.start_sms_updates(user, thread)
                 
            except Exception, e:
                current_app.logger.error(
                    "Error subscribing user to SMS: %s" % e)
                
            return jsonify(cdw.post_to_thread(thread, post))
        else:
            current_app.logger.error(form.errors)
            return jsonify({"errors": form.errors}, 400)
        