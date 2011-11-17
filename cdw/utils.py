"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: See LICENSE for more details.
"""
import re

class InvalidPhoneNumberException(Exception): pass

def normalize_phonenumber(phone):
    """Converts a phone number down to only the required characters
    """
    phone = phone.strip()
    phone = re.sub("\D", "", phone)
    phone = re.sub("^1", "", phone)
    if not re.match("^[1-9]\d{9}$", phone):
        raise InvalidPhoneNumberException("Invalid phone number: %s" % phone)
    return phone
