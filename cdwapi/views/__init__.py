
def load_views(blueprint):
    from cdwapi.views import users, questions
    users.load_views(blueprint)
    questions.load_views(blueprint)
    
    
    
    
    