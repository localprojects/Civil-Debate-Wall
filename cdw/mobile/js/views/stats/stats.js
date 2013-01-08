define(['jquery', 
'underscore', 
'backbone', 
'config',
'models/stats' , 
'models/question', 
'text!templates/stats/stats.html', 
'text!templates/quickvote/quickvote.html',
'jquery_mobile' ], 
function ($,
	 _, 
	 Backbone, 
	 Config,
	 StatsModel,
	 QuestionModel,
	 _statsTemplate, 
	 _quickvoteTemplate,
	 Mobile) {


	var apiHost = Config.api_host;
	var repliesPerPage = Config.replies_per_page;
	var scrollDist = Config.scroll_reload_margin;
	var statsView;
	//var qid;
	
    var firstload = true,
    
       StatsView = Backbone.View.extend({

        el: $("#stats"),

        initialize: function () {
           
           this.models = {
              stats : new StatsModel(),
              question :  new QuestionModel()
           }
           
            statsView = this;
        },
        
       events: {
            "click .stats-tab li a" : "showContent",            
            "click .debates .debate .reply" : "goThread",
            "click .debate .replyItem": "goThread",
            "click #feedsform .reply": "goThread",
            "click .reply":"goThread",
            "click .debate .likes": "like"
            
        },
       	like : function(e) {
         	//alert("like ");
         	//e.preventDefault();
         	//stop bg clicks
         	this.wasLiked = true;
         	
         	 CDW.utils.likes($(e.currentTarget).attr("data-postid"), $(e.currentTarget));
         },
        
        
        drawNum : function(statsdata) {
           
           var totalheight = $(".opinion-bar").height(),
               totalYes = statsdata.debateTotals.yes,
               totalNo  = statsdata.debateTotals.no,
               yesHeight = parseInt((totalYes / (totalYes + totalNo)) * totalheight),
               noHeight = totalheight - yesHeight;
               
        
                if (yesHeight > noHeight) {
                	
                	$("#stats-arrow-divider").removeClass("triangle-orange").addClass("triangle-blue");
                	
                  // $("#triangle-blue").css("border-width", "50px "+Math.floor($("#wrapper").width()/2)+"px 0").show();
                 //  $("#triangle-orange").hide();
                   
                   } else {
                   		$("#stats-arrow-divider").removeClass("triangle-blue").addClass("triangle-orange");
                //   $("#triangle-orange").css("border-width", "0 "+Math.floor($("#wrapper").width()/2)+"px 50px").show(); 
                 //  $("#triangle-blue").hide();
                }
                
                $(".opinion-bar").find(".yes.bar").height(yesHeight)
                $(".opinion-bar .yes .text").css("padding-top", yesHeight - 60 + "px");
                $(".opinion-bar").find(".no.bar").height(noHeight);
               	//$(".opinion-bar").find(".yes").css("height", yesHeight + "px").find(".number").text(totalYes).end().end().find(".no .number").text(totalNo);
               
               $(".opinion-bar").find(".yes").find(".number").text(totalYes).end().end().find(".no .number").text(totalNo);
              
           $("#stats .stats-tab li.ui-block-a a").addClass("ui-btn-active");
           
           
        },
        
       goThread : function(e) {
            	
            	if(!this.wasLiked){
            		//alert("gothread "+$(e.currentTarget).attr("data-thread"));
            		  //$(e.currentTarget).effect("highlight", {color:"00b7ff"}, 1000);
            		  
            		  
            		 // $(e.currentTarget).animate({backgroundColor: "#ff0000" });
            		  
            		  
         			this.currThread = $(e.currentTarget).attr("data-thread");
         	
         			//Router.navigate('reply', {trigger: true});
         			
         			$.mobile.changePage( "#reply?thread="+this.currThread +"&q="+this.models.question.id, {  changeHash: true} );
         			//Backbone.history.navigate('reply', {trigger: true});
            	}
				this.wasLiked = false;
				
         	//alert( $(e.currentTarget).prop("tagName"));
         	//alert( $(e.currentTarget).attr("data-thread"));
         	// ="/#reply"
         	//$.mobile.changePage( "#reply?this.models.current.id", { reverse: false, changeHash: false,transition: "slide" } );
           /*$(".clicked").removeClass("clicked");
           $(e.currentTarget).parent().parent().parent().addClass("clicked");
           e.preventDefault();
           var fragment = ($(e.currentTarget).hasClass("desc")) ? "" : "/reply",
               homeView = this;
               
           setTimeout(function() {
              window.location.href = "comments.html#/questions/"+homeView.models.current.id+"/debates/"+$(e.currentTarget).parent().parent().parent().attr("data-thread")+"/posts";
           }, 1000);*/
           
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
          


 		 if (qid) {
                $(".nav.question").show();
                statsView.models.question = new QuestionModel();
                statsView.models.question.url = apiHost+"questions/" + qid;
               // statsView.qid = qid;
            } else {
                //$(".nav.main").show();
               	statsView.models.question = new QuestionModel();
                statsView.models.question.url = apiHost+"api/questions/current";
                
            } 


			$.mobile.loading( 'show', { theme: "c", text: "Loading...", textonly: false });

         /*
         var frags = window.location.href.split("/");

          if (!firstload) {
              $('[data-type="'+frags[frags.length-1]+'"]').trigger("click");                   
            }
          */
          
        this.models.question.fetch({
        
             dataType: "jsonp",
             
             success: function(model,questiondata) {
                
                statsView.models.question.data = questiondata;
                
                
                statsView.models.stats.url = apiHost+"api/stats/questions/"+questiondata.id;
                
                statsView.models.stats.fetch({

                dataType: "jsonp",

                success: function (model, statsdata) {
                     statsView.models.stats.data = statsdata;                 
                    _.templateSettings.variable = "main";
                              
                   statsView.$el.find(".tmpl").append(_.template(_statsTemplate, statsView.models));
                   statsView.$el.find(".discussion").html(_.template(_quickvoteTemplate, statsView.models));
                   
                   statsView.drawNum(statsdata);
                   $(".opinion-bar").show(); 
                   statsView.$el.find(".question .text").text(statsView.models.question.data.text);
                   //
                  // $('[data-type="'+frags[frags.length-1]+'"]').trigger("click");
                   firstload = false;
                   /*
                   if (frags[frags.length-1] === 'stats') {
                     $("#footer-container").hide();
                   } else {
                     $("#footer-container").show();
                   }*/
                   
                   $.mobile.loading( 'hide');
                }
                 
                });
                
     
    
              /* $(window).resize(function() {
                 statsView.drawNum(statsView.models.stats.data);
               })*/

          
             }
        
        
        });
        
       
        }
    });
    return StatsView;
});