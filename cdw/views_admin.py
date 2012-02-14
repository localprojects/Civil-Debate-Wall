"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
import datetime
import time
from math import ceil
from cdw.models import Post
from cdw.services import cdw, settings
from cdw import admin_required
from flask import Blueprint, render_template, request, session, redirect, flash
from cdw.forms import QuestionForm, ThreadCrudForm, PostCrudForm

blueprint = Blueprint('admin', __name__)

@blueprint.route("/")
@blueprint.route("/dashboard")
@admin_required
def dashboard():
    days_ago = datetime.datetime.utcnow() - datetime.timedelta(days=30)
    recent_posts_with_flags = Post.objects(created__gte=days_ago, 
                                           flags__gt=0).order_by('-flags')[:30]
    return render_template('admin/dashboard.html',
                           section_selector='dashboard',
                           page_selector='index',
                           recent_posts_with_flags=recent_posts_with_flags)

@blueprint.route('/stats')
@admin_required
def stats():
    def kiosk_users():
        for u in cdw.users.with_fields(origin='kiosk'):
            yield u
            
    total_kiosk_users = cdw.users.with_fields(origin='kiosk').count()
    total_web_users = cdw.users.with_fields(origin='web').count()
    total_users_with_photos = cdw.users.with_fields(
        webProfilePicture__exists=1, origin='web').count()
    total_users_sms_subscribes = cdw.users.with_fields(threadSubscription__exists=1).count()
    
    uses_both = []
    for u in kiosk_users():
        try:
            web_user = cdw.users.with_fields(origin='web', 
                                  phoneNumber=u.phoneNumber).first()
            
            if web_user not in uses_both:
                uses_both.append(web_user.phoneNumber)
        except:
            pass
    
    total_threads = cdw.threads.all().count()
    total_threads_kiosk = cdw.threads.with_fields(origin='kiosk').count()
    total_threads_web = cdw.threads.with_fields(origin='web').count()
    
    total_messages = cdw.posts.all().count()
    average_responses = float(total_messages) / float(total_threads) 
    
    total_messages_kiosk = cdw.posts.with_fields(origin='kiosk').count()
    total_messages_web = cdw.posts.with_fields(origin='web').count()
    total_messages_sms = cdw.posts.with_fields(origin='cell').count()
    
    total_likes = 0
    for p in cdw.posts.with_fields(likes__gt=0):
        total_likes += p.likes
    
    from cdw.models import ShareRecord
    facebook_likes = ShareRecord.objects(provider='facebook').count()
    twitter_likes = ShareRecord.objects(provider='twitter').count()
    
    
    
    return render_template("admin/stats.html",
                           section_selector='stats',
                           page_selector='index',
                           uses_both=len(uses_both),
                           total_web_users=total_web_users,
                           total_kiosk_users=total_kiosk_users,
                           total_users_with_photos=total_users_with_photos,
                           total_users_sms_subscribes=total_users_sms_subscribes,
                           total_threads=total_threads,
                           total_messages=total_messages,
                           total_threads_kiosk=total_threads_kiosk,
                           total_threads_web=total_threads_web,
                           total_messages_kiosk=total_messages_kiosk,
                           total_messages_web=total_messages_web,
                           total_messages_sms=total_messages_sms,
                           total_likes=total_likes,
                           facebook_likes=facebook_likes,
                           twitter_likes=twitter_likes,
                           average_responses=average_responses)

def do_show_question(question):
    page = int(request.args.get('page', 1))
    amt = int(request.args.get('amt', 50))
    sort = request.args.get('sort', 'recent')
    
    sort_lookup = {
        'recent': '-created',
        'flags': '-flags',
        'replies': '-postCount'
    }
    
    order_rule = sort_lookup[sort]
    start = max(0, (page-1) * amt)
    end = start + amt
    
    total_questions = float(cdw.threads.with_fields(question=question).count())
    total_pages = int(ceil(total_questions / float(amt)))
    
    threads = cdw.threads.with_fields(
                  question=question).order_by(order_rule)[start:end]
    
    return dict(question=question,
                threads=threads,
                current_page=page,
                current_sort=sort,
                total_pages=total_pages)

@blueprint.route("/debates")
@blueprint.route("/debates/current")
@admin_required
def debates_current():
    ctx = do_show_question(cdw.questions.with_active(True))
    return render_template('admin/debates/current.html',
                           section_selector='debates', 
                           page_selector='current',
                           **ctx)

@blueprint.route("/debates/<question_id>", methods=['GET'])
@admin_required
def debates_show(question_id):
    ctx = do_show_question(cdw.questions.with_id(question_id))
    return render_template('admin/debates/current.html',
                           section_selector='debates', 
                           page_selector='show',
                           **ctx)
    
@blueprint.route("/debates/questions")
@admin_required    
def debates_questions():
    active_q = cdw.questions.with_fields(active=True).first()
    questions = cdw.questions.with_fields(archived__ne=True,
                                          active__ne=True).order_by('-created')
    form = QuestionForm(csrf_enabled=False)
    
    return render_template('admin/debates/questions.html',
                           categories=cdw.categories.all(), 
                           active_question=active_q,
                           questions=questions,
                           form=form,
                           section_selector='debates', 
                           page_selector='questions')

@blueprint.route("/debates/questions/<question_id>")
@admin_required
def show_question(question_id):
    ctx = do_show_question(cdw.questions.with_id(question_id))
    question = ctx.get('question')
    form = QuestionForm(csrf_enabled=False)
    form.category.data = str(question.category.id)
    form.text.data = question.text
    
    thread_form = ThreadCrudForm(question_id,csrf_enabled=False) 
    
    return render_template("/admin/debates/show_question.html", 
                           section_selector="debates",
                           page_selector="questions-show",
                           form=form,
                           thread_form=thread_form,
                           **ctx)

@blueprint.route("/debates/threads/<debate_id>", methods=['GET'])
@admin_required
def show_threads(debate_id):
    debate = cdw.threads.with_id(debate_id)
    replies = cdw.posts.with_fields(thread=debate)[1:]
    reply_form = PostCrudForm(debate_id, csrf_enabled=False)
    
    return render_template('admin/debates/show_thread.html',
                           debate=debate,
                           replies=replies,
                           reply_form=reply_form,
                           section_selector='debates', 
                           page_selector='threads-show')
    
@blueprint.route("/debates/questions/<question_id>/activate", methods=['POST'])
@admin_required
def activate_debate(question_id):
    currently_active = cdw.questions.with_fields(active=True).first()
    currently_active.active = False
    currently_active.save()
    
    question = cdw.questions.with_id(question_id)
    question.active = True
    question.save()
    return redirect("/admin/debates/questions")

@blueprint.route("/debates/questions/<question_id>/archive", methods=['POST'])
@admin_required
def archive_debate(question_id):
    question = cdw.questions.with_id(question_id)
    question.archived = True
    question.archiveDate = datetime.datetime.utcnow()
    question.save()
    return redirect("/admin/debates/questions")

@blueprint.route("/debates/suggestions")
@admin_required
def suggestions_index():
    page = int(request.args.get('page', 1))
    amt = int(request.args.get('amt', 50))
    sort = request.args.get('sort', 'recent')
    
    sort_lookup = {
        'recent': '-created',
    }
    
    order_rule = sort_lookup[sort]
    start = max(0, (page-1) * amt)
    end = start + amt
    
    total_questions = float(cdw.suggestions.all().count())
    total_pages = int(ceil(total_questions / float(amt)))
    
    questions = cdw.suggestions.all().order_by(order_rule)[start:end]
    
    return render_template('admin/debates/suggestions.html',
                           questions=questions,
                           current_page=page,
                           total_pages=total_pages,
                           section_selector='debates', 
                           page_selector='suggestions')
    
@blueprint.route("/debates/badwords", methods=['GET','POST'])
@admin_required    
def debates_badwords():
    if request.method == 'POST':
        new_words = request.form.get('badwords', settings.get_bad_words())
        settings.set_bad_words(new_words)
        flash('Bad words updated successfully.', 'info')
        
    return render_template('admin/debates/badwords.html',
                           badwords=settings.get_bad_words(), 
                           section_selector='debates', 
                           page_selector='badwords')
    
@blueprint.route("/debates/graylist", methods=['GET','POST'])
@admin_required    
def debates_graylist():
    if request.method == 'POST':
        new_words = request.form.get('graylist', settings.get_graylist())
        settings.set_graylist(new_words)
        flash('Gray list updated successfully.', 'info')
        
    return render_template('admin/debates/graylist.html',
                           graylist=settings.get_graylist(), 
                           section_selector='debates', 
                           page_selector='graylist')
    
@blueprint.route("/users", methods=['GET','POST'])    
@admin_required
def users():
    email_phone_username = request.form.get('email', None)
    
    if email_phone_username:
        user = None
        try:
            user = cdw.users.with_email(email_phone_username)
            return redirect("/admin/users/%s" % str(user.id))
        except:
            pass
        
        try:
            user = cdw.users.with_phoneNumber(email_phone_username)
            return redirect("/admin/users/%s" % str(user.id))
        except:
            pass
            #msg = "Could not find user with email or phone: %s" % email_phone_username
            #flash(msg, 'error')
            
    contains = email_phone_username or ''
    page = int(request.args.get('page', 1))
    amt = int(request.args.get('amt', 50))
    
    start = max(0, (page-1) * amt)
    end = start + amt
    
    if contains != '':
        total_users = cdw.users.with_fields(username__icontains=contains).count()
        total_pages = int(ceil(float(total_users) / float(amt)))
        users = cdw.users.with_fields(username__icontains=contains)[start:end]
    else:
        total_users = cdw.users.all().count()
        total_pages = int(ceil(float(total_users) / float(amt)))
        users = cdw.users.all()[start:end]
    
    return render_template('admin/users/list.html',
                           users=users,
                           total_users=total_users,
                           contains=contains,
                           current_page=page,
                           total_pages=total_pages, 
                           section_selector='users', 
                           page_selector='index')

@blueprint.route("/users/<user_id>")    
@admin_required
def users_show(user_id):
    user = cdw.users.with_id(user_id)
    flagCount = 0;
    posts = cdw.posts.with_fields(author=user)
    
    for post in posts:
        flagCount += post.flags
        
    return render_template('admin/users/show.html',
                           user=user,
                           posts=posts,
                           flagCount=flagCount,
                           section_selector="users",
                           page_selector="show")
    
@blueprint.route("/users/<user_id>/toggleadmin", methods=["POST"])
@admin_required    
def users_toggleadmin(user_id):
    user = cdw.users.with_id(user_id)
    user.isAdmin = not user.isAdmin
    user.save()
    return redirect("/admin/users/%s" % str(user.id))

@blueprint.route("/users/<user_id>/toggleactive", methods=["POST"])
@admin_required    
def users_toggleactive(user_id):
    user = cdw.users.with_id(user_id)
    user.active = not user.active
    user.save()
    return redirect("/admin/users/%s" % str(user.id))

@blueprint.route("/archives")
@admin_required
def archives():
    archived_questions = cdw.questions.with_fields(archived=True)
    
    page = int(request.args.get('page', 1))
    amt = int(request.args.get('amt', 50))
    
    start = max(0, (page-1) * amt)
    end = start + amt
    
    total_pages = int(ceil(float(len(archived_questions)) / float(amt)))
    archived_questions = archived_questions[start:end]
    
    archive_data = []
    
    for question in archived_questions:
        yesCount = 0
        noCount = 0
        users = []
        
        threads = cdw.threads.with_fields(question=question)
        
        for thread in threads:
            posts = cdw.posts.with_fields(thread=thread)
            
            for post in posts:
                if post.yesNo == 0:
                    noCount += 1
                else:
                    yesCount += 1
                    
                if str(post.author.id) not in users:
                    users.append(str(post.author.id))
                    
        archive_data.append(dict(
            question=question,
            yesCount=yesCount,
            noCount=noCount,
            userCount=len(users),
            endDate=question.archiveDate 
        ))
        
    return render_template('admin/archives/index.html', 
                           archive_data=archive_data,
                           total_pages=total_pages,
                           current_page=page,
                           section_selector='archives', 
                           page_selector='index')

def init(app):
    app.register_blueprint(blueprint, url_prefix="/admin")
    