from cdw import cdw
from cdwapi.forms import QuestionForm, PostForm
from cdwapi import (jsonify, not_found_on_error, auth_token_or_logged_in_required)                          
from flask import request

def load_views(blueprint):
    
    @blueprint.route('/threads/<id>', methods=['GET'])
    @not_found_on_error
    def threads_show(id):
        thread = cdw.threads.with_id(id)
        result = thread.as_dict()
        result.update({"posts": [p.as_dict() for p in cdw.posts.with_fields(**{"thread": thread})]})
        return jsonify(result)
    
    @blueprint.route('/threads/<id>/remove', methods=['POST'])
    @not_found_on_error
    @auth_token_or_logged_in_required
    def threads_remove(id):
        return jsonify(cdw.delete_thread(cdw.threads.with_id(id)))
    
    @blueprint.route('/threads/<id>/posts', methods=['GET'])
    @not_found_on_error
    def threads_posts_get(id):
        return jsonify(cdw.posts.with_thread(cdw.threads.with_id(id)))
    
    @blueprint.route('/threads/<id>/posts', methods=['POST'])
    @not_found_on_error
    @auth_token_or_logged_in_required
    def threads_posts_post(id):
        form = PostForm(request.form, csrf_enabled=False)
        if form.validate():
            thread = cdw.threads.with_id(id)
            return jsonify(cdw.post_to_thread(thread, form.to_post()))
        else:
            return jsonify({"errors": form.errors}, 400)
