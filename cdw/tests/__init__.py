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
        f = open("%s/settings.yml" % os.getcwd())
        settings = yaml.load(f)
        self.models = [User, UserPhoto, Category, Question, Thread, Post]
        self.settings = settings['CDW']
        self.settings['MONGODB']['DB'] = '%s_test' % self.settings['MONGODB']['DB']
        connect_mongo(self.settings['MONGODB'])
    
    def setUp(self):
        self.setup_fixtures()
        
    def tearDown(self):
        self.drop_all_collections()
    
    def export_data(self):
        for model in self.models:
            cname = model.__name__.lower()
            check_output(['mongoexport', '-d', self.settings['MONGODB']['DB'], '-c', cname, '-o', '%s/fixtures/%s.json' % (os.getcwd(), cname)])
        check_output(['mongoexport', '-d', self.settings['MONGODB']['DB'], '-c', 'system.indexes', '-o', '%s/fixtures/system.indexes.json' % os.getcwd()])
        
    def drop_all_collections(self):
        for model in self.models:
            model.drop_collection()
            
    def setup_fixtures(self):
        self.drop_all_collections()
        folder = '%s/fixtures' % os.getcwd()
        dirlist = os.listdir(folder)
        for item in dirlist:
            file_path = '%s/%s' % (folder, item)
            args = ['mongoimport', '-d', self.settings['MONGODB']['DB'], '-c', item.split('.json')[0], '--drop', file_path]
            check_output(args)