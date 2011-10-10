import re

class InvalidPhoneNumberException(Exception): pass

def normalize_phonenumber(phone):
    phone = phone.strip()
    phone = re.sub("\D", "", phone)
    phone = re.sub("^1", "", phone)
    if not re.match("^[1-9]\d{9}$", phone):
        raise InvalidPhoneNumberException("Invalid phone number: %s" % phone)
    return phone