"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
import datetime, urllib
from cdw.forms import normalize_phonenumber
from cdw.services import cdw, EntityNotFoundException
from cdwapi import cdwapi, jsonify
from flask import request, current_app, abort

def load_views(app):
    @app.route("/sms/kiosk/<id>", methods=['GET'])
    def kiosk_handler_get(id):
        kiosk_number = current_app.config['CDW']['kiosks']['kiosk_%s' % id]
        recentMessages = cdwapi.get_recent_sms_messages(kiosk_number)
        return jsonify({
            "serverTime": str(datetime.datetime.now()),
            "number": kiosk_number,
            "recentMessages": recentMessages,
        })
    
    @app.route("/sms/kiosk/<id>", methods=['POST'])
    def kiosk_handler_post(id):
        try:
            # TODO: Add Twilio Validator
            kiosk_number = current_app.config['CDW']['kiosks']['kiosk_%s' % id]
            data = request.form.to_dict()
            phone = normalize_phonenumber(urllib.unquote(data['From']))
            message = urllib.unquote_plus(data['Body']).strip()
            msg = cdwapi.save_incoming_sms(kiosk_number, phone, message)
            return jsonify(msg)
        except Exception, e:
            current_app.logger.error("Error receiving message from "
                                     "Twilio: %s" % e)
            raise e
        
    @app.route("/sms/switchboard", methods=['POST'])
    def switchboard():
        data = request.form.to_dict()
        sender = normalize_phonenumber(urllib.unquote(data['From']))
        message = urllib.unquote_plus(data['Body']).strip().lower()
        
        # Get the users with the provided phone number and sort based
        # on the last time they posted a message
        users = cdw.users.with_fields(
                    phoneNumber=sender).order_by('-lastPostDate')
                    
        if len(users) == 0:
            msg = "SMS from unregistered phone number: %s" % sender
            current_app.logger.error(msg)
            abort(400, description=msg)
        
        def handle_message(user, message):
            if message in ['stop','unsubscribe']:
                cdwapi.stop_sms_updates(user)
            elif message in ['start','resume', 'subscribe']:
                cdwapi.resume_sms_updates(user)
            elif message in ['undo','stay']:
                cdwapi.revert_sms_updates(user)
            else:
                cdwapi.post_via_sms(user, message)
                
            return jsonify({ "success": True })
        
        for user in users:
            if user.threadSubscription != None:
                return handle_message(user, message)
            
        abort(400, description="A user with this phone number was found "
                               "but they did not have a subscription")
