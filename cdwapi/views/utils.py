"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
from cdw.services import cdw, settings
from cdwapi import auth_token_or_logged_in_required
from cdw.models import Post
from bson.dbref import DBRef
from flask import jsonify

def load_views(blueprint):
    
    #@auth_token_or_logged_in_required
    @blueprint.route("/utils/threads/apply_first_post")
    def threads_apply_first_post():
        for t in cdw.threads.all():
            t.firstPost = Post.objects_recent_first(thread=t).first()
            t.origin = t.firstPost.origin
            t.yesNo = t.firstPost.yesNo
            t.save()
        return "success"
    
    #@auth_token_or_logged_in_required
    @blueprint.route("/utils/threads/cleanup")
    def cleanup_threads():
        for t in cdw.threads.all():
            if isinstance(t.firstPost, DBRef) or t.firstPost == None:
                Post.objects(thread=t).delete()
                t.delete()
            else:
                t.flags = t.firstPost.flags
                t.origin = t.firstPost.origin
                t.yesNo = t.firstPost.yesNo
                t.save()
        return 'success'
    
    @blueprint.rount("/utils/questions/cleanup")
    def cleanup_questions():
        try:
            for q in cdw.questions.all():
                q.author = None
                q.active = False
                q.save()
                
            q = cdw.questions.all().first()
            q.active = True
            q.save()
            return "success"
        except Exception, e:
            return "Error: %s" % e
    
    @auth_token_or_logged_in_required
    @blueprint.route("/utils/badwords")
    def bad_words():
        return jsonify({ "words": settings.get_bad_words().split() })
            
    