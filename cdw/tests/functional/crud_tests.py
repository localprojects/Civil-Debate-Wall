"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
from cdw.tests.functional import FunctionalTestCase
from flask import session
from cdw.services import cdw

class CrudTests(FunctionalTestCase):
   
    def test_delete_user_deletes_threads_and_posts(self):
        with self.testApp as app:
            app.post('/auth', data={"username":self.user.email, "password":"password"})
            r = app.delete('/admin/crud/users/%s' % str(self.user.id))
            assert 'Redirecting...' in r.data
            
            from cdw.models import Post
            posts = Post.objects(author=self.user)
            assert 0 == len(posts)
            
    