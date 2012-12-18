"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from flask import request
from lib import facebook
from werkzeug import MultiDict

def pager(default_page=1, default_items=25, fields=['page', 'items']):
    """Take page and items from request.args and return skip/limit
    
    :param default_page: Default value to return as the first param
    :param default_items: Default value to return as the second param
    :param fields: List defining the skip and limit field-names. Eg. ['page', 'items']
    :returns: [int(skip)|None, int(limit)|None]
    """

    try:
        page = int(default_page)
        if page < 1: 
            page = 1    # page is 1-based
        items = int(default_items)
    except:
        page = 1
        items = 25
    try:
        if request.method == 'GET':
            data = request.args
        elif request.method in ['POST', 'PUT']:
            data = request.data
            
        if data.get(fields[1]):
            items = int(data.get(fields[1]))
            
        if data.get(fields[0]):
            page = int(data.get(fields[0]))
            if page < 1: 
                page = 1    # page is 1-based
            
        skip = (page - 1) * items
        limit = page * items if items else None

        return (skip, limit)
    except:
        return (0, items)
            
def paginate(default_skip=None, default_limit=None, fields=['skip','limit']):
    """Take skip and limit from request.args and return correct values
    
    :param default_skip: Default value to return as the first param
    :param default_limit: Default value to return as the second param
    :param fields: List defining the skip and limit field-names. Eg. ['page', 'arg']
    :returns: [int|None, int|None]
    """
    skip = default_skip
    limit = default_limit
    try:
        if request.method == 'GET':
            data = request.args
        elif request.method in ['POST', 'PUT']:
            data = request.data

        if data.get(fields[1]):
            limit = int(data.get('limit'))
        if data.get(fields[0]):
            skip = int(data.get(fields[0]))
            limit = skip + limit if limit else None

        return (skip, limit)
    except:
        return (default_skip, default_limit)


def as_multidict(data=None):
    if data is None: return None
    
    resp = MultiDict()
    for key, val in data.items():
        if not isinstance(val, list): val = [val]
        resp.setlist(key, val)
    
    return resp


def get_facebook_profile(token):
    graph = facebook.GraphAPI(token)
    return graph.get_object("me")
