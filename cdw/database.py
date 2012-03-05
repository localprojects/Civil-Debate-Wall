"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
import mongoengine
from flask import current_app
from werkzeug import LocalProxy

database = LocalProxy(lambda: current_app.database)

def connect_database(db, username, password, host, port, **kwargs):
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
    app.database = connect_database(**app.config['CDW']['mongodb'])