"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
    
    Notes:
    * JSONP requires that jsonify is passed in with a dict as {}, instead of params
"""
from cdw import jsonp, login_cookie
from cdw.forms import QuestionForm, PostForm, SuggestQuestionForm
from cdw.services import cdw
from cdwapi import (not_found_on_error, auth_token_required, 
    auth_token_or_logged_in_required, jsonify)
from cdwapi.helpers import paginate, as_multidict, pager
from flask import request, current_app
from flask.ext.login import current_user

def load_views(blueprint):
    
    @blueprint.route('/questions', methods=['GET'])
    @jsonp
    @login_cookie
    def questions_index_get():
        # skip, limit = paginate()
        skip, limit = pager()
        return jsonify(cdw.questions.all()[skip:limit])
    
    @blueprint.route('/questions', methods=['POST'])
    @auth_token_required
    @jsonp
    @login_cookie
    def questions_index_post():
        form = QuestionForm(request.form, csrf_enabled=False)
        form.category.choices = [(str(c.id), c.name) for c in cdw.categories.all()]
        if form.validate():
            return jsonify(cdw.questions.save(form.to_question()))
        else:
            return jsonify({"errors":form.errors}, 400)
        
    @blueprint.route('/questions/<id>', methods=['GET'])
    @not_found_on_error
    @jsonp
    @login_cookie
    def questions_show(id):
        return jsonify(cdw.questions.with_id(id))
    
    @blueprint.route('/questions/<id>/threads', methods=['GET'])
    @not_found_on_error
    @jsonp
    @login_cookie
    def questions_threads_get(id):
        page = int(request.args.get('page', 0))
        amt = int(request.args.get('amt', 100))
        sort = request.args.get('sort', 'recent')
        origin = request.args.get('origin', 'web,kiosk,cell').split(',')
        sort_lookup = {
            'recent': '-created',
            'yes': '-yesNo',
            'no': '+yesNo',
            'responses': '-postCount'
        }
        
        order_rule = sort_lookup[sort]
        if sort in ['yes','no']:
            yesNo = [0] if sort == 'no' else [1]
        else:
            yesNo = [0,1]
        
        #current_app.logger.debug('page=%s&amt=%s&sort=%s' % (page, amt, sort))
        #current_app.logger.debug('order_rule=%s&start=%s&'
        #                         'end=%s' % (order_rule, start, end))
        
        threads = cdw.threads.with_fields(
            question=cdw.questions.with_id(id),
            origin__in = origin,
            yesNo__in = yesNo,
        ).order_by(order_rule)
        total = len(threads)
        
        # Index should only come from website
        # This is to prevent too many items from being loaded into the browser
        id_offset = request.args.get('id_offset', None)
        
        if id_offset:            
            threads.rewind()
            threads = threads.select_related(1)
            
            i = 0
            
            if id_offset != 'current':
                for t in threads:
                    if str(t.id) == id_offset:
                        break;
                    i += 1
            
            # Organize them into a list with the offset in the middle
            # to give the website a never ending 'loop' feel
            organized = []    
            
            # most items to each side possible without overlap
            rl = min(30, (total - 1) / 2)
            
            for n in range(i, i+rl):
                if n >= total:
                    ni = n - total
                else:
                    ni = n
                
                if threads[ni] not in organized:
                    organized.append(threads[ni])
            
            
            for n in range(i-1, i-1-rl, -1):
                if n < 0:
                    ni = total + n
                else:
                    ni = n
                
                if threads[ni] not in organized:
                    organized.insert(0, threads[ni])
            
            #current_app.logger.debug(organized)     
            return jsonify(organized)
        
        else:
            start = max(0, page * amt)
            end = min(start + amt, total)
            return jsonify(threads[start:end])
    
    @blueprint.route('/questions/<id>/threads', methods=['POST'])
    @not_found_on_error
    @auth_token_or_logged_in_required
    @jsonp
    @login_cookie
    def questions_threads_post(id):
        question = cdw.questions.with_id(id)
        form = PostForm(request.form, csrf_enabled=False)
        
        current_app.logger.debug(request.form.to_dict())
        
        if form.validate():
            post = form.to_post()
            follow_sms = form.get_follow_sms() 
            follow_email = form.get_follow_email()
            
            # The kiosk will send a phone number with the post if the user
            # wants to subscribe via SMS so we need to set the user's phone
            if form.origin.data == 'kiosk':
                follow_sms = True
            thread = cdw.create_thread(question, post, follow_sms, follow_email)

            return jsonify(thread)
        else:
            current_app.logger.debug("Error creating thread: %s" % form.errors)
            return jsonify({"error":form.errors}, 400)
    
    @blueprint.route('/questions/current', methods=['GET'])
    @not_found_on_error
    @jsonp
    @login_cookie
    def questions_current():
        
        question = cdw.questions.with_active(True)
        
        return jsonify(question)
    
    @blueprint.route('/questions/categories', methods=['GET'])
    @jsonp
    @login_cookie
    def questions_categories():
        # skip, limit = paginate()
        skip, limit = pager()
        return jsonify(cdw.categories.all()[skip:limit])

    @blueprint.route('/questions/archived', methods=['GET'])
    @not_found_on_error
    @jsonp
    def questions_archived():
        question = cdw.questions.with_fields(archived=True)
        
        return jsonify(question)
    
# Posts for questions
    @blueprint.route('/questions/<id>/posts', methods=['GET'])
    @not_found_on_error
    @jsonp
    @login_cookie
    def questions_posts_get(id):
        page = int(request.args.get('page', request.args.get('skip', 0)))
        amt = int(request.args.get('amt', request.args.get('limit', 100)))
        try:        
            posts, total = cdw.get_posts_for_question(cdw.questions.with_id(id),
                                                      page, amt)
        
            posts = [x.as_dict() for x in posts]
            return jsonify({ 'status': 200, 'total': total, 'data': posts})
    
        except Exception, exc:
            return jsonify({'status': 500, 'error': str(exc)})
        
# Suggestions
    @blueprint.route("/suggestion", methods=['POST'])
    @auth_token_or_logged_in_required
    @jsonp
    @login_cookie
    def suggest_question():
        form = SuggestQuestionForm(as_multidict(request.json), 
                                   csrf_enabled=False) 
        message = 'We have received your question. Thanks for the suggestion %s!' % current_user.username
        if form.validate():
            form.to_question().save()
            return jsonify({'status': 200, 'message': message})

        else:        
            return jsonify({'status': 500, 'errors': form.errors})

