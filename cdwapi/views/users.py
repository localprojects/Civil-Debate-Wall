"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
import re
from auth import auth_provider
from cdw.forms import KioskUserForm
from cdw.services import cdw
from cdwapi import (jsonify, not_found_on_error, auth_token_required)
from flask import request, abort, current_app
from flaskext.login import login_user


def load_views(blueprint):
    
    @blueprint.route('/users', methods=['GET'])
    def users_index_get():
        return jsonify(cdw.users.all())
    
    @blueprint.route('/users', methods=['POST'])
    @auth_token_required
    def users_index_post():
        current_app.logger.debug('Creating user: %s' % request.form)
        form = KioskUserForm(request.form, csrf_enabled=False)
        
        if form.validate():
            user = form.to_user()
            cdw.users.save(user)
            return jsonify(user)
        else:
            return jsonify({"errors":form.errors}, 400)
        
    @blueprint.route('/users/<id>', methods=['GET'])
    @not_found_on_error
    def users_show(id):
        return jsonify(cdw.users.with_id(id))
    
    @blueprint.route('/users/search', methods=['GET', 'POST'])
    def users_search():
        data = request.args if request.method == 'GET' else request.form
        return jsonify(cdw.users.with_fields(**data.to_dict()))
    
    @blueprint.route('/users/authenticate', methods=['POST'])
    def users_authenticate():
        try:
            user = auth_provider.authenticate(request.form)
            if login_user(user): return jsonify(user)
        except Exception: pass
        abort(400)
        
    @blueprint.route('/users/phone/<phone>', methods=['GET'])
    @not_found_on_error
    def users_phone(phone):
        return jsonify(cdw.users.with_phoneNumber(phone))
    