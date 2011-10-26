from cdw.tests.functional import FunctionalTestCase
from cdw.services import MongoengineService
from cdw.models import User, Post

class ApiSMSTests(FunctionalTestCase):
        
    def test_api_sms_kiosk_get(self):
        r = self.testApp.get('/api/sms/kiosk/1')
        self.assert_ok_json(r)
        assert '"number":' in r.data
        assert '"recentMessages": [' in r.data
        
    def test_api_sms_kiosk_post(self):
        self.assert_ok_json(self.testApp.post('/api/sms/kiosk/1', data={"From": "3155696217", "Body": "Hello"}))
        r = self.testApp.get('/api/sms/kiosk/1')
        assert '"phoneNumber": "3155696217"' in r.data
        assert '"message": "Hello"' in r.data
        
    def test_api_sms_stop_sms(self):
        r = self.testApp.post('/api/sms/switchboard', data = {
            "Body": "stop",
            "From": "%2B13155696221"
        })
        service = MongoengineService(User)
        u = service.with_phoneNumber('3155696221')
        assert u.receiveSMSUpdates is False
        
    def test_api_sms_start_sms(self):
        self.testApp.post('/api/sms/switchboard', data = {
            "Body": "start",
            "From": "%2B13155696221"
        })
        service = MongoengineService(User)
        u = service.with_phoneNumber('3155696221')
        assert u.receiveSMSUpdates is True
        
    def test_api_sms_post_message(self):
        service = MongoengineService(Post)
        posts_before = len(service.with_fields(**{"thread":self.user.threadSubscription}))
        
        self.testApp.post('/api/sms/switchboard', data = {
            "Body": "Whats up? This is a message",
            "From": "%s" % self.user.phoneNumber
        })
        
        posts_after = len(service.with_fields(**{"thread":self.user.threadSubscription}))
        assert posts_after == posts_before + 1
