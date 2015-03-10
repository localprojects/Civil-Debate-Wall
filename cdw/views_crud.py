"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from cdw import admin_required
from cdw.forms import QuestionForm, ThreadCrudForm, PostCrudForm
from cdw.models import Question, Post
from cdw.services import cdw, connection_service
from flask import (Blueprint, request, redirect, flash, current_app)
from flask.ext.login import current_user

blueprint = Blueprint('admin/crud', __name__)

# Questions
@blueprint.route("/questions", methods=['POST'])
@admin_required
def question_create():
    form = QuestionForm(csrf_enabled=False)
    form.category.choices = [(str(c.id), c.name) for c in cdw.categories.all()]
    
    if form.validate():
        flash("Question created successfully", "info")
        cdw.questions.save(form.to_question())
    
    return redirect('/admin/debates/questions')

@blueprint.route("/questions/<question_id>", methods=['PUT'])
@admin_required
def question_update(question_id):
    question = cdw.questions.with_id(question_id)
    form = QuestionForm(csrf_enabled=False)
    
    if form.validate():
        question.category = cdw.categories.with_id(form.category.data)
        question.text = form.text.data
        question.save()
        flash('Question updated', 'info')
    
    return redirect('/admin/debates/questions/%s' % str(question.id))

@blueprint.route("/questions/<question_id>", methods=['DELETE'])
@admin_required
def question_delete(question_id):
    question = cdw.questions.with_id(question_id)
    threads = cdw.threads.with_fields(question=question)
    
    for t in threads:
        cdw.posts.with_fields(thread=t).delete()
        
    threads.delete()
    question.delete()
    flash("Question deleted successfully", "info")
    return redirect("/admin/debates/questions")

@blueprint.route("/questions/<question_id>/unarchive", methods=['GET','POST'])
@admin_required
def question_unarchive(question_id):
    question = cdw.questions.with_id(question_id)
    question.archived = False
    question.archiveDate = None
    question.save()
    flash("Question unarchived successfully", "info")
    return redirect(request.referrer)

# Threads
@blueprint.route("/threads", methods=['POST'])
@admin_required
def thread_create():
    thread_form = ThreadCrudForm(csrf_enabled=False)
    current_app.logger.debug(thread_form.question_id.data)
    
    if thread_form.validate():
        author_id = thread_form.author_id.data if isinstance(thread_form.author_id.data, basestring) else thread_form.author_id.data[0]
        q = cdw.questions.with_id(thread_form.question_id.data)
        u = cdw.users.with_id(author_id)
        
        post = Post(yesNo=int(thread_form.yesno.data), 
                    text=thread_form.text.data, 
                    author=u,
                    likes=thread_form.likes.data,
                    origin=u.origin)
        cdw.create_thread(q, post)
        flash('Thread created successfully', 'info')
    else:
        current_app.logger.debug(thread_form.errors)
        flash('Error creating debate. Try again.', 'error')
    
    return redirect(request.referrer)
    

@blueprint.route("/threads/<thread_id>", methods=['GET'])
def thread_show(thread_id):
    pass

@blueprint.route("/threads/<thread_id>", methods=['PUT'])
@admin_required
def thread_update(thread_id):
    pass

@blueprint.route("/threads/<thread_id>", methods=['DELETE'])
@admin_required
def thread_delete(thread_id):
    thread = cdw.threads.with_id(thread_id)
    """
    # Thought this would work, looks cleaner too, but getting errors    
    users_subscribed_to = cdw.users.with_fields(threadSubscription=thread)
    num = users_subscribed_to.update(set__threadSubscription=None, 
                                     set__previousThreadSubscription=None)
    current_app.logger.debug('%s users were unsubscribed to the thread that was deleted' % num)
    """
    users_subscribed_to = cdw.users.with_fields(threadSubscription=thread)
    for u in users_subscribed_to:
        u.threadSubscription = None
        u.previousThreadSubscription = None
        u.save()
    
    replies = cdw.posts.with_fields(thread=thread)
    replies.delete()
    
    thread.delete()
    
    flash("Thread deleted successfully", "info")
    return redirect("/admin/debates/current")

# Users
"""
@blueprint.route("/users", methods=['POST'])
@admin_required
def user_create():
    pass

@blueprint.route("/users/<user_id>", methods=['GET'])
def user_show(user_id):
    pass

@blueprint.route("/users/<user_id>", methods=['PUT'])
@admin_required
def user_update(user_id):
    pass
"""

@blueprint.route("/users/<user_id>", methods=['DELETE'])
def user_delete(user_id):
    user = cdw.users.with_id(user_id)
    current_app.logger.debug('Deleting user: %s' % user)
    posts = cdw.posts.with_fields(author=user)
    
    for post in posts:
        try:
            post_delete(str(post.id))
        except:
            # This is fine because delete_post will intelligently
            # delete a thread and there could be a dead reference
            # in this list of posts
            pass
    
    connection_service.remove_all_connections(str(user.id), 'facebook')
    
    for t in cdw.threads.with_fields(emailSubscribers=user):
        t.emailSubscribers.remove(user)
        t.save()
        
    user.delete()
    
    flash("User deleted successfully", "info")
    
    return redirect("/admin/users")

# Posts
@blueprint.route("/posts", methods=['POST'])
@admin_required
def post_create():
    post_form = PostCrudForm(csrf_enabled=False)
    
    if post_form.validate():
        thread = cdw.threads.with_id(post_form.debate_id.data)
        cdw.post_to_thread(thread, post_form.to_post())
        flash('Reply created successfully', 'info')
    else:
        current_app.logger.debug(post_form.errors)
        flash('Error creating reply. Try again.', 'error')
    
    return redirect(request.referrer)

"""
@blueprint.route("/posts/<post_id>", methods=['GET'])
def post_show(post_id):
    pass

@blueprint.route("/posts/<post_id>", methods=['PUT'])
@admin_required
def post_update(post_id):
    pass
"""

@blueprint.route("/posts/<post_id>", methods=['DELETE'])
@admin_required
def post_delete(post_id):
    post = cdw.posts.with_id(post_id)
    current_app.logger.debug('Deleting post: %s' % post)
    
    try:
        thread = cdw.threads.with_firstPost(post)
        thread_delete(str(thread.id))
    except Exception:
        # This is ok, just checking to see if the post
        # was the beginning of a thread
        pass
    
    post.delete()
    flash("Post deleted successfully", "info")
    return redirect(request.referrer)

@blueprint.route("/posts/<post_id>/like", methods=['GET','POST'])
def post_like(post_id):
    post = cdw.posts.with_id(post_id)
    post.likes += 1
    post.save()
    return redirect(request.referrer)

@blueprint.route("/posts/<post_id>/unflag", methods=['POST'])
@admin_required
def post_reset_flags(post_id):
    post = cdw.posts.with_id(post_id)
    post.flags = 0
    post.save()
    flash("Flags successfully cleared", "info")
    return redirect(request.referrer)

@blueprint.route("/suggestions/<question_id>", methods=['DELETE'])
@admin_required
def suggestion_delete(question_id):
    question = cdw.suggestions.with_id(question_id)
    question.delete()
    flash("Question deleted successfully", "info")
    return redirect("/admin/debates/suggestions")

@blueprint.route("/suggestions/<question_id>/approve", methods=['POST'])
@admin_required
def suggestion_approve(question_id):
    question = cdw.suggestions.with_id(question_id)
    new_question = Question(
            category=question.category,
            text=question.text)
    new_question.save()
    question.delete()
    flash("Question approved", "info")
    return redirect("/admin/debates/suggestions")


def init(app):
    app.register_blueprint(blueprint, url_prefix="/admin/crud")
    
