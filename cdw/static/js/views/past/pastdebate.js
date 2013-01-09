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
	var archiveView;
	
	
    var PastDebateView = Backbone.View.extend({

        el: $("#pastfeeds"),

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
  
          	
          	archiveView = this;
          	
          /*
           * This function is triggered post vote+opinion which is called in CDW global space
           * as it is called from comments view as well
           */
          
          console.log("archive view initialized");
         
			
		  $(window).bind('scrollstop', function () {
		  	//only run if active page
		  	if($.mobile.activePage.attr('id') !='archive'){
		  		return;
		  	}
		  	
		  	var d = $(document).height() - $(window).height() - $(document).scrollTop();
		  	if(d<scrollDist){
		  		archiveView.getMore();
			  //console.log('This page was just scrolled: '+d );
			}
		});
			

        },

        events: {
          
        },
        render: function (qid, dateStr) {
        	//home page default render function
        	 this.hideInputs();
        	window.scrollTo(0, 0);
        	this.currentpage = 0;
        	
        	var yr = dateStr.split("-");
			var dStr = yr[1]+'/'+yr[2]+'/'+yr[0];// / 
        	
        	 CDW.utils.misc.setTitle('PAST DEBATES | '+dStr);
			archiveView.hideInputs();
            //hide whie loading
            
            $('#pastfeeds .content-wrapper').hide();
             
            /*
             * To use jquery.mobile default loaders need to include jquery_mobile in require define above (even if already loaded previously)
             */
          
			$.mobile.loading( 'show', { theme: "c", text: "Loading...", textonly: false });
			
			
			//$.mobile.loading('hide');
            homeViewData = {};

			
            if (qid) {
                $(".nav.question").show();
                archiveView.models.current = new QuestionModel();
                archiveView.models.current.url = apiHost+"api/questions/" + qid;
            } else {
                //$(".nav.main").show();
               archiveView.models.current = new QuestionModel();
                archiveView.models.current.url = apiHost+"api/questions/current";
                
            } 
          $("#pastfeeds .question .text").text("Loading question..."); 
               
            /*
             * first get current question
             * then load stats, ie. who's most debated, faved etc
             * and finally load first set of responds
             */
            
            
            
            archiveView.models.current.fetch({
                dataType: "jsonp",
                success: function (model, currentdata) {
             			
             		//the local models object was create above
                    archiveView.models.current.data = currentdata;
                    
                    //question doesn't have or need an underscore template because it doesn't contain an array of data
 					$("#pastfeeds .question .text").text(archiveView.models.current.data.text); 
 					
					$.mobile.loading( 'show', { theme: "c", text: "Loading...", textonly: false });
  					
					//load top debated/top faved
 					archiveView.models.stats.url =  apiHost+"api/stats/questions/"+archiveView.models.current.data.id;
					archiveView.models.stats.fetch({
                        dataType: "jsonp",
                         success: function (model, statsdata) {
                              archiveView.models.stats.data = statsdata;
                               _.templateSettings.variable = "main";
                               
                               //debates top are the two hottest at the top
                               archiveView.$el.find(".debates.top").html(_.template(_listTemplate, archiveView.models));
                                
                                //discussions is the dropdown quick vote area
                                archiveView.$el.find(".discussion").html(_.template(_quickvoteTemplate, archiveView.models));
        
        			////load response
        
                    archiveView.models.debates.url =  apiHost+"api/questions/" + currentdata.id + "/posts?skip="+(archiveView.currentpage*archiveView.perPage)+"&limit="+archiveView.perPage; 
                    archiveView.models.debates.fetch({
                        dataType: "jsonp",
                        success: function (model, debatesdata) {
                            archiveView.models.debates.data = debatesdata;
                           // archiveView.models.stats.url =  apiHost+"api/stats/questions/" + currentdata.id;
                                _.templateSettings.variable = "main";
                                archiveView.$el.find(".tmpl").html(_.template(_mainHomeTemplate, archiveView.models));                                
                               // $("#pastfeeds .question .text").text(archiveView.models.current.data.text);                                    
                                //$("#pastfeeds #footer-container").show();
                                
                                if (debatesdata.total > archiveView.perPage) {
                                  $(".seemore .more").show();
                                }
                                
                        		$.mobile.loading('hide');
								
								$('#pastfeeds .content-wrapper').fadeIn();
								
								//archives cannot have new posts
								archiveView.hideInputs();
                        }
                    });    
        
        		////////////response load over


}});

//sequenced loading over





                }
            });


        }
        ,
        hideInputs: function (e) {
         $("#pastfeeds  .reply").hide();       
            $("#pastfeeds .discussion .selected,#pastfeeds .discussion .btn-wrap,#pastfeeds .discussion .answer").hide();
            $("#pastfeeds .question .reply a").addClass("penside");
             $("#pastfeeds .question .reply a").removeClass("penup");
        },
        
        getMore : function() {
        	
        	if(!archiveView.models.current.data){
        		return;
        	}
            archiveView.currentpage++;   
            archiveView.models.debates.url = apiHost + "api/questions/" + archiveView.models.current.data.id + "/posts?skip="+(archiveView.currentpage*archiveView.perPage)+"&limit="+archiveView.perPage;
              
           $("#pastfeeds .seemore").find(".more").hide().end().find(".loader").show();
              
           archiveView.models.debates.fetch({
                dataType: "jsonp",
                
                success: function(model, postsdata) {
                  
                   var posts = (postsdata.data) ? postsdata.data : postsdata.posts,
                       container = $("#pastfeeds .seemore"),
                       i,
                       total = postsdata.postCount;
                   
                   if (posts.length === 0 ) {
                     container.find(".loader, .more").hide();
                     return false;
                   } 
                   
                   for (i = 0; i < posts.length; i++) {                   
                     _.templateSettings.variable = "entry";
                     $("#pastfeeds .seemore").before(_.template(_debateTemplate,posts[i]));                
                   }
                   
                   
                     
                   
                   //what on earth?!
                   if (archiveView.currentpage < 3) {
                     if ($(".debates.bottom .debate").length >= total) {
                       container.find(".loader, .more").hide();
                     } else {
                       container.find(".loader").hide().end().find(".more").show();
                     }
                   } else {
                    container.find(".loader, .more").hide();
                   }
                   
                   
                   if (total  <= ((archiveView.currentpage+1) * repliesPerPage) ) {
                     $("#pastfeeds .seemore .more").hide();
                   }
                   
                   if (total <= repliesPerPage) {
                     container.find(".loader, .more").hide();
                   }
                   
                   
                   //archives cannot have new posts
					archiveView.hideInputs();
                   
                }
           });           
           
         }
    
     });
    return PastDebateView;
});
