from cdw.tests.functional import FunctionalTestCase
from flask import session
from cdw.services import cdw
class PhoneVerificationTests(FunctionalTestCase):
   
    def test_verify_phone_valid_code(self):
        with self.testApp as app:
            r = app.post('/verify/phone', data={'phonenumber':'3155696217'})
            assert 'phone_verify_id' in session
            assert 'success' in r.data
            phone_verify_id = session['phone_verify_id']
            token = cdw.phoneverifications.with_id(phone_verify_id).token
            r = app.post('/verify/code', data={'code':token})    
            assert 'verified_phone' in session
            assert 'success' in r.data
            
    def test_verify_phone_invalid_code(self):
        with self.testApp as app:
            r = app.post('/verify/phone', data={'phonenumber':'3155696217'})
            assert 'phone_verify_id' in session
            assert 'success' in r.data
            r = app.post('/verify/code', data={'code':'bad'})    
            assert 'verified_phone' not in session
            assert 'no match' in r.data
            
    def test_post_invalid_phone_for_verification(self):
        with self.testApp as app:
            r = app.post('/verify/phone', data={'phonenumber':'315569627'})
            assert 'phone_verify_id' not in session
            assert 'invalid' in r.data