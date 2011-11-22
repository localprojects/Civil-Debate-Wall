import os
os.environ.setdefault('FLAILS_ENV', 'script')

import main
from flaskext.script import Manager
from flaskext.assets import ManageAssets

manager = Manager(main.app)
manager.add_command("assets", ManageAssets())

if __name__ == "__main__":
    manager.run()