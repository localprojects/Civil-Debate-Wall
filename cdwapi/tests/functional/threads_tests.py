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
    
    def test_api_threads_post_from_kiosk_with_phone(self):
        # Get the user we just created
        from cdw.models import User, Question
        
        # Get a question to post to
        question = Question.objects().first()
        
        # Create and get the user 
        r = self.doApiPost('/api/users', {"username":"dude", "phonenumber":"3155690000"})
        user = User.objects(username="dude").first()
                
        # Post as if from the kiosk
        params = {'yesno': '1', 'author': str(user.id), 'text': 'Creating a thread', 'origin':'kiosk'}
        r = self.doApiPost('/api/questions/%s/threads' % str(question.id), params)
        
        # Get the user again
        user = User.objects(username="dude").first()
        
        # Check if their thread subscription was set
        assert str(user.threadSubscription.id) in r.data
        
    def test_api_threads_post_from_kiosk_with_phone_that_exists(self):
        # Get the user we just created
        from cdw.models import User
        
        qid = str(self.question.id)
        
        def get_u(username):
            return User.objects(username=username).first()
        
        # Create and get the user 
        self.doApiPost('/api/users', {"username":"dude1", "phonenumber":"3155690000"})
        user = get_u("dude1")
                
        # Post as if from the kiosk
        params = {'yesno': '1', 'author': str(user.id), 'text': 'Creating a thread', 'origin':'kiosk'}
        self.doApiPost('/api/questions/%s/threads' % qid, params)
        
        # Create a new user with the same phone
        # Create and get the user 
        self.doApiPost('/api/users', {"username":"dude2", "phonenumber":"3155690000"})
        user = get_u("dude2")
                
        # Post as if from the kiosk
        params = {'yesno': '1', 'author': str(user.id), 'text': 'Creating a thread again', 'origin':'kiosk'}
        r = self.doApiPost('/api/questions/%s/threads' % qid, params)
        
        dude1 = get_u("dude1")
        dude2 = get_u("dude2")
        
        assert dude1.threadSubscription == None
        assert str(dude2.threadSubscription.id) in r.data
    
    def test_api_threads_post_from_kiosk_then_from_web_with_same_phone(self):
        # Get the user we just created
        from cdw.models import User
        
        qid = str(self.question.id)
        
        def get_u(username):
            return User.objects(username=username).first()
        
        # Create a kiosk user using a phone number that is of a web user
        self.doApiPost('/api/users', {"username":"dude1", "phonenumber":"3155696221"})
        user = get_u("dude1")
                
        # Post as if from the kiosk
        params = {'yesno': '1', 'author': str(user.id), 'text': 'Creating a thread', 'origin':'kiosk'}
        self.doApiPost('/api/questions/%s/threads' % qid, params)
        
        # Post as the web user
        params = {'yesno': '1', 
                  'author': '4ea89d9a714375e907000004', 
                  'text': 'Creating a thread again', 
                  'origin':'web', 
                  'follow_sms':'yes'}
        
        r = self.doApiPost('/api/questions/%s/threads' % qid, params)
        
        dude1 = get_u("dude1")
        dude2 = get_u("jen")
        
        assert dude1.threadSubscription == None
        assert str(dude2.threadSubscription.id) in r.data
        
        # Now lets try and post a message via SMS from the phone number
        r = self.testApp.post('/api/sms/switchboard', data = {
            "Body": "Whats going on?",
            "From": "%2B13155696221"
        })  
        
        assert '500' not in r.data  
        
        
    def test_api_threads_add_posts_bad_words(self):
        params = self.valid_post_params
        params['text'] = 'the fuck..?' # Test case from website
        self.assert_bad_json(self.doApiPost('/api/threads/%s/posts' % str(self.thread.id), params))
