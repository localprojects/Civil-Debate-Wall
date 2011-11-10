from cdw.forms import PostForm
from cdw.services import cdw
from cdwapi import (jsonify, not_found_on_error, auth_token_or_logged_in_required, has_valid_auth_token)                          
from flask import request, current_app
from flaskext.login import current_user

def multikeysort(items, columns):
    from operator import itemgetter
    comparers = [ ((itemgetter(col[1:].strip()), -1) if col.startswith('-') else (itemgetter(col.strip()), 1)) for col in columns]  
    def comparer(left, right):
        for fn, mult in comparers:
            result = cmp(fn(left), fn(right))
            if result:
                return mult * result
        else:
            return 0
    return sorted(items, cmp=comparer)

def load_views(blueprint):
    
    @blueprint.route('/stats/questions/<question_id>', methods=['GET'])
    @not_found_on_error
    def stats_question(question_id):
        question = cdw.questions.with_id(question_id)
                
        stats = {}
        
        stats['question'] = question.as_dict()
        
        threads = cdw.threads.with_fields(question=question)
            
        yes_debate_count = 0
        no_debate_count = 0
        yes_likes = 0
        no_likes = 0
        
        mostDebatedOpinions = list()
        
        for thread in threads:
            posts_in_thread = cdw.posts.with_fields(thread=thread)
            first_post = posts_in_thread[0]
            
            mostDebatedOpinions.append({ 
                'id': str(thread.id), 
                'commentCount': len(posts_in_thread),
                'firstPost': first_post.as_dict(),
            })
            
            if first_post.yesNo == 1:
                yes_debate_count += 1
                yes_likes += first_post.likes
            else:
                no_debate_count += 1
                no_likes += first_post.likes
        
        first_posts = []        
        posts = []
        for thread in threads:
            posts_in_thread = cdw.posts.with_fields(thread=thread)
            first_posts.append(posts_in_thread[0])
            posts = posts_in_thread[:]
                
        # comments can't have likes             
        for post in posts:
            if post.yesNo == 1:
                yes_debate_count += 1
            else:
                no_debate_count += 1
                
        words = dict()
        
        for thread in threads:
            first_post = thread.firstPost
            posts_in_thread = cdw.posts.with_fields(thread=thread)
            
            # first from the debate starter
            for post in posts_in_thread:
                for word in post.text.split():
                    if word not in words:
                        words[word] = {
                            'posts': [post.as_dict()], 
                            'yesCases': 0, 
                            'noCases': 0, 
                            'total': 0
                        }
                    else:
                        words[word]['posts'].append(post.as_dict())
                    
                    words[word]['total'] += 1
                    
                    if post.yesNo == 1:
                        words[word]['yesCases'] += 1
                    else:   
                        words[word]['noCases'] += 1                             
            
            # turn the dictionary into a list of objects so we can sort it
            wordList = list()
            
            for word in words:
                words[word]['word'] = word
                wordList.append(words[word])
                            
            # for every word, a list of debate threads where it appears             
            sortedWordList = sorted(wordList, key=lambda k: k['total'])[0:20]
            sortedWordList.reverse() # biggest first
            
            # only the top 20
            #sortedWordList = sortedWordList
            
            # add a ratio value
            for item in sortedWordList:
                ratio = float(item['yesCases']) / float(item['total'])
                item['ratio'] = ratio
            
            #sortedWordList = sorted(sortedWordList, key=lambda k: k['ratio'])
            sortedWordList = sorted(sortedWordList, key=lambda k: k['ratio'])
            sortedWordList.reverse()
            
            # Trying to sort on multiple keys
            #sortedWordList = multikeysort(sortedWordList, ['-total','-ratio'])
            
            
            # most liked debates
            likedFirstPosts = sorted(first_posts, key=lambda p: p.likes)[:5]
            likedFirstPosts.reverse()                
            
            liked = list()
            for post in likedFirstPosts:
                liked.append({'id': str(post.id), 'likes': post.likes})

            # most debated opinions
            # gathered in the first for loop
            mostDebatedOpinions = sorted(mostDebatedOpinions, key=lambda k: k['commentCount'])
            mostDebatedOpinions.reverse() # biggest first           
            
            # gather and return
            stats['debateTotals'] = {'yes': int(yes_debate_count), 'no': int(no_debate_count)}
            stats['likeTotals'] = {'yes': int(yes_likes), 'no': int(no_likes)}              
            stats['frequentWords'] = sortedWordList
            stats['mostLikedDebates'] = liked # only the top 5
            stats['mostDebatedOpinions'] = mostDebatedOpinions[0:5] # only the top 5
            
            return jsonify(stats)   