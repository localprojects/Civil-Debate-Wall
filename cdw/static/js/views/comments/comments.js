define(['jquery', 'underscore', 'backbone', 'models/debate', 'models/question', 'text!templates/comments/comments.html'], function ($, _, Backbone, DebateModel, QuestionModel, _commentsTemplate) {

    var CommentsView = Backbone.View.extend({

        el: $("#comments"),

        initialize: function () {
           
           this.models = {
              debate : new DebateModel(),
              question :  new QuestionModel()
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