"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
from cdw.forms import QuestionForm, PostForm
from cdw.services import cdw
from cdwapi import (jsonify, not_found_on_error, auth_token_required, 
                    auth_token_or_logged_in_required)                          
from flask import request, current_app

def load_views(blueprint):
    
    @blueprint.route('/questions', methods=['GET'])
    def questions_index_get():
        return jsonify(cdw.questions.all())
    
    @blueprint.route('/questions', methods=['POST'])
    @auth_token_required
    def questions_index_post():
        form = QuestionForm(request.form, csrf_enabled=False)
        form.category.choices = [(str(c.id), c.name) for c in cdw.categories.all()]
        if form.validate():
            return jsonify(cdw.questions.save(form.to_question()))
        else:
            return jsonify({"errors":form.errors}, 400)
        
    @blueprint.route('/questions/<id>', methods=['GET'])
    @not_found_on_error
    def questions_show(id):
        return jsonify(cdw.questions.with_id(id))
    
    @blueprint.route('/questions/<id>/threads', methods=['GET'])
    @not_found_on_error
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
        start = max(0, page * amt)
        end = start + amt
        
        if sort in ['yes','no']:
            yesNo = [0] if sort == 'no' else [1]
        else:
            yesNo = [0,1]
        
        current_app.logger.debug('page=%s&amt=%s&sort=%s' % (page, amt, sort))
        current_app.logger.debug('order_rule=%s&start=%s&'
                                 'end=%s' % (order_rule, start, end))
        
        threads = cdw.threads.with_fields(
            question=cdw.questions.with_id(id),
            origin__in = origin,
            yesNo__in = yesNo,
        ).order_by(order_rule)
        
        # Index should only come from website
        # This is to prevent too many items from being loaded into the browser
        id_offset = request.args.get('id_offset', None)
        
        if id_offset:
            if id_offset == 'current':
                id_offset = str(threads[0].id)
            
            i = 0
            for t in threads:
                if str(t.id) == id_offset:
                    break;
                i += 1
            
            threads.rewind()
            threads = threads.select_related(1)
                
            nl = threads[i:] + threads[:i]
            all = nl * 2
            mid = len(all) / 2
            threads = all[mid-10:mid+10]
            print threads[0].firstPost.author
            
        return jsonify(threads)
    
    @blueprint.route('/questions/<id>/threads', methods=['POST'])
    @not_found_on_error
    @auth_token_or_logged_in_required
    def questions_threads_post(id):
        question = cdw.questions.with_id(id)
        form = PostForm(request.form, csrf_enabled=False)
        
        if form.validate():
            current_app.logger.debug(request.form)
            
            post = form.to_post()
            
            follow_sms = form.get_follow_sms() 
            follow_email = form.get_follow_sms()
            
            # The kiosk will send a phone number with the post if the user
            # wants to subscribe via SMS so we need to set the user's phone
            if form.origin.data == 'kiosk':
                follow_sms = True
            else:
                current_app.logger.debug("Kiosk case did not satisfy. "
                                         "User phone number: %s" % post.author.phoneNumber)
                
            thread = cdw.create_thread(question, post, follow_sms, follow_email)
                
            return jsonify(thread)
        else:
            current_app.logger.debug("Error creating thread: %s" % form.errors)
            return jsonify({"error":form.errors}, 400)
    
    @blueprint.route('/questions/current', methods=['GET'])
    @not_found_on_error
    def questions_current():
        question = cdw.questions.with_active(True)
        
        return jsonify(question)
    
    @blueprint.route('/questions/categories', methods=['GET'])
    def questions_categories():
        return jsonify(cdw.categories.all())
    