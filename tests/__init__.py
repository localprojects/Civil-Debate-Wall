"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
import os
import unittest
import yaml
from instance import config
from cdw import database
from cdw.models import *
from subprocess import check_output

class BaseTestCase(unittest.TestCase):
        
    def __init__(self, methodName='runTest'):
        super(BaseTestCase, self).__init__(methodName)
        
        self.models = [User, UserPhoto, Category, Question, Thread, Post]
        
        if not "test" in config.CDW['mongodb'].keys():
            raise Exception("No test database configured!")
            # config.CDW['mongodb']['db'] = "%s_test" % config.CDW['mongodb']['db']
             
        database.connect_database(**config.CDW['mongodb']['test'])
    
    def setUp(self):
        self.import_fixtures()
        self.user = User.objects[0]
        self.category = Category.objects[0]
        self.question = Question.objects[0]
        self.thread = Thread.objects[0]
        self.post = Post.objects[0]
        
    def tearDown(self):
        self.drop_all_collections()
        
    def drop_all_collections(self):
        for model in self.models:
            model.drop_collection()
            
    def import_fixtures(self):
        self.drop_all_collections()
        folder = '%s/fixtures/json' % os.getcwd()
        dirlist = os.listdir(folder)
        for item in dirlist:
            if not '.json' in item: continue
            
            file_path = '%s/%s' % (folder, item)
            testdb = config.CDW['mongodb']['test']
            args = ['mongoimport', 
                    '--db', testdb['db'],
                    '--host', testdb.get('host', 'localhost'),
                    '--port', str(testdb.get('port', 27017)),
                    '--collection', item.split('.json')[0], 
                    '--drop', file_path]
            check_output(args)
            

            