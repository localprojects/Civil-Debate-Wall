from __future__ import with_statement
import os, sys, datetime, time
from fabric.api import *
from fabric.colors import *
from fabric.contrib.console import confirm

"""
Base configuration
"""
env.timestamp = int(time.mktime(datetime.datetime.now().timetuple()))
env.project_id = 'civildebatewall'
env.project_name = 'Civil Debate Wall Website'
env.current_release_link = '%(site_dir)s/releases/current' % env
env.previous_release_link = '%(site_dir)s/releases/previous' % env
env.scm_url = 'git@git.assembla.com:lp-cdw.2.git'
env.release = ''
env.hosts = env.hosts.split(',') if isinstance(env.hosts, str) else env.hosts
env.lcwd = os.path.dirname(__file__)

def clean():
    """
    Remove all temporary build files
    """
    if os.path.isdir('%s/build' % env.lcwd):
        local('rm -R %(lcwd)s/build' % env)

# tasks
def test():
    """
    Run the test suite and bail out if it fails
    """
    with settings(warn_only=True):
        result = local("cd %(lcwd)s; nosetests --with-xunit" % env)
    if result.failed: #and not confirm("Tests failed. Continue anyway?"):
        abort("Tests failed. Will not continue.")

def build():
    """
    Run the build process
    """
    clean()
    env.release = local('cd %(lcwd)s; git rev-parse %(branch)s | cut -c 1-9' % env, capture=True)
    local('mkdir -p %(lcwd)s/build' % env)
    minify_css()
    bundle_code()
    generate_configuration()

def bundle_code():
    """
    Create an archive from the target branch for the current host(s)
    """
    env.bundle_tar = '%(lcwd)s/build/%(release)s.tar' % env
    local('git archive --format=tar %(branch)s > %(bundle_tar)s' % env)
    local('tar -uvf %(bundle_tar)s static/css/*.css' % env)
    
def generate_configuration():
    """
    Generate configuration files from the environment
    """
    local('mkdir -p %(lcwd)s/build/etc' % env)
    open('%(lcwd)s/build/etc/settings.yaml' % env, 'w').write(open('%(lcwd)s/etc/settings.yaml.tmpl' % env, 'r').read() % env)
    open('%(lcwd)s/build/etc/nginx.conf' % env, 'w').write(open('%(lcwd)s/etc/nginx.conf.tmpl' % env, 'r').read() % env)
    open('%(lcwd)s/build/etc/uwsgi.yaml' % env, 'w').write(open('%(lcwd)s/etc/uwsgi.yaml.tmpl' % env, 'r').read() % env)
    open('%(lcwd)s/build/etc/smsqueue.yaml' % env, 'w').write(open('%(lcwd)s/etc/smsqueue.yaml.tmpl' % env, 'r').read() % env)

def generate_local_config():
    local('if [ -e %(lcwd)s/settings.yaml ];then rm %(lcwd)s/settings.yaml; fi;' % env)
    open('%(lcwd)s/settings.yaml' % env, 'w').write(open('%(lcwd)s/etc/settings.yaml.tmpl' % env, 'r').read() % env)
    print(green('Successfully generated %(lcwd)s/settings.yaml >>>' % env))
    print(yellow(open('%(lcwd)s/settings.yaml' % env, 'r').read()))

def upload():
    """
    Upload all necessary files for the application to their respective places
    """
    upload_release()
    upload_configuration()
    deploy_static()

def upload_release():
    """
    Upload and extract the release into a release folder
    """
    require('release', provided_by=[build])
    require('bundle_tar', provided_by=[bundle_code])
    env.release_dir = '%(site_dir)s/releases/%(release)s' % env
    env.release_tar = '%(user_home)s/%(release)s.tar.gz' % env
    put(env.bundle_tar, env.release_tar)
    run('mkdir -p %(release_dir)s' % env)
    run('cd %(release_dir)s; tar -xvf %(release_tar)s' % env)
    run('rm %(release_tar)s' % env)

def upload_configuration():
    """
    Upload generated configuration files
    """
    etc_files = os.listdir('%(lcwd)s/build/etc' % env)
    for file in etc_files:
        put('%s/build/etc/%s' % (env.lcwd, file), '%s/etc/%s' % (env.site_dir, file))

def deploy_static():
    """
    Deploy static assets to a versioned folder on S3
    """
    run('s3cmd del --recursive s3://%(aws_s3_bucket)s/%(release)s/' % env)
    run('s3cmd -P --guess-mime-type sync %(release_dir)s/static/js s3://%(aws_s3_bucket)s/%(release)s/' % env)
    run('s3cmd -P --guess-mime-type sync %(release_dir)s/static/css s3://%(aws_s3_bucket)s/%(release)s/' % env)
    run('s3cmd put --guess-mime-type %(release_dir)s/static/crossdomain.xml s3://%(aws_s3_bucket)s' % env)

def link_release():
    """
    Update the current release
    """
    run('if [ -e %(previous_release_link)s ];then rm %(previous_release_link)s; fi;' % env)
    run('if [ -e %(current_release_link)s ];then mv %(current_release_link)s %(previous_release_link)s; fi;' % env)
    run('ln -s %(release_dir)s %(current_release_link)s' % env)
    run('if [ -e %(release_dir)s/settings.yaml ];then rm %(release_dir)s/settings.yaml; fi;' % env)
    run('ln -s %(site_dir)s/etc/settings.yaml %(release_dir)s/settings.yaml' % env)
    
def stop_webserver():
    """
    Manually stop the webserver
    """
    stop_nginx()
    stop_sms_queue()
    stop_uwsgi()
    
def stop_nginx():
    sudo('/etc/init.d/nginx stop')
    
def stop_uwsgi():
    sudo('/etc/init.d/uwsgi stop')
    
def stop_sms_queue():
    run('python %(site_dir)s/releases/current/util/smsqueue.py -c %(site_dir)s/etc/smsqueue.yaml stop' % env)
    
def start_webserver():
    """
    Manually start the webserver
    """
    start_uwsgi()
    start_sms_queue()
    start_nginx()

def start_uwsgi():
    sudo('/etc/init.d/uwsgi start %(site_dir)s' % env)
    
def start_nginx():
    sudo('/etc/init.d/nginx start %(site_dir)s' % env)
    
def start_sms_queue():
    run('python %(site_dir)s/releases/current/util/smsqueue.py -c %(site_dir)s/etc/smsqueue.yaml start' % env)
    
def restart_webserver():
    """
    Manually restart the webserver
    """
    stop_webserver()
    start_webserver()    

def deploy():
    """
    Deploy the application
    """
    test()
    build()
    upload()
    link_release()
    restart_webserver()

def dump_data():
    """
    Dump data from MongoDB in binary format.
    """
    cmd = 'mongodump -h %(mongodb_host)s:%(mongodb_port)s -d %(mongodb_db)s -o %(lcwd)s/dump/%(mongodb_host)s.%(mongodb_port)s/%(timestamp)s' % env
    if env.mongodb_username is not None and len(env.mongodb_username) > 0:
        cmd = '%s -u %s -p %s ' % (cmd, env.mongodb_username, env.mongodb_password)
    local(cmd)
    
def restore_data():
    """
    Restore data using the most recent binary mongo dump data on the local machine
    """
    dirlist = os.listdir('%(lcwd)s/dump/%(mongodb_host)s.%(mongodb_port)s' % env)
    most_recent = 0;
    
    for file in dirlist:
        try:
            most_recent = int(file) if int(file) > most_recent else most_recent
        except:
            pass
        
    if most_recent == 0:
        print(red("Could not find any data to restore from in %(lcwd)s/dump"))
        sys.exit();
    
    restore_from = "%s/dump/%s.%s/%s/%s" % (env.lcwd, env.mongodb_host, env.mongodb_port, most_recent, env.mongodb_db)
        
    cmd = "mongorestore -h %(mongodb_host)s:%(mongodb_port)s -d %(mongodb_db)s" % env
    if env.mongodb_username is not None and len(env.mongodb_username) > 0:
        cmd = '%s -u %s -p %s ' % (cmd, env.mongodb_username, env.mongodb_password)
    cmd = "%s %s" % (cmd, restore_from)
    print(yellow("Restoring data from %s into %s:%s/%s" % (restore_from, env.mongodb_host, env.mongodb_port, env.mongodb_db)))
    
    if not confirm(green("Are you sure you want to restore this data?")):
        sys.exit()
        
    local(cmd)
    
def load_fixtures():
    """
    Loads data into MongoDB from the fixtures folder
    """
    if not confirm("Loading fixtures will drop the existing data and replace it with the fixture data. Are you sure you want to do this?"):
        sys.exit()
    
    if not confirm("Are you absolutely sure?"):
        sys.exit()
    
    if not 'localhost' in env.hosts:        
        env.local_fixtures_tar = '%(lcwd)s/fixtures/fixtures.tar.gz' % env
        env.remote_fixtures_tar = '%(site_dir)s/fixtures/fixtures.tar.gz' % env
        local('cd %(lcwd)s/fixtures;tar -zcvf %(local_fixtures_tar)s *.json' % env)
        
        run('if [ -d "%(site_dir)s/fixtures" ]; then rm -R %(site_dir)s/fixtures; fi;' % env)
        run('mkdir -p %(site_dir)s/fixtures' % env)
        put(env.local_fixtures_tar, env.remote_fixtures_tar)
        run('cd %(site_dir)s/fixtures;tar -zxvf %(remote_fixtures_tar)s' % env)
        run('rm %(remote_fixtures_tar)s' % env)
        local('rm %s' % env.local_fixtures_tar)
    
    dirlist = os.listdir('%s/fixtures' % env.lcwd)
    for item in dirlist:
        file_path = '%s/fixtures/%s' % (env.site_dir, item)
        env.collection_name = item.split('.json')[0]
        cmd = 'mongoimport -host %(mongodb_host)s:%(mongodb_port)s -d %(mongodb_db)s -c %(collection_name)s --drop' % env
        if env.mongodb_username is not None and len(env.mongodb_username) > 0:
            cmd = '%s -u %s -p %s' % (cmd, env.mongodb_username, env.mongodb_password)
        cmd = '%s %s' % (cmd, file_path)
        if not 'localhost' in env.hosts:
            run(cmd)
        else:
            local(cmd)
            
def minify_css():
    """Minify the CSS files. This actually requires Less CSS to be achieved"""
    if env.css_minifiy:
        local("lessc %(lcwd)s/static/css/less/style.less > %(lcwd)s/static/css/style.css" % env)
           
def echo_host():
    """
    Echo the current host to the command line.
    """
    run('echo %(hosts)s' % env)
    
def echo_env():
    """
    Echo the current environment variables
    """
    for item in env.keys():
        print "%s => %s" % (item, env.get(item))