import os
os.environ.setdefault('FLAILS_ENV', 'script')

import main
from flaskext.script import Manager
from flaskext.assets import ManageAssets
from script.users import MakeAdmin

manager = Manager(main.app)
manager.add_command("assets", ManageAssets())
manager.add_command("make_admin", MakeAdmin())

if __name__ == "__main__":
    manager.run()