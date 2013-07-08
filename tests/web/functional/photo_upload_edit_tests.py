"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from StringIO import StringIO
from cdw.models import User
from cdw.services import cdw
from flask import session, request
from tests.functional import FunctionalTestCase
from tests.helpers import create_random_image

class PhotoUploadTests(FunctionalTestCase):
   
    testUser = {'username': 'testPhotoUploadUser',
                'email': 'testphotouploaduser@cdwtest.lp.com', 
                "origin": "web",
                "password": 'password'}
    
    def setUp(self):
        super(PhotoUploadTests, self).setUp()
        User.objects.get_or_create(**self.testUser)
        
    def tearDown(self):
        user = User.objects(username='testPhotoUploadUser')
        user.delete()
        
    def test_upload_photo_bad(self):
        with self.testApp as app:
            r = app.post('/auth', 
                            data={'username': self.testUser.get('username'),
                                  'password': self.testUser.get('password') })

            photo = StringIO('some file contents')
            from nose.tools import set_trace; set_trace()
            resp = app.post('/api/profile/photo', 
                            data={'photo': (photo, 'test_photo_upload.txt')})
            
            assert 'phone_verify_id' in session
            assert 'success' in resp.data
            
            phone_verify_id = session['phone_verify_id']
            token = cdw.phoneverifications.with_id(phone_verify_id).token
            r = app.post('/verify/code', data={'code':token})    
            assert 'verified_phone' in session
            assert 'success' in r.data


    def test_upload_photo_good(self):
        """Upload an image file should succeed; upload duplicate should fail"""
        self.imagefile = create_random_image()
        with self.testApp as app:
            r = app.post('/auth', 
                            data={'username': self.testUser.get('username'),
                                  'password': self.testUser.get('password') })
            contents = open(self.imagefile, 'rb').read()
            
            filedata = { 'photo': (StringIO(contents), self.imagefile) }

            resp = app.post('/api/profile/photo', data=filedata)
            
            assert resp.status_code == 200

            # Assertions:
            #    saved file has same content as uploaded file
            