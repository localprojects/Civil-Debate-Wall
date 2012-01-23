"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
def load_views(blueprint):
    from cdwapi.views import users, questions, posts, threads, sms, stats, utils
    users.load_views(blueprint)
    questions.load_views(blueprint)
    threads.load_views(blueprint)
    posts.load_views(blueprint)
    sms.load_views(blueprint)
    utils.load_views(blueprint)
    stats.load_views(blueprint)
    
    
    
    
    