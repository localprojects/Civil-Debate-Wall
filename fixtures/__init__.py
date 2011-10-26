import datetime
import random
import factory
from cdw.models import Category, Question, User, Post, Thread
import mongoengine

def factory_create_func(class_to_create, **kwargs):
    instance = class_to_create(**kwargs)
    instance.save()
    return instance

factory.Factory.set_creation_function(factory_create_func) 

class DatesMixin(object):
    created = datetime.datetime.utcnow()
    modified = datetime.datetime.utcnow()
    
class CategoryFactory(factory.Factory):
    FACTORY_FOR = Category
    
    name = "Politics"

class QuestionFactory(factory.Factory, DatesMixin):
    FACTORY_FOR = Question
    
    text = "What is your favorite color?"
    author = factory.LazyAttribute(lambda a: UserFactory())
    category = factory.LazyAttribute(lambda a: CategoryFactory())
    active = True
    approved = True
    endDate = datetime.datetime.utcnow() + datetime.timedelta(days=7)

class UserFactory(factory.Factory, DatesMixin):
    FACTORY_FOR = User
    
    username = 'matt'
    email = 'matt@localprojects.net'
    phoneNumber = '3155696217'
    password = 'password'
    origin = 'web'
    isAdmin = True
    active = True
    
class ThreadFactory(factory.Factory, DatesMixin):
    FACTORY_FOR = Thread
    
    question = factory.LazyAttribute(lambda a: QuestionFactory())
    firstPost = factory.LazyAttribute(lambda a: PostFactory())
    
class PostFactory(factory.Factory, DatesMixin):
    FACTORY_FOR = Post
    
    author = factory.LazyAttribute(lambda a: UserFactory())
    thread = factory.LazyAttribute(lambda a: ThreadFactory())
    text = "My favorite color is blue because it reminds me of the sea!"
    origin = 'web'
    yesNo = 1
    likes = 0
    flags = 0
    
    
def db_seed():
    """
    Python based seed data
    """
    mongoengine.connect('cdw_flask')
    
    User.drop_collection()
    Category.drop_collection()
    Question.drop_collection()
    Thread.drop_collection()
    Post.drop_collection()
    
    users = []
    phone = 3155696216
    for f, l in [('matt','wright'),('sundar','raman'),('ethan','holda'),('philipp','rockell'),('jen','snyder')]:
        phone += 1
        users.append(UserFactory(username=f, email='%s.%s@localprojects.net' % (f, l), 
                                 phoneNumber=str(phone)))
    
    categories = []
    for c in ['Politics', 'Environment', 'Religion', 'World', 'Technology', 'Misc']:
        categories.append(CategoryFactory(name=c))
        
    questions = []
    for q, c, u, a in [('Should the legal age to recieve a driver\'s license be raised?',0,0,True),
                    ('Does the employment strategy directed to help disadvantaged ethnic minorities constitute racial discrimination?',0,1,False),
                    ('Is space exploration a waste of federal tax dollars?',4,2,False),
                    ('Should creationism and evolution be taught side by side?',2,3,False),]:
        questions.append(QuestionFactory(text=q, category=categories[c], author=users[u], active=a))
        
    threads = []
    for u, yn, t in [(0, 1, 'Too many young drivers are causing a lot of accidents on the road'),
                 (1, 0, 'It\'s fine. You need to start driving at some point.'),
                 (2, 1, 'Yes, their bad driving habits are causing my insurance prices to rise.'),
                 (3, 1, 'It should be raise to 18 just like most goverment priviledges are set to.'),
                 (4, 0, 'The driving age is just fine, there\'s no reason to suddenly change it.'),]:
        thread = ThreadFactory(question=questions[0], firstPost=None)
        threads.append(thread)
        thread.firstPost = PostFactory(author=users[u], text=t, yesNo=yn, thread=thread)
        thread.save()
        
    for i in range(15):
        for n in range(5):
            PostFactory(author=users[random.randint(0,4)], 
                        text='Lorem ipsum dolor sit amet. Reply %s' % i,
                        thread=threads[n])
    
def db_export():
    """
    Export the DB to json files using mongoexport
    """
    pass