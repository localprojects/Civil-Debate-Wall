define(['jquery', 'underscore', 'backbone', 'models/stats', 'models/debate', 'models/question', 'text!templates/comments/comments.html', 'text!templates/comments/yesno.html','text!templates/quickvote/quickvote.html','text!templates/quickvote/quickreply.html'], function ($, _, Backbone, StatsModel, DebateModel, QuestionModel, _commentsTemplate, _yesnoTemplate, _quickvoteTemplate, _quickreplyTemplate) {

    var CommentsView = Backbone.View.extend({

        el: $("#comments"),

        initialize: function () {
           
           this.models = {
              debate : new DebateModel(),
              question :  new QuestionModel(),
              stats    : new StatsModel()
           }
        },
        
       events: {
            "click #commentsform .reply": "sayIt",
            "click .likes" : "likes",
            "click .debates.bottom .debate .reply" : "replyTD",
            "click .question .reply": "showStats",
            "click .question .text": "showStats",
            "click div.yes.btn": "showReplyForm",
            "click div.no.btn": "showReplyForm",
            "click #feedsform .reply": "reply"
        },
        
        
        showStats: function (e) {
            
            CDW.utils.quickvote.showStats(e);
            
        },
        
        hideResetReplyForm: function (e) {
            CDW.utils.quickvote.hideResetReplyForm(e);
        },

        reply: function (e) {
        
           CDW.utils.quickvote.reply(e);
        },

        showReplyForm: function (e) {
                       
            CDW.utils.quickvote.showReplyForm(e, "question_" + this.models.question.data.id + "_vote");
            
        },


        replyTD : function() {
           
           $(window).bind("CDW.isLogin", function() {
                     //post to thread and indert to the dom
                     
           });
              
           CDW.utils.auth.init();
           
        },
        
        likes : function(e) {
        
           //CDW.utils.cdwFB.social.likes($(e.currentTarget).attr("data-did"));
           
           var target =  $(e.currentTarget);
              
           CDW.utils.likes(target.parent().parent().parent().attr("data-did"), target);
        
        },
        
                
        sayIt : function() {
           
           /*if ($("#commentsform input").attr("value") === '') {
             return false;
           }
           
         if (!sessionStorage["question_" + this.models.question.data.id + "_vote"]) {
           this.$el.trigger("onYesNoView");
         } else {
          // post the debate
         }*/    
           
          CDW.utils.quickreply.sayIt(this.models.question.data.id, "#comments");
           
        },
        
        render: function (qid,did,reply) {
          var that = this;
          
          this.models.question.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/questions/"+qid;
          this.models.debate.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/threads/"+did;

        
        this.models.question.fetch({
        
             dataType: "jsonp",
             
             success: function(model,questiondata) {
                
                that.models.question.data = questiondata;
                
                that.models.debate.fetch({

                dataType: "jsonp",

                success: function (model, debatedata) {
                   
                   that.models.debate.data = debatedata; 
                   
                   that.models.stats.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/stats/questions/"+that.models.question.data.id;
                    
                   that.models.stats.fetch({

                                dataType: "jsonp",

                                success: function (model, statsdata) {

                     that.models.stats.data = statsdata;                             
                   _.templateSettings.variable = "main";
                   
                   that.$el.find(".tmpl").html(_.template(_commentsTemplate, that.models));
                   that.$el.find(".debates.answar").html(_.template(_quickreplyTemplate, that.models));
                   that.$el.find(".discussion").html(_.template(_quickvoteTemplate, that.models));
                   
                   that.$el.bind("onYesNoView", $.proxy(that.onYesNoView, that));
                   $("#comments .question .text").text(that.models.question.data.text);
                   $("#comments .nav .middle").text("@" + that.models.debate.data.firstPost.author.username +" comments")
                   
                   if (reply) {
                     // bring up the keyboard
                     
                     $("#commentsform").find("input").focus();
                     
                     
                   }

                                }
                            });
                }
                 
                }); 
          
             }
        
        
        });
        
       
        }
    });
    return CommentsView;
});
