"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
import hashlib
import main
from tests import BaseTestCase
from cdw import app
from flask import Flask, render_template, request, current_app

class FunctionalTestCase(BaseTestCase):
    def setUp(self):
        super(FunctionalTestCase, self).setUp()
        app.config['DEBUG'] = False
        app.config['TESTING'] = True
        self.testApp = app.test_client()
        self.valid_user_post_params = {'username': 'joe', 'phonenumber':'2128359322'}
        self.valid_user_update_params = {'firstname': 'UpdatedName'}
        self.valid_question_post_params = {'category': str(self.category.id), 'text': 'Updated question text!'}
        self.valid_question_update_params = {'text': 'Updated question text!'}
        self.valid_post_params = {'yesno': '1', 'author': str(self.user.id), 'text': 'Posting to a thread', 'origin':'kiosk'}
        self.valid_post_params_with_responseto = {'yesno': '1', 'author': str(self.user.id), 'text': 'Posting to a thread', 'origin':'kiosk', 'responseto': '4e56af45714375eb670000e6'}
        self.valid_post_update_params = {'text': 'Updated debated text!'}
        
    def doApiPost(self, url, params):
        token = hashlib.sha1("secretkey").hexdigest()
        return self.testApp.post(url, data=params, headers={"X-Auth-Token":token})
    
    def assert_response_contains(self, r, data):
        if isinstance(data, dict):
            for key in data:
                value = 'null' if data[key] is None else data[key]
                assert value in r.data
        if isinstance(data, list):
            for value in data:
                value = 'null' if value is None else value
                assert value in r.data
    
    def assert_json_headers(self, r):
        assert 'application/json' in r.headers['Content-Type'] 
    
    def assert_ok_response(self, r):
        assert r.status == '200 OK'
        
    def assert_bad_response(self, r):
        assert r.status == '400 BAD REQUEST'
        
    def assert_not_found(self, r):
        assert r.status == '404 NOT FOUND'
        
    def assert_bad_json(self, r):
        self.assert_json_headers(r)
        self.assert_bad_response(r)
    
    def assert_ok_json(self, r):
        self.assert_json_headers(r)
        self.assert_ok_response(r)
        
