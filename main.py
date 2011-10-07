import yaml
from flask import Flask

def create_app(config_file):
    app = Flask(__name__)
    app.config.update(yaml.load(open(config_file)))
    
    import auth
    auth.Auth(app)
    
    import cdw
    cdw.CDW(app)
    
    import cdwapi
    cdwapi.CDWApi(app)
    
    return app

if __name__ == '__main__':
    create_app("config.yml").run()