"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from cdw.tests.functional import FunctionalTestCase

class ApiUsersTests(FunctionalTestCase):
    
    def test_api_users_authenticate(self):
        self.assert_ok_json(self.testApp.post('/api/users/authenticate', data={"username": "matt", "password": "password"}))
        
    def test_api_users_authenticate_invalid(self):
        self.assert_bad_response(
            self.testApp.post(
                '/api/users/authenticate',  data={"username": "matt", "password": "pass"}))
    
    """
    def test_api_users_get_by_facebook_id(self):
        self.assert_ok_json(self.testApp.get('/api/users/facebook/1234'))
    """
        
    def test_api_users_get_by_phone(self):
        self.assert_ok_json(self.testApp.get('/api/users/phone/3155696217'))
    
    def test_api_users_index_get(self):
        self.assert_ok_json(self.testApp.get('/api/users'))
        
    def test_api_users_index_post_valid(self):
        p = self.valid_user_post_params
        r = self.doApiPost('/api/users', p)
        self.assert_ok_json(r)
        del p['phonenumber'] # phone does not appear in json output
        self.assert_response_contains(r, p)
    
    def test_api_users_index_post_invalid(self):
        r = self.doApiPost('/api/users', {})
        self.assert_bad_json(r)
            
    def test_api_users_get(self):
        self.assert_ok_json(self.testApp.get('/api/users/%s' % str(self.user.id)))
        
    def test_users_search_from_kiosk_by_phone(self):
        r = self.doApiPost('/api/users/search', {"phoneNumber":"3155696217"})
        assert '"username": "matt"' in r.data
        
    def test_users_search_from_kiosk_by_email(self):
        r = self.doApiPost('/api/users/search', {"email":"matt.wright@localprojects.net"})
        assert '"username": "matt"' in r.data
        
    def test_users_search_from_kiosk_by_username(self):
        r = self.doApiPost('/api/users/search', {"username":"matt"})
        assert '"username": "matt"' in r.data
        
    """
    def test_api_users_update_valid(self):
        p = self.valid_user_update_params
        r = self.doApiPost('/api/users/%s' % str(self.user.id), p)
        self.assert_ok_json(r)
        self.assert_response_contains(r, p)
    
    def test_api_users_update_invalid(self):
        self.assert_bad_json(
            self.doApiPost(
                '/api/users/%s' % str(self.user.id), {'origin':'nothing'}, True))
        
    def test_api_users_remove(self):
        id = str(self.user.id)
        self.assert_ok_json(self.doApiPost('/api/users/%s/remove' % id, {}))
        self.assert_not_found(self.testApp.get('/api/users/%s' % id, expect_errors=True))

    def test_users_search_with_field_and_query_by_username(self):
        r = self.doApiPost('/api/users/search', {"field": "username", "query":"matt"})
        r.mustcontain('"username": "matt"')
        
    def test_users_search_with_field_and_query_by_email(self):
        r = self.doApiPost('/api/users/search', {"field": "email", "query":"gary@gary.com"})
        r.mustcontain('"username": "gary"')
    """