from cdw.models import User
from flaskext.script import Command, Option

class MakeAdmin(Command):
    """Add a user to the database"""
    
    option_list = (
        Option('--email', '-e', dest='email'),
    )
    
    def run(self, email):
        try:
            u = User.objects(email=email).first()
            u.isAdmin = True
            u.save()
            print "Successfully granted %s admin rights" % email
        except Exception, e:
            print "Could not find user with email: %s" % email
            print "Error: %s" % e
