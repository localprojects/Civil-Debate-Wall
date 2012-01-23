"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from cdw.tests.functional import FunctionalTestCase

class ApiQuestionsTests(FunctionalTestCase):
        
    def test_api_questions_index(self):
        self.assert_ok_json(self.testApp.get('/api/questions'))
        
    def test_api_questions_create(self):
        params = self.valid_question_post_params
        r = self.doApiPost('/api/questions', params)
        self.assert_ok_json(r)
        self.assert_response_contains(r, params)
        
    def test_api_questions_create_invalid(self):
        r = self.doApiPost('/api/questions', {})
        self.assert_bad_json(r)
    
    def test_api_questions_current(self):
        self.assert_ok_json(self.testApp.get('/api/questions/current'))

    def test_api_questions_get_categories(self):
        self.assert_ok_json(self.testApp.get('/api/questions/categories'))
        
    def test_api_questions_get(self):
        self.assert_ok_json(self.testApp.get('/api/questions/%s' % str(self.question.id)))
        
    def test_api_questions_get_threads(self):
        r = self.testApp.get('/api/questions/%s/threads' % str(self.question.id))
        self.assert_ok_json(r)
    
    def test_api_questions_create_thread(self):
        r = self.doApiPost('/api/questions/%s/threads' % str(self.question.id), self.valid_post_params)
        self.assert_ok_json(r)
        assert '"id":' in r.data
    
    """
    def test_api_questions_update_valid(self):
        r = self.doApiPost('/api/questions/%s' % str(self.question.id), self.valid_question_update_params)
        self.assert_ok_json(r)
        self.assert_response_contains(r, self.valid_question_update_params)
        
    def test_api_questions_update_invalid_author(self):
        self.assert_bad_json(
            self.doApiPost(
                '/api/questions/%s' % str(self.question.id), {'author': 'aasdf'}, True ))
    
    def test_api_questions_update_invalid_text(self):
        self.assert_bad_json(
            self.doApiPost(
                '/api/questions/%s' % str(self.question.id), {'text': ''},True))
        
    def test_api_questions_remove(self):
        id = str(self.question.id)
        self.assert_ok_json(self.doApiPost('/api/questions/%s/remove' % id, {}))
        self.assert_not_found(self.testApp.get('/api/questions/%s' % id, expect_errors=True))
    """