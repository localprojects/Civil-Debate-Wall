import datetime
import random
import factory
import subprocess
from fabric.api import env
from cdw.models import Category, Question, User, Post, Thread
import mongoengine

def factory_create_func(class_to_create, **kwargs):
    instance = class_to_create(**kwargs)
    instance.save()
    return instance

factory.Factory.set_creation_function(factory_create_func) 
    
class CategoryFactory(factory.Factory):
    FACTORY_FOR = Category
    
    name = "Politics"

class QuestionFactory(factory.Factory):
    FACTORY_FOR = Question
    
    text = "What is your favorite color?"
    author = factory.LazyAttribute(lambda a: UserFactory())
    category = factory.LazyAttribute(lambda a: CategoryFactory())
    active = True
    approved = True
    endDate = datetime.datetime.utcnow() + datetime.timedelta(days=7)
    created = datetime.datetime.utcnow()
    modified = datetime.datetime.utcnow()

class UserFactory(factory.Factory):
    FACTORY_FOR = User
    
    username = 'matt'
    email = 'matt@localprojects.net'
    phoneNumber = '3155696217'
    password = 'password'
    origin = 'web'
    isAdmin = True
    active = True
    created = datetime.datetime.utcnow()
    modified = datetime.datetime.utcnow()
    threadSubscription = None
    
    
class ThreadFactory(factory.Factory):
    FACTORY_FOR = Thread
    
    question = factory.LazyAttribute(lambda a: QuestionFactory())
    firstPost = factory.LazyAttribute(lambda a: PostFactory())
    postCount = 1
    yesNo = 1
    origin = 'web'
    created = datetime.datetime.utcnow()
    modified = datetime.datetime.utcnow()
    authorId = None
    
class PostFactory(factory.Factory):
    FACTORY_FOR = Post
    
    author = factory.LazyAttribute(lambda a: UserFactory())
    thread = factory.LazyAttribute(lambda a: ThreadFactory())
    text = "My favorite color is blue because it reminds me of the sea!"
    origin = 'web'
    yesNo = 1
    likes = 0
    flags = 0
    created = datetime.datetime.utcnow()
    modified = datetime.datetime.utcnow()
    
    
def db_seed():
    """
    Python based seed data
    """
    mongoengine.connect('%(app_mongodb_db)s' % env,
                        '%(app_mongodb_username)s' % env,
                        '%(app_mongodb_password)s' % env,
                        host='%(app_mongodb_host)s' % env,
                        port=int('%(app_mongodb_port)s' % env))
    
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
    for q, c, u, a, ed in [('Archived question?',0,0,False, datetime.timedelta(days=-7)),
                           ('Should the legal age to recieve a driver\'s license be raised?',0,0,True, datetime.timedelta(days=7)),
                           ('Does the employment strategy directed to help disadvantaged ethnic minorities constitute racial discrimination?',0,1,False, datetime.timedelta(days=14)),
                           ('Is space exploration a waste of federal tax dollars?',4,2,False, datetime.timedelta(days=21)),
                           ('Should creationism and evolution be taught side by side?',2,3,False, datetime.timedelta(days=28)),]:
        questions.append(QuestionFactory(text=q, category=categories[c], author=users[u], active=a, endDate=datetime.datetime.utcnow() + ed))
        
    threads = []
    for u, yn, t in [(0, 1, 'Too many young drivers are causing a lot of accidents on the road'),
                 (1, 0, 'It\'s fine. You need to start driving at some point.'),
                 (2, 1, 'Yes, their bad driving habits are causing my insurance prices to rise.'),
                 (3, 1, 'It should be raise to 18 just like most goverment priviledges are set to.'),
                 (4, 0, 'The driving age is just fine, there\'s no reason to suddenly change it.'),]:
        
        for i in range(2):
            for n in range(20):
                thread = ThreadFactory(question=questions[i], firstPost=None, postCount=1, yesNo=None, origin='web')
                threads.append(thread)
                thread.firstPost = PostFactory(author=users[u], text=t, yesNo=yn, thread=thread, 
                                               created=datetime.datetime.utcnow() + datetime.timedelta(days=random.randint(-20, 0)))
                thread.created = thread.firstPost.created
                thread.yesNo = thread.firstPost.yesNo
                thread.authorId = thread.firstPost.author.id
                thread.save()
        
    for n in range(len(threads)):
        for i in range(15):
            thread = threads[n]
            PostFactory(author=users[random.randint(0,4)], 
                        text='Lorem ipsum dolor sit amet. Reply %s' % i,
                        yesNo=random.randint(0,1),
                        thread=thread,
                        created=thread.created + datetime.timedelta(seconds=i))
            thread.postCount += 1
            thread.save()
            
    user = users[0]
    user.threadSubscription = threads[7]
    user.save()
    
def db_export():
    """
    Export the DB to json files using mongoexport
    """
    def create_command(collection):
        cmd = 'mongoexport -h %(app_mongodb_host)s -d %(app_mongodb_db)s ' % env
        if len(env.app_mongodb_username) > 0:
            cmd += '-u %(app_mongodb_username)s -p %(app_mongodb_password)s ' % env
            
        cmd += '-c %s -o %s/fixtures/json/%s.json' % (collection, env.lcwd, collection)
        return cmd
    
    for collection in ['question', 'category', 'user', 'thread', 'post', 'system.indexes']:
        subprocess.call(create_command(collection).split(' '))