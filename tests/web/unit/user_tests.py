"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
import mongoengine
from cdw.services import MongoengineService, FieldNotFoundException, EntityNotFoundException
from cdw.models import User
from tests import BaseTestCase
from nose.tools import raises

class MongoengineServiceTests(BaseTestCase):
    
    def setUp(self):
        super(MongoengineServiceTests, self).setUp()
        self.users = MongoengineService(User)
        
    def test_user_entity_is_new(self):
        u = User()
        assert u.is_new() is True
    
    def test_with_id(self):
        assert isinstance(self.users.with_id(str(self.user.id)), User)
    
    def test_with_username(self):
        assert isinstance(self.users.with_username('matt'), User)
        
    def test_with_dynamic_query(self):
        assert isinstance(self.users.with_phoneNumber('3155696217'), User)

    @raises(FieldNotFoundException)
    def test_with_dynamic_bad_field(self):
        self.users.with_something(1)
    
    @raises(EntityNotFoundException)    
    def test_entity_not_found(self):
        self.users.with_username('bogus')
        