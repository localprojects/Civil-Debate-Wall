"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
import os
from fabric.api import *
from fabric.colors import *
from fabric.contrib.console import confirm

def load_fixtures():
    """
    Loads data into MongoDB from the fixtures folder
    """
    if not confirm("Loading fixtures will drop the existing data and replace it with the fixture data. Are you sure you want to do this?"):
        sys.exit()
    
    if not confirm("Are you absolutely sure?"):
        sys.exit()
    
    env.fixtures_dir = "%s/fixtures" % env.lcwd
            
    if not 'localhost' in env.host_string and not '127.0.0.1' in env.host_string:
        env.fixtures_dir = '%(app_shared_dir)s/fixtures' % env
        env.local_fixtures_tar = '%(lcwd)s/fixtures/fixtures.tar.gz' % env
        env.remote_fixtures_tar = '%(remote_fixtures_dir)s/fixtures.tar.gz' % env
        local('cd %(lcwd)s/fixtures;tar -zcvf %(local_fixtures_tar)s *.json' % env)
        
        run('if [ -d "%(remote_fixtures_dir)s" ]; then rm -R %(remote_fixtures_dir)s; fi;' % env)
        run('mkdir -p %(remote_fixtures_dir)s' % env)
        put(env.local_fixtures_tar, env.remote_fixtures_tar)
        run('cd %(remote_fixtures_dir)s;tar -zxvf %(remote_fixtures_tar)s' % env)
        run('rm %(remote_fixtures_tar)s' % env)
        local('rm %s' % env.local_fixtures_tar)
    
    dirlist = os.listdir('%s/fixtures' % env.lcwd)
    
    for item in dirlist:
        if not '.json' in item: continue
        
        file_path = '%s/%s' % (env.fixtures_dir, item)
        env.collection_name = item.split('.json')[0]
        
        cmd = 'mongoimport -host %(app_mongodb_host)s:%(app_mongodb_port)s -d %(app_mongodb_db)s -c %(collection_name)s --drop' % env
        
        if env.app_mongodb_username is not None and len(env.app_mongodb_username) > 0:
            cmd = '%s -u %s -p %s' % (cmd, env.app_mongodb_username, env.app_mongodb_password)
            
        cmd = '%s %s' % (cmd, file_path)
        
        if not 'localhost' in env.host_string and not '127.0.0.1' in env.host_string:
            run(cmd)
        else:
            local(cmd)