define(['jquery', 'underscore', 'backbone', 'models/stats' , 'models/question', 'text!templates/stats/stats.html', 'text!templates/quickvote/quickvote.html'], function ($, _, Backbone, StatsModel, QuestionModel, _statsTemplate, _quickvoteTemplate) {

    var firstload = true,
    
       CommentsView = Backbone.View.extend({

        el: $("#stats"),

        initialize: function () {
           
           this.models = {
              stats : new StatsModel(),
              question :  new QuestionModel()
           }
        },
        
       events: {
            "click .stats-tab .btn" : "showContent",            
            "click .debates .debate .reply" : "goThread",
            "click .debate .desc": "goThread",
            "click .question .reply": "showStats",
            "click .question .text": "showStats",
            "click div.yes.btn": "showReplyForm",
            "click div.no.btn": "showReplyForm",
            "click #feedsform .reply": "reply"
            
        },
        
        drawNum : function(statsdata) {
           
        
           var totalheight = $(".opinion-bar").height(),
               totalYes = statsdata.debateTotals.yes,
               totalNo  = statsdata.debateTotals.no,
               yesHeight = parseInt((totalYes / (totalYes + totalNo)) * totalheight),
               noHeight = totalheight - yesHeight;
               
        
                if (yesHeight > noHeight) {
                   $("#triangle-blue").css("border-width", "50px "+Math.floor($("#wrapper").width()/2)+"px 0").show();
                   $("#triangle-orange").hide();
                   
                   } else {
                   $("#triangle-orange").css("border-width", "0 "+Math.floor($("#wrapper").width()/2)+"px 50px").show(); 
                   $("#triangle-blue").hide();
                }
                
                $(".opinion-bar").find(".yes.bar").height(yesHeight)
                $(".opinion-bar .yes .text").css("padding-top", yesHeight - 60 + "px");
                $(".opinion-bar").find(".no.bar").height(noHeight);
                
                
                
                
                $(".opinion-bar").find(".yes").css("height", yesHeight + "px").find(".number").text(totalYes).end().end().find(".no .number").text(totalNo);
               
               
           
           
           
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
        
        goThread : function(e) {           
           e.preventDefault();
           var fragment = ($(e.currentTarget).hasClass("desc")) ? "" : "/reply";
           window.location.href = "comments.html#/questions/"+this.models.question.data.id+"/debates/"+$(e.currentTarget).parent().parent().parent().attr("data-did")+"/posts" + fragment;
        },
        
        
        showContent : function(e) {
          var type = $(e.currentTarget).attr("data-type");
          
          $(e.currentTarget).siblings().removeClass("select").end().addClass("select");
          
          $(".opinion-bar, .debates.bottom.debated, .debates.bottom.liked").hide();
          
          if (type === "num") {
            $(".opinion-bar").show();
            $("#footer-container").hide();
          } else {
            $(".debates.bottom."+type).show();
            $("#footer-container").show();
          }
          
          //window.location.href = "stats.html#/questions/"+this.models.question.id+"/stats/"+ ((type !== 'num') ? type : "");
        },
        
        render: function (qid,did,reply) {
          

         
         var that = this,
              frags = window.location.href.split("/");

          
         this.models.question.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/questions/"+qid;
         
           if (!firstload) {
              $('[data-type="'+frags[frags.length-1]+'"]').trigger("click");                   
            }
          
          
        this.models.question.fetch({
        
             dataType: "jsonp",
             
             success: function(model,questiondata) {
                
                that.models.question.data = questiondata;
                
                that.models.stats.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/stats/questions/"+qid;
                
                that.models.stats.fetch({

                dataType: "jsonp",

                success: function (model, statsdata) {
                
                     that.models.stats.data = statsdata;                 
                    _.templateSettings.variable = "main";
                   
                                 
                   that.$el.find(".tmpl").append(_.template(_statsTemplate, that.models));
                   that.$el.find(".discussion").html(_.template(_quickvoteTemplate, that.models));
                   
                   that.drawNum(statsdata);
                   $(".opinion-bar").show(); 
                   that.$el.find(".question .text").text(that.models.question.data.text);
                   //
                   $('[data-type="'+frags[frags.length-1]+'"]').trigger("click");
                   firstload = false;
                   
                   
                }
                 
                });
                
     
    
               $(window).resize(function() {
                 that.drawNum(that.models.stats.data);
               })

          
             }
        
        
        });
        
       
        }
    });
    return CommentsView;
});