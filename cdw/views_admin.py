from cdw.services import cdw
from flask import Blueprint, render_template, request, session

blueprint = Blueprint('admin', __name__)

@blueprint.route("/")
def dashboard():
    return render_template('admin/dashboard.html')

@blueprint.route("/debates")
@blueprint.route("/debates/current")
def debates_current():
    question = cdw.questions.with_active(True)
    threads = cdw.threads.with_fields(question=question)
    return render_template('admin/debates/current.html',
                           question=question,
                           threads=threads,
                           section_selector='debates', page_selector='current')
    
@blueprint.route("/debates/upcoming")    
def debates_upcoming():
    return render_template('admin/debates/upcoming.html',
                           categories=cdw.categories.all(),
                           questions=cdw.questions.with_fields(active=False, archived=False, approved=True), 
                           section_selector='debates', page_selector='upcoming')
    
@blueprint.route("/debates/badwords")    
def debates_badwords():
    return render_template('admin/debates/badwords.html', 
                           section_selector='debates', page_selector='badwords')
    
@blueprint.route("/debates/users")    
def debates_users():
    return render_template('admin/debates/users.html', 
                           section_selector='debates', page_selector='users')

def init(app):
    app.register_blueprint(blueprint, url_prefix="/admin")
    