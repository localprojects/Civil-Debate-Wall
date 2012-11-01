define(['jquery', 'underscore', 'backbone', 'models/debate', 'models/question', 'text!templates/comments/comments.html', 'text!templates/comments/yesno.html'], function ($, _, Backbone, DebateModel, QuestionModel, _commentsTemplate, _yesnoTemplate) {

    var CommentsView = Backbone.View.extend({

        el: $("#comments"),

        initialize: function () {
           
           this.models = {
              debate : new DebateModel(),
              question :  new QuestionModel()
           }
        },
        
       events: {
            "click #commentsform .reply": "sayIt",
            "click .likes" : "likes",
            "click .debates.bottom .debate .reply" : "reply"
        },
        
        reply : function() {
           
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
        
        onYesNoView : function() {
            var key = "question_" + this.models.question.data.id + "_vote";
            
            if ($("#yesno-overlay").length === 0) {

               $("#wrapper").prepend(_.template(_yesnoTemplate));
               //bind events
               
               
               $("#yesno-overlay .close,#yesno-overlay .cancel").unbind().bind("click", function() {
                  $("#yesno-overlay").hide();
                  $("#comments").show();
               });
               
               //bind yes no button
               $("#yesno-overlay .btn-wrap .btn").unbind().bind("click", function() {
                  sessionStorage.setItem(key, $(this).attr("data-vote"));
                  $(this).siblings().removeClass("select").end().addClass("select");
                  $("#yesno-overlay").hide();
                  $("#comments").show();
                  
                  $(window).bind("CDW.isLogin", function() {
                     //post to thread and indert to the dom
                     $("#comments").show();
                  });
              
                  CDW.utils.auth.init();
                  
                  
               });
               
              } else {

               $("#yesno-overlay").show();
              
            }
            
             $("#comments").hide();
                        
            
        },
        
        
        sayIt : function() {
           
           if ($("#commentsform input").attr("value") === '') {
             return false;
           }
           
         if (sessionStorage["question_" + this.models.question.data.id + "_vote"]) {
           this.$el.trigger("onYesNoView");
         } else {
          // post the debate
         }    
           
       
           
        },
        
        render: function (qid,did,reply) {
          var that = this;
          
          this.models.question.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/questions/"+qid;
          this.models.question.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/questions/4ed68023e56d7a09c8000003";
          this.models.debate.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/threads/"+did;
          this.models.debate.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/threads/4f29a15be56d7a18cb000007";
        
        this.models.question.fetch({
        
             dataType: "jsonp",
             
             success: function(model,questiondata) {
                
                that.models.question.data = questiondata;
                
                that.models.debate.fetch({

                dataType: "jsonp",

                success: function (model, debatedata) {
                
                   that.models.debate.data = debatedata;                 
                   _.templateSettings.variable = "comments";
                   that.$el.html(_.template(_commentsTemplate, that.models));
                   that.$el.bind("onYesNoView", $.proxy(that.onYesNoView, that));
                   
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
    return CommentsView;
});
