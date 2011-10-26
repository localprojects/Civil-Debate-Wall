import os
import unittest
import yaml
from cdw import config, database
from cdw.models import *
from subprocess import check_output

class BaseTestCase(unittest.TestCase):
        
    def __init__(self, methodName='runTest'):
        super(BaseTestCase, self).__init__(methodName)
        
        self.models = [User, UserPhoto, Category, Question, Thread, Post]
        
        if not "_test" in config.CDW['mongodb']['db']:
            config.CDW['mongodb']['db'] = "%s_test" % config.CDW['mongodb']['db']
             
        database.connect_database(**config.CDW['mongodb'])
    
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
            args = ['mongoimport', '-d', config.CDW['mongodb']['db'], '-c', item.split('.json')[0], '--drop', file_path]
            check_output(args)