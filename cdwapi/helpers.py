"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from flask import request
from lib import facebook
from werkzeug import MultiDict
import re

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


def requester_is_mobile_device():
    reg_b = re.compile(r"android|bb\\d+|meego|avantgo|"
                        "bada\\/|blackberry|blazer|"
                        "compal|elaine|fennec|hiptop|"
                        "iemobile|ip(hone|od)|iris|"
                        "kindle|lge |maemo|midp|mmp|netfront|nexus|"
                        "opera m(ob|in)i|palm( os)?|phone|p(ixi|re)\\/|"
                        "plucker|pocket|psp|series(4|6)0|symbian|treo|"
                        "up\\.(browser|link)|vodafone|wap|"
                        "windows (ce|phone)|xda|xiino", re.I|re.M)
    reg_v = re.compile(r"1207|6310|6590|3gso|4thp|50[1-6]i|770s|802s|a wa|abac|ac(er|oo|s\\-)|ai(ko|rn)|al(av|ca|co)|amoi|an(ex|ny|yw)|aptu|ar(ch|go)|as(te|us)|attw|au(di|\\-m|r |s )|avan|be(ck|ll|nq)|bi(lb|rd)|bl(ac|az)|br(e|v)w|bumb|bw\\-(n|u)|c55\\/|capi|ccwa|cdm\\-|cell|chtm|cldc|cmd\\-|co(mp|nd)|craw|da(it|ll|ng)|dbte|dc\\-s|devi|dica|dmob|do(c|p)o|ds(12|\\-d)|el(49|ai)|em(l2|ul)|er(ic|k0)|esl8|ez([4-7]0|os|wa|ze)|fetc|fly(\\-|_)|g1 u|g560|gene|gf\\-5|g\\-mo|go(\\.w|od)|gr(ad|un)|haie|hcit|hd\\-(m|p|t)|hei\\-|hi(pt|ta)|hp( i|ip)|hs\\-c|ht(c(\\-| |_|a|g|p|s|t)|tp)|hu(aw|tc)|i\\-(20|go|ma)|i230|iac( |\\-|\\/)|ibro|idea|ig01|ikom|im1k|inno|ipaq|iris|ja(t|v)a|jbro|jemu|jigs|kddi|keji|kgt( |\\/)|klon|kpt |kwc\\-|kyo(c|k)|le(no|xi)|lg( g|\\/(k|l|u)|50|54|\\-[a-w])|libw|lynx|m1\\-w|m3ga|m50\\/|ma(te|ui|xo)|mc(01|21|ca)|m\\-cr|me(rc|ri)|mi(o8|oa|ts)|mmef|mo(01|02|bi|de|do|t(\\-| |o|v)|zz)|mt(50|p1|v )|mwbp|mywa|n10[0-2]|n20[2-3]|n30(0|2)|n50(0|2|5)|n7(0(0|1)|10)|ne((c|m)\\-|on|tf|wf|wg|wt)|nok(6|i)|nzph|o2im|op(ti|wv)|oran|owg1|p800|pan(a|d|t)|pdxg|pg(13|\\-([1-8]|c))|phil|pire|pl(ay|uc)|pn\\-2|po(ck|rt|se)|prox|psio|pt\\-g|qa\\-a|qc(07|12|21|32|60|\\-[2-7]|i\\-)|qtek|r380|r600|raks|rim9|ro(ve|zo)|s55\\/|sa(ge|ma|mm|ms|ny|va)|sc(01|h\\-|oo|p\\-)|sdk\\/|se(c(\\-|0|1)|47|mc|nd|ri)|sgh\\-|shar|sie(\\-|m)|sk\\-0|sl(45|id)|sm(al|ar|b3|it|t5)|so(ft|ny)|sp(01|h\\-|v\\-|v )|sy(01|mb)|t2(18|50)|t6(00|10|18)|ta(gt|lk)|tcl\\-|tdg\\-|tel(i|m)|tim\\-|t\\-mo|to(pl|sh)|ts(70|m\\-|m3|m5)|tx\\-9|up(\\.b|g1|si)|utst|v400|v750|veri|vi(rg|te)|vk(40|5[0-3]|\\-v)|vm40|voda|vulc|vx(52|53|60|61|70|80|81|83|85|98)|w3c(\\-| )|webc|whit|wi(g |nc|nw)|wmlb|wonu|x700|yas\\-|your|zeto|zte\\-", re.I|re.M)
    
    user_agent = request.user_agent.string
    b = reg_b.search(user_agent)
    v = reg_v.search(user_agent[0:4])
    if b or v:
        return True
    return False
