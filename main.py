import yaml
from flask import Flask

f = open("settings.yml")
settings = yaml.load(f)

app = Flask(__name__)
app.config.update(settings['FLASK'])

import auth
auth.initialize(app, settings['AUTH'])
app.register_blueprint(auth.blueprint)

import cdw
cdw.initialize(app, settings['CDW'])
app.register_blueprint(cdw.blueprint)

import cdwapi
cdwapi.initialize(app, settings['CDWAPI'])
app.register_blueprint(cdwapi.blueprint, url_prefix="/api")

if __name__ == '__main__':
    app.run()