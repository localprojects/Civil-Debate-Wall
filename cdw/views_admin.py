import datetime
import time
from math import ceil
from cdw.services import cdw
from flask import Blueprint, render_template, request, session, redirect

blueprint = Blueprint('admin', __name__)

@blueprint.route("/")
def dashboard():
    return render_template('admin/dashboard.html')

@blueprint.route("/debates")
@blueprint.route("/debates/current")
def debates_current():
    question = cdw.questions.with_active(True)
    
    page = int(request.args.get('page', 1))
    amt = int(request.args.get('amt', 50))
    sort = request.args.get('sort', 'recent')
    
    sort_lookup = {
        'recent': '-created',
        'flags': '-flags',
    }
    
    order_rule = sort_lookup[sort]
    start = max(0, (page-1) * amt)
    end = start + amt
    
    total_pages = int(ceil(float(cdw.threads.with_fields(question=question).count()) / float(amt)))  
    
    threads = cdw.threads.with_fields(question=question).order_by(order_rule)[start:end]
    
    return render_template('admin/debates/current.html',
                           question=question,
                           threads=threads,
                           current_page=page,
                           total_pages=total_pages,
                           section_selector='debates', 
                           page_selector='current')
    
@blueprint.route("/debates/upcoming", methods=['POST','GET'])    
def debates_upcoming():
    if request.method == 'POST':
        question = cdw.questions.with_id(
            request.form.get('question_id'))
        struct =  time.strptime(
            '%s UTC' % request.form.get('end_date'), 
            '%Y-%m-%d %Z')
        question.endDate = datetime.datetime.fromtimestamp(time.mktime(struct))
        question.save()
        
    return render_template('admin/debates/upcoming.html',
        categories=cdw.categories.all(), 
        questions=cdw.questions.with_fields(approved=True,
            endDate__gt=datetime.datetime.utcnow()).order_by('+endDate'), 
        section_selector='debates', page_selector='upcoming')
    
@blueprint.route("/debates/show/<debate_id>", methods=['GET'])
def show_debate(debate_id):
    debate = cdw.threads.with_id(debate_id)
    replies = cdw.posts.with_fields(thread=debate)[1:]
    return render_template('admin/debates/show.html',
                           debate=debate,
                           replies=replies,
                           section_selector='debates', 
                           page_selector='show')
    
    
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
    