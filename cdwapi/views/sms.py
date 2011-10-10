import datetime, urllib
from cdw import cdw
from cdw.forms import normalize_phonenumber
from cdw.services import EntityNotFoundException
from cdwapi import cdwapi, jsonify
from flask import request, current_app, abort

def load_views(app):
    @app.route("/sms/kiosk/<id>", methods=['GET'])
    def kiosk_handler_get(id):
        kiosk_number = current_app.config['CDW']['KIOSKS']['KIOSK_%s' % id]
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
            kiosk_number = current_app.config['CDW']['KIOSKS']['KIOSK_%s' % id]
            data = request.form.to_dict()
            phone = normalize_phonenumber(urllib.unquote(data['From']))
            message = urllib.unquote_plus(data['Body']).strip()
            msg = cdwapi.save_incoming_sms(kiosk_number, phone, message)
            return jsonify(msg)
        except Exception, e:
            current_app.logger.error("Error receiving message from Twilio: %s" % e)
            raise e
        
    @app.route("/sms/switchboard", methods=['POST'])
    def switchboard():
        try:
            data = request.form.to_dict()
            sender = normalize_phonenumber(urllib.unquote(data['From']))
            message = urllib.unquote_plus(data['Body']).strip()
            user = cdw.users.with_phoneNumber(sender)
        except EntityNotFoundException:
            current_app.logger.error('SMS message from unregistered phone number: %s' % sender)
            abort(400)
        except Exception, e:
            current_app.logger.error('Unexpected SMS Switchboard POST: %s' % e)
            abort(400)
        
        if message.lower() in ['stop','unsubscribe']:
            cdwapi.stop_sms_updates(user)
        elif message.lower() in ['start','subscribe']:
            cdwapi.start_sms_updates(user)
        elif message.lower() in ['undo','stay']:
            user.revert_sms_subscription()
        else:
            cdwapi.post_via_sms(user, message)
        
        return jsonify({ "success": True })