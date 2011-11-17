"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
from cdw.tests.functional import FunctionalTestCase

class ApiPostsTests(FunctionalTestCase):
    
    def test_api_posts_get(self):
        self.assert_ok_json(self.testApp.get('/api/posts/%s' % str(self.post.id)))
    """
    def test_api_posts_update_valid(self):
        p = self.valid_post_update_params
        r = self.doApiPost('/api/posts/%s' % str(self.post.id), p)
        self.assert_ok_json(r)
        self.assert_response_contains(r, p)
        
    def test_api_posts_update_invalid(self):
        self.assert_bad_json(
            self.doApiPost('/api/posts/%s' % str(self.post.id), {'text': ''}))
    """    
    def test_api_posts_like(self):
        r = self.doApiPost('/api/posts/%s/like' % str(self.post.id), {})
        self.assert_ok_json(r)
        assert '"likes": 1' in r.data
        
    def test_api_posts_flag(self):
        r = self.doApiPost('/api/posts/%s/flag' % str(self.post.id), {})
        self.assert_ok_json(r)
        assert '"flags": 1' in r.data
        
    def test_api_posts_remove(self):
        id = str(self.post.id)
        self.assert_ok_json(self.doApiPost('/api/posts/%s/remove' % id, {}))
        self.assert_not_found(self.testApp.get('/api/posts/%s' % id))
    