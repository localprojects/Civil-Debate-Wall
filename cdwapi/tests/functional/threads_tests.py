"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from cdw.tests.functional import FunctionalTestCase

class ApiPostsTests(FunctionalTestCase):

    def test_api_threads_get(self):
        r = self.testApp.get('/api/threads/%s' % str(self.thread.id))
        self.assert_ok_json(r)
        assert '"posts": [' in r.data
    
    def test_api_threads_add_posts_valid(self):
        r = self.doApiPost('/api/threads/%s/posts' % str(self.thread.id), self.valid_post_params)
        self.assert_ok_json(r)
        self.assert_response_contains(r, self.valid_post_params)
    
    """
    def test_api_threads_add_posts_with_response_to(self):
        r = self.doApiPost('/api/threads/%s/posts' % str(self.thread.id), self.valid_post_params_with_responseto)
        self.assert_ok_json(r)
        assert '"responseTo": "4e56af45714375eb670000e6"' in r.data
    """
    
    def test_api_threads_add_posts_invalid(self):
        self.assert_bad_json(self.doApiPost('/api/threads/%s/posts' % str(self.thread.id), {}))
        
    def test_api_threads_remove(self):
        id = str(self.thread.id)
        self.assert_ok_json(self.doApiPost('/api/threads/%s/remove' % id, {}))
        self.assert_not_found(self.testApp.get('/api/threads/%s' % id))