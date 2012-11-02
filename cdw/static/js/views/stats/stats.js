define(['jquery', 'underscore', 'backbone', 'models/stats' , 'models/question', 'text!templates/stats/stats.html'], function ($, _, Backbone, StatsModel, QuestionModel, _statsTemplate) {

    var CommentsView = Backbone.View.extend({

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
            "click .debate .desc": "goThread"
            
        },
        
        drawNum : function(statsdata) {
           
         
           var totalheight = $(document).height() - $(".opinion-bar").height(),
               totalYes = statsdata.debateTotals.yes,
               totalNo  = statsdata.debateTotals.no,
               yesHeight = parseInt((totalYes / (totalYes + totalYes)) * totalheight);
               
                $("#triangle-orange").css("border-width", "0px "+Math.floor($("#wrapper").width()/2)+"px 50px");
                $(".opinion-bar").find(".yes").css("height", yesHeight + "px");
               
               
           
           
           
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
          } else {
            $(".debates.bottom."+type).show();
          }
        },
        
        render: function (qid,did,reply) {
          var that = this;
          
          this.models.question.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/questions/"+qid;
          
          
          
        
        this.models.question.fetch({
        
             dataType: "jsonp",
             
             success: function(model,questiondata) {
                
                that.models.question.data = questiondata;
                
                that.models.stats.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/stats/questions/"+qid;
                
                that.models.stats.fetch({

                dataType: "jsonp",

                success: function (model, statsdata) {
                
                     that.models.stats.data = statsdata;                 
                    _.templateSettings.variable = "stats";
                   
                                 
                   that.$el.find(".tmpl").append(_.template(_statsTemplate, that.models));
                   that.drawNum(statsdata);
                   $(".opinion-bar").show(); 
                   that.$el.find(".question .text").text(that.models.question.data.text)
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