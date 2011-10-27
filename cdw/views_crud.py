from cdw.forms import QuestionForm
from cdw.services import cdw
from flask import Blueprint, request, redirect, render_template, flash, current_app
from flaskext.login import current_user

blueprint = Blueprint('crud', __name__)

# Questions
@blueprint.route("/questions", methods=['GET','POST'])
def question_create():
    form = QuestionForm()
    form.category.choices = [(str(c.id), c.name) for c in cdw.categories.all()]
    
    if request.method == 'POST':
        if form.validate():
            flash("Question created successfull")
            q = cdw.questions.save(form.to_question())
            return redirect('/admin/crud/questions/%s' % q.id )
    
    form.author.data = current_user.get_id()
    return render_template('/admin/crud/question.html', form=form)

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

@blueprint.route("/questions/<question_id>", methods=['PUT'])
def question_update(question_id):
    question = cdw.questions.with_id(question_id)
    question.text = request.form.get('text', question.text)
    try: question.category = cdw.categories.with_id(request.form.get('category'))
    except: pass
    try: question.author = cdw.users.with_id(request.form.get('author'))
    except: pass  
    question.save()
    flash('Question updated')
    return redirect(request.referrer)

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
    