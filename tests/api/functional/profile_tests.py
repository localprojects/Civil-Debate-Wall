"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from tests.functional import FunctionalTestCase
import simplejson as json

class ApiProfileTests(FunctionalTestCase):
    
    def test_api_profile_register(self):
        params={"username": "test_profile",
                "email": "test_profile@localprojects.net",
                "phoneNumber": "9015551212", 
                "password": "password"}
        url='/api/register'
        
        resp = self.testApp.post(url, data=json.dumps(params), 
                                 content_type="application/json")
        
        self.assert_ok_json(resp)
        self.assertTrue('Set-Cookie' in resp.headers.keys())
        cookie = resp.headers.get('Set-Cookie')
        self.assertTrue("login=" in cookie, "Unable to find login cookie in response")
        from nose.tools import set_trace; set_trace()
