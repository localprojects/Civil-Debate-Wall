"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from flask import request
from werkzeug import MultiDict

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


