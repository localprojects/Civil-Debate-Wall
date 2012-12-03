"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""

import os
os.environ.setdefault('FLAILS_ENV', 'script')

import main
from flask.ext.script import Manager
from flask.ext.assets import ManageAssets
from script.users import MakeAdmin

manager = Manager(main.app)
manager.add_command("assets", ManageAssets())
manager.add_command("make_admin", MakeAdmin())

if __name__ == "__main__":
    manager.run()
