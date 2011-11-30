"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
from cdw.forms import QuestionForm
from cdw.models import Question
from cdw.services import cdw, connection_service
from flask import (Blueprint, request, redirect, 
                   render_template, flash, current_app)
from flaskext.login import current_user

blueprint = Blueprint('admin/crud', __name__)

# Questions
@blueprint.route("/questions", methods=['POST'])
def question_create():
    form = QuestionForm(csrf_enabled=False)
    form.category.choices = [(str(c.id), c.name) for c in cdw.categories.all()]
    if form.validate():
        flash("Question created successfully", "info")
        cdw.questions.save(form.to_question())
    
    print form.errors     
            
    return redirect('/admin/debates/questions')

@blueprint.route("/questions/<question_id>", methods=['PUT'])
def question_update(question_id):
    question = cdw.questions.with_id(question_id)
    
    form = QuestionForm(csrf_enabled=False)
    if form.validate():
        question.author = cdw.users.with_id(form.author.data)
        question.category = cdw.categories.with_id(form.category.data)
        question.text = form.text.data
        question.save()
        flash('Question updated', 'info')
    
    return redirect('/admin/debates/questions/%s' % str(question.id))

@blueprint.route("/questions/<question_id>", methods=['DELETE'])
def question_delete(question_id):
    question = cdw.questions.with_id(question_id)
    question.delete()
    flash("Question deleted successfully", "info")
    return redirect("/admin/debates/questions")


# Threads
@blueprint.route("/threads", methods=['POST'])
def thread_create():
    pass

@blueprint.route("/threads/<thread_id>", methods=['GET'])
def thread_show(thread_id):
    pass

@blueprint.route("/threads/<thread_id>", methods=['PUT'])
def thread_update(thread_id):
    pass

@blueprint.route("/threads/<thread_id>", methods=['DELETE'])
def thread_delete(thread_id):
    debate = cdw.threads.with_id(thread_id)
    replies = cdw.posts.with_fields(thread=debate)
    replies.delete()
    debate.delete()
    flash("Thread deleted successfully", "info")
    return redirect("/admin/debates/current")

# Users
@blueprint.route("/users", methods=['POST'])
def user_create():
    pass

@blueprint.route("/users/<user_id>", methods=['GET'])
def user_show(user_id):
    pass

@blueprint.route("/users/<user_id>", methods=['PUT'])
def user_update(user_id):
    pass

@blueprint.route("/users/<user_id>", methods=['DELETE'])
def user_delete(user_id):
    user = cdw.users.with_id(user_id)
    
    for post in cdw.posts.with_fields(author=user):
        try:
            thread = cdw.threads.with_fields(firstPost=post)
            thread.delete()
        except Exception, e:
            current_app.logger.error("When trying to delete user there "
                                     "was an error when trying to delete a "
                                     "thread: %s" % e)
    
    cdw.posts.with_fields(author=user).delete()
    
    connection_service.remove_all_connections(str(user.id), 'facebook')
    user.delete()
    
    flash("User deleted successfully", "info")
    
    return redirect("/admin/users")

# Posts
@blueprint.route("/posts", methods=['POST'])
def post_create():
    pass

@blueprint.route("/posts/<post_id>", methods=['GET'])
def post_show(post_id):
    pass

@blueprint.route("/posts/<post_id>", methods=['PUT'])
def post_update(post_id):
    pass

@blueprint.route("/posts/<post_id>", methods=['DELETE'])
def post_delete(post_id):
    post = cdw.posts.with_id(post_id)
    
    try:
        thread = cdw.threads.with_fields(firstPost=post)
        posts = cdw.posts.with_fields(thread=thread)
        posts.delete()
        thread.delete()
    except:
        post.delete()
        
    flash("Post deleted successfully", "info")
    #return redirect(redirect_url)
    return redirect(request.referrer)

@blueprint.route("/suggestions/<question_id>", methods=['DELETE'])
def suggestion_delete(question_id):
    question = cdw.suggestions.with_id(question_id)
    question.delete()
    flash("Question deleted successfully", "info")
    return redirect("/admin/debates/suggestions")

@blueprint.route("/suggestions/<question_id>/approve", methods=['POST'])
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
    