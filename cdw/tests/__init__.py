import os
import unittest
import yaml
from cdw import connect_mongo
from cdw.models import *
from subprocess import check_output

class BaseTestCase(unittest.TestCase):    
    def __init__(self, methodName='runTest'):
        super(BaseTestCase, self).__init__(methodName)
        os.environ['test_environment'] = 'True'
        f = open("%s/config_test.yaml" % os.getcwd())
        self.settings = yaml.load(f)
        self.models = [User, UserPhoto, Category, Question, Thread, Post]
        connect_mongo(self.settings['CDW']['MONGODB'])
    
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
        folder = '%s/fixtures' % os.getcwd()
        dirlist = os.listdir(folder)
        for item in dirlist:
            file_path = '%s/%s' % (folder, item)
            args = ['mongoimport', '-d', self.settings['CDW']['MONGODB']['DB'], '-c', item.split('.json')[0], '--drop', file_path]
            check_output(args)