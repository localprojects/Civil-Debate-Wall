
def load_views(blueprint):
    from cdwapi.views import users, questions, posts, threads
    users.load_views(blueprint)
    questions.load_views(blueprint)
    threads.load_views(blueprint)
    posts.load_views(blueprint)
    
    
    
    
    