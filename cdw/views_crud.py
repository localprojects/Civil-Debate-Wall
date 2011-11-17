"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
from cdw.forms import QuestionForm, MongoQuestionForm
from cdw.services import cdw
from flask import Blueprint, request, redirect, render_template, flash, current_app
from flaskext.login import current_user

blueprint = Blueprint('admin/crud', __name__)

# Questions
@blueprint.route("/questions", methods=['POST'])
def question_create():
    form = QuestionForm(csrf_enabled=False)
    form.category.choices = [(str(c.id), c.name) for c in cdw.categories.all()]
    if form.validate():
        flash("Question created successfully")
        cdw.questions.save(form.to_question())
    
    print form.errors     
            
    return redirect('/admin/debates/upcoming')

"""
@blueprint.route("/questions/<question_id>", methods=['GET'])
def question_show(question_id):
    question = cdw.questions.with_id(question_id)
    form = QuestionForm(text=question.text, 
                        author=str(question.author.id), 
                        category=str(question.category.id))
    form.category.choices = [(str(c.id), c.name) for c in cdw.categories.all()]
    return render_template('/admin/crud/question.html',
                           question=question, 
                           form=form)
"""

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

@blueprint.route("/questions/<quesetion_id>", methods=['DELETE'])
def question_delete(question_id):
    question = cdw.questions.with_id(question_id)
    question.delete()
    flash("Question deleted successfully")
    return redirect("/admin/debates/upcoming")


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
    debate.delete()
    replies = cdw.posts.with_fields(thread=debate)[1:]
    replies.delete()
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
    threads = cdw.threads.with_fields(authorId=user.id)
    
    for thread in threads:
        cdw.posts.with_fields(thread=thread).delete()
        thread.delete()
        
    cdw.posts.with_fields(author=user).delete()
    user.delete()
    
    flash("User deleted successfully")
    
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
    tid = post.thread.id
    post.delete()
    return redirect("/admin/debates/show/%s" % str(tid))



def init(app):
    app.register_blueprint(blueprint, url_prefix="/admin/crud")
    