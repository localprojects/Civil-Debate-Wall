"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
from cdw import jsonp
from cdw.forms import PostForm
from cdw.services import cdw
from cdwapi import (jsonify, not_found_on_error, auth_token_required)                          
from flask import request

def load_views(blueprint):
    
    @blueprint.route('/posts', methods=['POST'])
    @auth_token_required
    @jsonp
    def posts_index_post():
        form = PostForm(request.form, csrf_enabled=False)
        if form.validate():
            return jsonify(cdw.posts.save(form.to_post()))
        else:
            return jsonify({"errors":form.errors}, 400)
        
    @blueprint.route('/posts/<id>', methods=['GET'])
    @not_found_on_error
    @jsonp
    def posts_show(id):
        return jsonify(cdw.posts.with_id(id))
    
    @blueprint.route('/posts/<id>/like', methods=['POST'])
    @not_found_on_error
    @jsonp
    def posts_like(id):
        post = cdw.posts.with_id(id)
        post.likes += 1
        return jsonify(cdw.posts.save(post))
    
    @blueprint.route('/posts/<id>/flag', methods=['POST'])
    @not_found_on_error
    @jsonp
    def posts_flag(id):
        post = cdw.posts.with_id(id)
        post.flags += 1
        post.thread.flags += 1
        post.thread.save()
        return jsonify(cdw.posts.save(post))
    
    @blueprint.route('/posts/<id>/remove', methods=['POST'])
    @not_found_on_error
    @jsonp
    def posts_remove(id):
        cdw.delete_post(cdw.posts.with_id(id))
        return jsonify(True)
    