"""
    :copyright: (c) 2011 Local Projects, all rights reserved
    :license: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
"""
import string
from cdw import jsonp
from cdw.services import cdw
from cdwapi import (jsonify, not_found_on_error)
from flask.ext.login import current_user
from flask import current_app
import re

def multikeysort(items, columns):
    from operator import itemgetter
    comparers = [((itemgetter(col[1:].strip()), -1) if col.startswith('-') \
                  else (itemgetter(col.strip()), 1)) for col in columns]
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
    @jsonp
    def stats_question(question_id):
        question = cdw.questions.with_id(question_id)

        stats = {}

        stats['question'] = question.as_dict(full_path=True)

        threads = cdw.threads.with_fields(question=question).order_by('-created')

        yes_debate_count = 0
        no_debate_count = 0
        yes_likes = 0
        no_likes = 0

        # Most Debated
        mostDebatedOpinions = list()
        mostLikedOpinions = list()

        # Debate Totals
        first_posts = []

        # Frequently used words
        words = dict()
        connectors = current_app.config['CDWAPI']['connector_words']

    
        for thread in threads:
            posts_in_thread = cdw.posts.with_fields(thread=thread)
            commentCount = posts_in_thread.count()
            first_post = posts_in_thread[0]
            first_post_dict = first_post.as_dict(full_path=True)
            
            if first_post.likes > 0:
                mostLikedOpinions.append({
                    'id': str(thread.id),
                    'commentCount': commentCount,
                    'firstPost': first_post_dict,
                    'likes': first_post.likes
                })
                
            if commentCount > 1:
                mostDebatedOpinions.append({
                    'id': str(thread.id),
                    'commentCount': commentCount,
                    'firstPost': first_post_dict,
                    'likes': first_post.likes
                })

            if first_post.yesNo == 1:
                yes_debate_count += 1
                yes_likes += first_post.likes
            else:
                no_debate_count += 1
                no_likes += first_post.likes
                        
            # Do the debate stats
            if commentCount > 0:
                first_posts.append(first_post)
            else:
                continue
        
            for post in posts_in_thread[1:]:
                # Debate totals
                if post.yesNo == 1:
                    yes_debate_count += 1
                else:
                    no_debate_count += 1

                # Frequent used words
                for word in post.text.split():
                    # strip puncutation
                    #exclude = set(string.punctuation)
                    #word = word.join(ch for ch in word if ch not in exclude)
                    word = re.sub(r'([^\w\s]|_)+(?=\s|$)', '', word)
                    word = re.sub(r'^\W+', '', word).lower()

                    if word in connectors or len(word) < 3:
                        continue

                    if word not in words:
                        words[word] = {
                            'posts': [post.as_dict(full_path=True)],
                            'yesCases': 0,
                            'noCases': 0,
                            'total': 0
                        }
                    else:
                        if len(words[word]['posts']) < 20:
                            words[word]['posts'].append(post.as_dict(full_path=True))

                    words[word]['total'] += 1

                    if post.yesNo == 1:
                        words[word]['yesCases'] += 1
                    else:
                        words[word]['noCases'] += 1
                        
        mostDebatedOpinions = sorted(mostDebatedOpinions, key=lambda k: k['commentCount'])
        mostDebatedOpinions.reverse() # biggest first
        mostDebatedOpinions = [p for p in mostDebatedOpinions if p['commentCount'] > 0]

        mostLikedOpinions = sorted(mostLikedOpinions, key=lambda k: k['likes'])
        mostLikedOpinions.reverse()
        mostLikedOpinions = [p for p in mostLikedOpinions if p['likes'] > 0]

        # turn the dictionary into a list of objects so we can sort it
        wordList = list()

        for word in words:
            words[word]['word'] = word
            wordList.append(words[word])

        # for every word, a list of debate threads where it appears
        sortedWordList = sorted(wordList, key=lambda k: k['total'])
        sortedWordList.reverse() # biggest first

        # only the top 20
        sortedWordList = sortedWordList[:20]

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
        #likedFirstPosts = sorted(first_posts, key=lambda p: p.likes)[:5]
        #likedFirstPosts.reverse()

        #liked = list()
        #for post in likedFirstPosts:
        #    liked.append({'id': str(post.id), 'likes': post.likes})

        # gather and return
        stats['debateTotals'] = {'yes': int(yes_debate_count), 'no': int(no_debate_count)}
        stats['likeTotals'] = {'yes': int(yes_likes), 'no': int(no_likes)}
        stats['frequentWords'] = sortedWordList
        stats['mostLikedOpinions'] = mostLikedOpinions[0:5] # only the top 5
        stats['mostDebatedOpinions'] = mostDebatedOpinions[0:5] # only the top 5

        return jsonify(stats)
