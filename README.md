# Civil Debate Wall Website

The Civil Debate Wall website allows the public to view and participate in debates that are happening through the website and physical installation at the Bob Graham Center at the University of Gainesville Florida. This project is concerned with three main components of the overall project:

1. The data API (used by the website and kiosk)
2. The public facing website
3. The CMS/Admin Area

The application is built primarily using the following frameworks, technologies, and APIs:

1. [Flask](http://flask.pocoo.org/)
2. [MongoDB](http://www.mongodb.org/) (hosted at [MongoHQ](http://www.mongohq.com))
3. Amazon Web Services
4. Twilio

## Development

### Getting Started

To work on this project you'll want to have the following software installed on your local machine:

1. [Python 2.7](http://www.python.org)
2. [virtualenv](http://www.virtualenv.org)
3. [virtualenvwrapper](http://www.doughellmann.com/projects/virtualenvwrapper/)
4. [Fabric](http://www.fabfile.org)
4. [MongoDB](http://www.mongodb.org/)

Another great resource for setting up a proper Python environment can be found over at [python-guide.org](python-guide.org). Once you've got the software installed, make sure that MongoDB is running as well.

Now to get the project and its dependencies (if you haven't already). Perform the following from the command line:

    $ git clone git@git.assembla.com:lp-cdw.4.git civildebatewall
    $ cd civildebatewall
    $ mkvirtualenv cdw
    $ pip install -r requirements.txt

Once you've done this you'll want to setup your development rcfile. Copy the sample rcfile by performing the following:

    $ cp rcfile.sample rcfile.development 

Next you'll want to change the following values in rcfile.development to be compatible with your machine (hopefully these are all the relevant ones):

    app_debug = True
    app_mongodb_db = arbitrary_db_name
    app_mongodb_username = your mongo user
    app_mongodb_password = your mongo password
    app_mongodb_host = localhost?
    app_mongodb_port = your mongo port
    app_image_storage_type = local
    app_temp_dir = /path/to/somewhere/temporary
    app_user_images_dir = /path/to/project/static/images/users

Then generate a config file by running
    
	$ fab -c rcfile.development generate_local_config

With any luck you'll be good to go and running:

    $ python main.py

will startup the local development server.

### Facebook

If you need to work on the Facebook login/registration component, you'll need to create a dummy application under a Facebook account you have access to. Add the app ID and app secret values to your rcfile or configuration file. It's also quite useful to setup a host rule on your system for the domain associated with your dummy app. For instance, my dummy app's domain is dev.www.civildebatewall.com and I have a hosts file entry that looks like so:

    $ 127.0.0.1    dev.www.civildebatewall.com

This way there shouldn't be any errors when trying to authenticate against Facebook. If you end up doing this you'll need to ensure you configure the `app_local_request` value in `rcfile.development` and regenerate it or manually edit the `LOCAL_REQUEST` config value in `instances/config.py`.

### Twilio

Additionally, if you need Twilio account information you'll need to setup your own or ask for the account information from someone at Local Projects or University of Florida.

### Webassets

This project takes advantage of the Python webassets library. However, compiling and processing CSS and JS files must still be done manually before deploying to an environment that does not run in debug mode. Whenever it comes time to deploy or commit changes to JS and/or CSS files, be sure to run them through the assets manager:

    $ python manage.py assets rebuild

Once you have done this, be sure to add and commit the generated files before deploying.

## Deployment

Deployment is done using Fabric. Currently the application is hosted on Amazon EC2 instances configured with nginx, uWSGI, and other various utilities and apps. Deployment is easily done by having an ssh key, a properly configured rcfile for the environment and simply running the following command:

    $ fab -c rcfile.envrionment deploy

To obtain the ssh key and/or refills contact: matt@localprojects.net