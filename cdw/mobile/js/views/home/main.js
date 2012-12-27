/*
 * As far as I can tell
 * _mainHomeTemplate
 * _listTemplate
 * _debateTemplate is used when loading more entries, both here and in comments...should be rewritten so all entries use the same
 */

define(['jquery', 
'underscore', 
'backbone',
'config',
'sdate',
'cdw',
'jquery_mobile',
'models/current',
'models/question', 
'models/stats', 
'models/debates', 
'text!templates/home/main.html',
'text!templates/users/list.html',
'text!templates/debate/debate.html',
'text!templates/quickvote/quickvote.html'
],
   
    function ($, 
    	_, 
    	Backbone,
    	Config, 
    	Sdate, 
    	Utils,
    	Mobile,
    	CurrentModel, 
    	QuestionModel, 
    	DebatesModel, 
    	StatsModel, 
    	_mainHomeTemplate,
    	_listTemplate,
    	_debateTemplate,
    	_quickvoteTemplate) {

	var apiHost = Config.api_host;
	var repliesPerPage = Config.replies_per_page;
	var scrollDist = Config.scroll_reload_margin;
	
	var currThread;
	
	var wasLiked;//helps to stop like clicks bubble through to bg click 
	var refresh;//listens to new comments but doesn't reload until page change
	var homeView;
	
	
    var MainHomeView = Backbone.View.extend({

        el: $("#feeds"),

    // The initialize function is always called when instantiating a Backbone View.
    // Consider it the constructor of the class.
        initialize: function () {
        	
        	//create a local reference to related data models
            this.models = {};
            //make initial calls by loading these models
            this.models.current = new CurrentModel();
            this.models.debates = new DebatesModel();
            this.models.stats = new StatsModel();
            this.currentQuestion = {};
            this.currentpage = 0;
            this.perPage = repliesPerPage;
            this.menuStatus = false;//open close side menu
           // 
			this.wasLiked = false;
			this.refresh = true;
          	
          	homeView = this;
          	
          /*
           * This function is triggered post vote+opinion which is called in CDW global space
           * as it is called from comments view as well
           */
          
          console.log("homepage view initialized");
          
          $(window).bind("CDW.onPostNewOpinion", function(e,data) {
          	
          		console.log("home/main callback CDW.onPostNewOpinion");
          		
               // $("#reg-overlay .close").trigger("click");
                _.templateSettings.variable = "entry";
                $("#feeds .debates.bottom").prepend(_.template(_debateTemplate,data.firstPost));
               // CDW.utils.likes($(this).parent().parent().parent().attr("data-postid"), $(this));
               
               homeView.hideInputs();
                           
           });
           
           /*
            * Replies are posted from comment view...we are waiting to refresh un back
            */
           $(window).bind("CDW.onPostNewReply", function(e,data) {
           		homeView.refresh = true;
           });
			//alert("MainHomeView");
      
         //  CDW.utils.auth.status();
          /* 
           
           var AuthModel = Backbone.Model.extend({  });
            var aMod = new AuthModel();
            aMod.url =  apiHost+"api/questions/current";
            aMod.fetch({
                        dataType: "json",
                         success: function (model, response, options) {
                         	alert("happy ho ");
                     	 },
                     	 error:function(model, xhr, options){
                     	 	console.log(xhr);
                     	 }
              })
            
           */
           
        
			
		  $(window).bind('scrollstop', function () {
		  	//only run if active page
		  	if($.mobile.activePage.attr('id') !='home'){
		  		return;
		  	}
		  	
		  	var d = $(document).height() - $(window).height() - $(document).scrollTop();
		  	if(d<scrollDist){
		  		homeView.getMore();
			  //console.log('This page was just scrolled: '+d );
			}
		});
			

        },

        events: {
           "click .debates .debate .reply" : "goThread",
            "click .debate .replyItem": "goThread",
            "click .debate .likes": "like",
            "click .question .reply": "showBtns",
            "click .question .text": "showBtns",
            "click .debate .content .statsBtn":"goStats",
            "click .discussion .btn-wrap .yes":"voteYes",
            "click .discussion .btn-wrap .no":"voteNo",
            "click .discussion .answer .reply":"postOpinion"
            
            
        },
        render: function (qid) {
        	//home page default render function
        	 this.hideInputs();
        	this.refresh = false;
        	/*
        	if(CDW.utils.auth.getLoginStatus()){
        		var usr = CDW.utils.auth.getUserData();
        	 	CDW.utils.misc.setTitle("Hi "+usr.username);
        	}else{
        		CDW.utils.misc.setTitle('');
        		
        	}*/
        	 

            //hide whie loading
            
            $('#feeds .content-wrapper').hide();
            $('.footer').hide();
            
            /*
             * To use jquery.mobile default loaders need to include jquery_mobile in require define above (even if already loaded previously)
             */
          
			$.mobile.loading( 'show', { theme: "c", text: "Loading...", textonly: false });
			
			
			//$.mobile.loading('hide');
            homeViewData = {};

			
            if (qid) {
                $(".nav.question").show();
                homeView.models.current = new QuestionModel();
                homeView.models.current.url = apiHost+"questions/" + qid;
            } else {
                //$(".nav.main").show();
               homeView.models.current = new QuestionModel();
                homeView.models.current.url = apiHost+"api/questions/current";
                
            } 
          // homeView.$el.find(".text").text("loaded question");
           $("#feeds .question .text").text("Loading question..."); 
            //$("#feeds .question .text").show(); 
            //bind events
            
           // homeView.$el.bind("resetReplyForm", homeView.hideResetReplyForm);
            
            /*
             * first get current question
             * then load stats, ie. who's most debated, faved etc
             * and finally load first set of responds
             */
            
            
            
            this.models.current.fetch({
				
                dataType: "jsonp",

                success: function (model, currentdata) {
             		//alert("loaded");
             		//$.mobile.loading('hide');
             		//$.mobile.pageLoading(true); //hide
             			
             			
             		//the local models object was create above
                    homeView.models.current.data = currentdata;
                    
                    //question doesn't have or need an underscore template because it doesn't contain an array of data
 					$("#feeds .question .text").text(homeView.models.current.data.text); 
 					
					$.mobile.loading( 'show', { theme: "c", text: "Loading...", textonly: false });
  					
  					
                          //homeView.$el.find(".tmpl").html(_.template(_mainHomeTemplate, homeView.models));                                
                              //  $("#feeds .question .text").text(homeView.models.current.data.text);                                    
                               // $("#feeds #footer-container").show();
 						//$("#feeds .question .text").text("Loading"); 

					//alert("Loading "+apiHost+"api/stats/questions/"+homeView.models.current.data.id);
					//load top debated/top faved
 					homeView.models.stats.url =  apiHost+"api/stats/questions/"+homeView.models.current.data.id;
					homeView.models.stats.fetch({
                        dataType: "jsonp",
                         success: function (model, statsdata) {
                              homeView.models.stats.data = statsdata;
                              
                              
                               //populate the list template with top debated
                              /*
								 * By default, template places the values from your data in the local scope via the 
								 * withstatement. However, you can specify a single variable name with the variable setting. 
								 * This can significantly improve the speed at which a template is able to render.
								 * Within the list.html template this variable is referenced. Effectively it
								 * becomes an alias for your associative array.
								 */
  					
                               _.templateSettings.variable = "main";
                               
                               //debates top are the two hottest at the top
                               homeView.$el.find(".debates.top").html(_.template(_listTemplate, homeView.models));
                                
                                //discussions is the dropdown quick vote area
                                homeView.$el.find(".discussion").html(_.template(_quickvoteTemplate, homeView.models));

                                //bind likes..is this the smartest way?
                              /* $(".debates.top .likes").each(function() {
                               
                                 // CDW.utils.likes($(this).attr("data-postid"), $(this));
                               });*/
    
    
        
        
        			////load response
        
                    homeView.models.debates.url =  apiHost+"api/questions/" + currentdata.id + "/posts?skip="+homeView.currentpage+"&limit="+homeView.perPage; 
                    homeView.models.debates.fetch({
                        dataType: "jsonp",
                        success: function (model, debatesdata) {
                            homeView.models.debates.data = debatesdata;
                           // homeView.models.stats.url =  apiHost+"api/stats/questions/" + currentdata.id;
                                _.templateSettings.variable = "main";
                                homeView.$el.find(".tmpl").html(_.template(_mainHomeTemplate, homeView.models));                                
                               // $("#feeds .question .text").text(homeView.models.current.data.text);                                    
                                //$("#feeds #footer-container").show();
                                
                                if (debatesdata.total > homeView.perPage) {
                                  $(".seemore .more").show();
                                }
                                
                                 //bind likes
                                  /*  $(".debates.bottom .likes").each(function() {
                                    
                                     // CDW.utils.likes($(this).attr("data-postid"), $(this));
                                    });*/




								$.mobile.loading('hide');
								//Utils.floatFooter();
								$('.footer').fadeIn();
								
								$('#feeds .content-wrapper').fadeIn();
                        }
                    });    
        
        		////////////response load over


}});

//sequenced loading over

















                }
            });


        },
            goThread : function(e) {
            	
            	if(!this.wasLiked){
            		//alert("gothread "+$(e.currentTarget).attr("data-thread"));
            		  //$(e.currentTarget).effect("highlight", {color:"00b7ff"}, 1000);
            		  
            		  
            		 // $(e.currentTarget).animate({backgroundColor: "#ff0000" });
            		  
            		  
         			this.currThread = $(e.currentTarget).attr("data-thread");
         	
         			//Router.navigate('reply', {trigger: true});
         			
         			$.mobile.changePage( "#reply?thread="+this.currThread +"&q="+this.models.current.id, {  changeHash: true} );
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
           
        }
        ,
        hideInputs: function (e) {
           // e.preventDefault();
            //CDW.utils.quickvote.showStats(e);
            
            $("#feeds .discussion .selected,#feeds .discussion .btn-wrap,#feeds .discussion .answer").hide();

            
        },
        showBtns: function (e) {
           // e.preventDefault();
            //CDW.utils.quickvote.showStats(e);
            
           // $(".discussion .selected").hide();
           $("#feeds .discussion .btn-wrap .no,#feeds .discussion .selected .no .one,#feeds .discussion .btn-wrap .yes,#feeds .discussion .selected .yes .one").removeClass("notselect");
            $("#feeds .discussion .btn-wrap").show();
            //$(".discussion .btn-wrap, .discussion .total").show();
            
        },
        showQuickreply: function (e) {
           // e.preventDefault();
            //CDW.utils.quickvote.showStats(e);
            
           $("#feeds .discussion .selected").show();
           $("#feeds .discussion .btn-wrap").hide();
            //$(".discussion .btn-wrap, .discussion .total").show();
            $("#feeds .discussion .answer").show();
            $(this).attr("value", "Leave a comment...");
            $("#feedsform input").on("focus", function () {
                    $(this).attr("value", "");
                });
            
        }, 
        goStats:function(e){
        	$.mobile.changePage( "#stats?q="+this.models.current.id, { changeHash: true } );
        },
        voteYes:function(e){
        	//this.votedYes =1;
        	
        	CDW.utils.quickvote.setVote(this.models.current.id,1);
        	
        	//change colour of buttons and counters
        	$("#feeds .discussion .btn-wrap .yes,.discussion .selected .yes .one").removeClass("notselect");
        	$("#feeds .discussion .btn-wrap .no,.discussion .selected .no .one").addClass("notselect");
        	
        	$("#feeds .discussion .selected .yes").addClass("yescolor");
        	$("#feeds .discussion .selected .no").removeClass("nocolor");
        	
        	$("#feeds .discussion .selected .no.sel").addClass("notselbg");
        	$("#feeds .discussion .selected .no.sel").removeClass("nobg");
        	$("#feeds .discussion .selected .yes.sel").addClass("yesbg");
        	$("#feeds .discussion .selected .yes.sel").removeClass("notselbg");
        	 
        	$("#feeds .discussion .selected .yes .one").html("<span>"+(this.models.stats.data.debateTotals.yes+1) +" Agree</span>");
        	$("#feeds .discussion .selected .no .one").html("<span>"+(this.models.stats.data.debateTotals.no) +" Disagree</span>");
        	 
        	 
        	 
        	$("#feedsform .yourvote").text("YOU SAY YES!"); 
        	$("#feedsform .yourvote").addClass("yescolor");
        	this.showQuickreply();
        	
        },
        voteNo:function(e){
        	//this.votedYes = 0;
        	CDW.utils.quickvote.setVote(this.models.current.id,0);
        	//change colour of buttons and counters
        	$("#feeds .discussion .btn-wrap .no,.discussion .selected .no .one").removeClass("notselect");
        	$("#feeds .discussion .btn-wrap .yes,.discussion .selected .yes .one").addClass("notselect");
        	
        	$("#feeds .discussion .selected .no").addClass("nocolor");
        	$("#feeds .discussion .selected .yes").removeClass("yescolor");
        	
        	$("#feeds .discussion .selected .no.sel").addClass("nobg");
        	$("#feeds .discussion .selected .no.sel").removeClass("notselbg");
        	$("#feeds .discussion .selected .yes.sel").addClass("notselbg");
        	$("#feeds .discussion .selected .yes.sel").removeClass("yesbg");
        	
        	
        	$("#feeds .discussion .selected .yes .one").html("<span>"+(this.models.stats.data.debateTotals.yes) +" Agree</span>");
        	$("#feeds .discussion .selected .no .one").html("<span>"+(this.models.stats.data.debateTotals.no+1) +" Disagree</span>");
        	
        	$("#feedsform .yourvote").text("YOU SAY NO!"); 
        	$("#feedsform .yourvote").addClass("nocolor");
        	
        	this.showQuickreply();
        },
        postOpinion:function(e){
        	var txt = $("#feedsform input").attr("value");
        	CDW.utils.quickvote.postNewOpinion(this.models.current.id,CDW.utils.quickvote.getVote(this.models.current.id),txt);
        },
         like : function(e) {
         	//alert("like ");
         	//e.preventDefault();
         	//stop bg clicks
         	this.wasLiked = true;
         	
         	 CDW.utils.likes($(e.currentTarget).attr("data-postid"), $(e.currentTarget));
         	
         	
         	//this.currThread = $(e.currentTarget).attr("data-thread");
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
        getMore : function() {
            this.currentpage++;   
            this.models.debates.url = apiHost + "api/questions/" + this.models.current.data.id + "/posts?skip="+this.currentpage+"&limit="+this.perPage;
           // CDW.utils.misc.getMore(this.models.debates, this.currentpage);
           
           

        
           
           $("#feeds .seemore").find(".more").hide().end().find(".loader").show();
           

           
           this.models.debates.fetch({
                dataType: "jsonp",
                
                success: function(model, postsdata) {
                  
                   var posts = (postsdata.data) ? postsdata.data : postsdata.posts,
                       container = $("#feeds .seemore"),
                       i,
                       total = postsdata.postCount;
                   
                   if (posts.length === 0 ) {
                     container.find(".loader, .more").hide();
                     return false;
                   } 
                   
                   for (i = 0; i < posts.length; i++) {                   
                     _.templateSettings.variable = "entry";
                     $("#feeds .seemore").before(_.template(_debateTemplate,posts[i]));                
                   }
                   
                   
                     
                   
                   //what on earth?!
                   if (homeView.currentpage < 3) {
                     if ($(".debates.bottom .debate").length >= total) {
                       container.find(".loader, .more").hide();
                     } else {
                       container.find(".loader").hide().end().find(".more").show();
                     }
                   } else {
                    container.find(".loader, .more").hide();
                   }
                   
                   
                   if (total  <= ((homeView.currentpage+1) * repliesPerPage) ) {
                     $("#feeds .seemore .more").hide();
                   }
                   
                   if (total <= repliesPerPage) {
                     container.find(".loader, .more").hide();
                   }
                   
                   
                   
                   
                }
           });           
           
           
           
           
           
           
           
           
           
           
                   
        }
    
     });
    return MainHomeView;
});
