"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from cdw.services import cdw, settings
from cdwapi import auth_token_or_logged_in_required
from cdw.models import Post
from bson.dbref import DBRef
from flask import jsonify, current_app

def load_views(blueprint):
    
    #@auth_token_or_logged_in_required
    @blueprint.route("/utils/threads/apply_first_post")
    def threads_apply_first_post():
        for t in cdw.threads.all():
            p = Post.objects_recent_first(thread=t).first()
            
            if p is None:
                t.delete()
                continue
            
            t.firstPost = p 
            t.origin = t.firstPost.origin
            t.yesNo = t.firstPost.yesNo
            t.save()
        return "success"
    
    #@auth_token_or_logged_in_required
    @blueprint.route("/utils/threads/cleanup")
    def cleanup_threads():
        for t in cdw.threads.all():
            doDel = False
            if isinstance(t.firstPost, DBRef) or t.firstPost == None:
                doDel = True
                
            elif isinstance(t.question, DBRef) or t.question == None:
                doDel = True
                
            elif isinstance(t.firstPost.author, DBRef) or t.firstPost.author == None:
                doDel = True
            
            '''
            try:
                cdw.users.with_id(str(t.authorId))
            except:
                doDel = True
            '''
                    
            if doDel:
                Post.objects(thread=t).delete()
                t.delete()
            else:
                t.postCount = cdw.posts.with_fields(thread=t).count()
                t.flags = t.firstPost.flags
                t.origin = t.firstPost.origin
                t.yesNo = t.firstPost.yesNo
                t.save()
        return 'success'
    
    @blueprint.route("/utils/posts/cleanup")
    def cleanup_posts():
        for p in cdw.posts.all():
            doDel = False
            if isinstance(p.author, DBRef) or p.author == None:
                doDel = True
            if isinstance(p.thread, DBRef) or p.thread == None:
                doDel = True
            if isinstance(p.responseTo, DBRef):
                doDel = True
                
            if doDel: p.delete()
                
        return 'success'
    
    @blueprint.route("/utils/users/cleanup")
    def cleanup_users():
        for u in cdw.users.all():
            if isinstance(u.threadSubscription, DBRef):
                u.threadSubscription = None
                
            if isinstance(u.previousThreadSubscription, DBRef):
                u.previousThreadSubscription = None
                
            try:
                u.save()
            except:
                current_app.logger.debug(u.threadSubscription)
                current_app.logger.debug(u.previousThreadSubscription)
                
        return 'success'
    
    @blueprint.route("/utils/questions/<question_id>/debug")
    def debug_question(question_id):
        question = cdw.questions.with_id(question_id)
        threads = cdw.threads.with_fields(question=question)
        
        output = ""
        
        for t in threads:
            if isinstance(t.firstPost, DBRef):
                output += "Thread(%s) references missing first posrt<br/>" % (str(t.id))
            
            posts = cdw.posts.with_fields(thread=t)
            
            for p in posts:
                if isinstance(p.author, DBRef):
                    output += "Post(%s) references missing author. In Thread(%s)<br/>" % (str(p.id), str(t.id))
                    
        return output
    
    @blueprint.route("/utils/questions/cleanup")
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
            
    
