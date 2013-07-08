"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
import mongoengine
from flask import current_app
from werkzeug import LocalProxy

database = LocalProxy(lambda: current_app.database)

def connect_database(db, username=None, password=None, host=None, port=27017, **kwargs):
    """Connect to MongoDB
    """
    username = None if username == 'None' else username
    password = None if password == 'None' else password
    
    mongoengine.connect(db, 
                        username=username, 
                        password=password, 
                        host=host, 
                        port=port)

def init(app):
    """Initialize the database connection
    """
    prodDB = app.config['CDW']['mongodb'].get('default') or app.config['CDW']['mongodb'].get('production') 
    app.database = connect_database(**prodDB)