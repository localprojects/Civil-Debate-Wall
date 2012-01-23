"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
from cdw.models import EntityMixin
from mongoengine import Document, StringField, BooleanField

class SMSRegistrationMessage(Document, EntityMixin):
    kioskNumber = StringField(required=True)
    phoneNumber = StringField(required=True)
    message = StringField(required=True, default='')
    profane = BooleanField()
    
    def as_dict(self):
        return {
            "kioskNumber": self.kioskNumber,
            "phoneNumber": self.phoneNumber,
            "message": self.message,
            "profane": self.profane,
        }