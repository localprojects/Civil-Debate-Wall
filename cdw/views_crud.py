from cdw.forms import QuestionForm
from cdw.services import cdw
from flask import Blueprint, request, redirect, render_template, flash, current_app
from flaskext.login import current_user

blueprint = Blueprint('crud', __name__)

# Questions
@blueprint.route("/questions", methods=['GET','POST'])
def question_create():
    form = QuestionForm()
    
    if request.method == 'POST':
        if form.validate():
            flash("Question created successfull")
            cdw.questions.save(form.to_question())
        return redirect(request.referrer)
    
    form.category.choices = [(str(c.id), c.name) for c in cdw.categories.all()]
    form.author.data = current_user.get_id()
    return render_template('/admin/crud/question.html', 
                           form=form)

@blueprint.route("/questions/<quesetion_id>", methods=['GET'])
def question_show(question_id):
    question = cdw.questions.with_id(question_id)
    return render_template('/admin/crud/question.html',
                           question=question, 
                           form=QuestionForm(text=question.text, 
                                             author=str(question.author.id), 
                                             category=str(question.category.id)))

@blueprint.route("/questions/<quesetion_id>", methods=['PUT'])
def question_update(question_id):
    pass

@blueprint.route("/questions/<quesetion_id>", methods=['DELETE'])
def question_delete(question_id):
    pass


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
    pass


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
    pass

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

@blueprint.route("/users/<post_id>", methods=['DELETE'])
def post_delete(post_id):
    pass



def init(app):
    app.register_blueprint(blueprint, url_prefix="/admin/crud")
    