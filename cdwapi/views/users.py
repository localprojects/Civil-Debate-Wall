import re
from cdwapi import blueprint
from cdwapi.forms import KioskUserForm
from cdwapi.views import (jsonify, not_found_on_error,
                          auth_token_or_logged_in_required, auth_token_required)                          
from flask import current_app, request, abort, make_response

@blueprint.route('/users', methods=['GET'])
def users_index_get():
    return jsonify(current_app.cdw.users.all())

@blueprint.route('/users', methods=['POST'])
@auth_token_required
def users_index_post():
    form = KioskUserForm(request.form, csrf_enabled=False)
    if form.validate():
        return jsonify(current_app.cdw.users.save(form.to_user()))
    else:
        return jsonify({"errors":form.errors}, 400)
    
@blueprint.route('/users/<id>', methods=['GET'])
@not_found_on_error
def users_show(id):
    return jsonify(current_app.cdw.users.with_id(id).as_dict())

@blueprint.route('/users/search', methods=['GET', 'POST'])
def users_search():
    data = request.args if request.method == 'GET' else request.form
    return jsonify(current_app.cdw.users.with_fields_all(**data.to_dict()))


