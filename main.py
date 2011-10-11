import yaml
from flask import Flask

def create_app(config):
    if isinstance(config, str):
        config = yaml.load(open(config))
        
    app = Flask(__name__)
    app.config.update(config)
    
    import auth
    auth.Auth(app)
    
    import cdw
    cdw.CDW(app)
    
    import cdwapi
    cdwapi.CDWApi(app)
    
    return app

if __name__ == '__main__':
    create_app("config.yaml").run(port=8080)