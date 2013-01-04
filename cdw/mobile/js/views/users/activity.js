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
'text!templates/users/profile.html'
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
    	_profileTemplate
    	) {

	var apiHost = Config.api_host;
	var repliesPerPage = Config.replies_per_page;
	var scrollDist = Config.scroll_reload_margin;
	
	var currThread;
	
	var wasLiked;//helps to stop like clicks bubble through to bg click 
	var refresh;//listens to new comments but doesn't reload until page change
	var activityView;
	var activityModel;
	
    var ActivityView = Backbone.View.extend({

        el: $("#activity"),

    // The initialize function is always called when instantiating a Backbone View.
    // Consider it the constructor of the class.
        initialize: function () {
        	
              
			//this is a way to be able to forget about this scope inside callbacks
			//alternatively apparently you can use underscore bind function 
			// http://net.tutsplus.com/tutorials/javascript-ajax/getting-cozy-with-underscore-js/
			activityView = this;

            activityView.currentpage = 0;
            activityView.perPage = repliesPerPage;
            activityView.menuStatus = false;//open close side menu
           // 
			activityView.wasLiked = false;
			activityView.refresh = true;
          	
          	refresh = true;
          	
          	activityView.activityModel = new Backbone.Model();
          	
          /*
           * This function is triggered post vote+opinion which is called in CDW global space
           * as it is called from comments view as well
           */
          
          console.log("activity view initialized");
          
          $(window).bind("CDW.onPostNewOpinion", function(e,data) {
          	activityView.refresh = true;
                           
           });
           /*
            $(window).bind("CDW.loginStatus", function(e,data) {
	           if(CDW.utils.auth.getLoginStatus()){
	        		var usr = CDW.utils.auth.getUserData();
	        	 	CDW.utils.misc.setTitle("Hi "+usr.username);
	        	 	
	        	}else{
	        		CDW.utils.misc.setTitle('');
	        		
	        	}
          	});
           */
           
           /*
            * Replies are posted from comment view...we are waiting to refresh un back
            */
           $(window).bind("CDW.onPostNewReply", function(e,data) {
           		activityView.refresh = true;
           });
			//alert("ActivityView");
              
			
		  $(window).bind('scrollstop', function () {
		  	//only run if active page
		  	if($.mobile.activePage.attr('id') !='home'){
		  		return;
		  	}
		  	
		  	var d = $(document).height() - $(window).height() - $(document).scrollTop();
		  	if(d<scrollDist){
		  		activityView.getMore();
			  //console.log('This page was just scrolled: '+d );
			}
		});
			

        },

        events: {
           "click .debates .debate .reply" : "goThread",
            "click .debate .replyItem": "goThread",
            "click .debate .likes": "like",
        },
        render: function () {
        	//home page default render function
        	
        	this.refresh = false;
        	this.currentpage = 0;
        	
        	
            $('#activity .content-wrapper').hide();
            
            /*
             * To use jquery.mobile default loaders need to include jquery_mobile in require define above (even if already loaded previously)
             */
          
			$.mobile.loading( 'show', { theme: "c", text: "Loading...", textonly: false });
			
            homeViewData = {};

  
			activityView.activityModel.url =  apiHost+"api/profile";
			activityView.activityModel.fetch({
                dataType: "jsonp",
                success: function (model, activityData) {
          
                  	console.log(activityData);
                     /*
					 * By default, template places the values from your data in the local scope via the 
					 * with statement. However, you can specify a single variable name with the variable setting. 
					 * This can significantly improve the speed at which a template is able to render.
					 * Within the list.html template this variable is referenced. Effectively it
					 * becomes an alias for your associative array.
					 */
		
                   	_.templateSettings.variable = "main";
                   
                   
                   
                    
           
                    activityView.$el.find(".tmpl").html(_.template(_profileTemplate, activityData));                                
           /*         
                    if (debatesdata.total > activityView.perPage) {
                      $(".seemore .more").show();
                    }
                    */
 

					$.mobile.loading('hide');
					
					$('#activity .content-wrapper').fadeIn();
            	},
            	error:function(e){
            		console.log("Activity model error");
            		console.log(e);
            		
            		
            	}
        });    

        		////////////response load over

        },
            goThread : function(e) {
            	
            	if(!this.wasLiked){
            		//alert("gothread "+$(e.currentTarget).attr("data-thread"));
            		  //$(e.currentTarget).effect("highlight", {color:"00b7ff"}, 1000);
            		  
            		  
            		 // $(e.currentTarget).animate({backgroundColor: "#ff0000" });
            		  
            		  
         			this.currThread = $(e.currentTarget).attr("data-thread");
         			
         			var q = $(e.currentTarget).attr("data-question");
         	
         			//Router.navigate('reply', {trigger: true});
         			
         			$.mobile.changePage( "#reply?thread="+this.currThread +"&q="+q, {  changeHash: true} );
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
               activityView = this;
               
           setTimeout(function() {
              window.location.href = "comments.html#/questions/"+activityView.models.current.id+"/debates/"+$(e.currentTarget).parent().parent().parent().attr("data-thread")+"/posts";
           }, 1000);*/
           
        }
       ,
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
               activityView = this;
               
           setTimeout(function() {
              window.location.href = "comments.html#/questions/"+activityView.models.current.id+"/debates/"+$(e.currentTarget).parent().parent().parent().attr("data-thread")+"/posts";
           }, 1000);*/
           
        },
        getMore : function() {
            this.currentpage++;   
            this.models.debates.url = apiHost + "api/questions/" + this.models.current.data.id + "/posts?skip="+(activityView.currentpage*activityView.perPage)+"&limit="+activityView.perPage;
           // CDW.utils.misc.getMore(this.models.debates, this.currentpage);
           
           

        
           
           $("#activity .seemore").find(".more").hide().end().find(".loader").show();
           

           
           this.models.debates.fetch({
                dataType: "jsonp",
                
                success: function(model, postsdata) {
                  
                   var posts = (postsdata.data) ? postsdata.data : postsdata.posts,
                       container = $("#activity .seemore"),
                       i,
                       total = postsdata.postCount;
                   
                   if (posts.length === 0 ) {
                     container.find(".loader, .more").hide();
                     return false;
                   } 
                   
                   for (i = 0; i < posts.length; i++) {                   
                     _.templateSettings.variable = "entry";
                     $("#activity .seemore").before(_.template(_debateTemplate,posts[i]));                
                   }
                   
                   
                     
                   
                   //what on earth?!
                   if (activityView.currentpage < 3) {
                     if ($(".debates.bottom .debate").length >= total) {
                       container.find(".loader, .more").hide();
                     } else {
                       container.find(".loader").hide().end().find(".more").show();
                     }
                   } else {
                    container.find(".loader, .more").hide();
                   }
                   
                   
                   if (total  <= ((activityView.currentpage+1) * repliesPerPage) ) {
                     $("#activity .seemore .more").hide();
                   }
                   
                   if (total <= repliesPerPage) {
                     container.find(".loader, .more").hide();
                   }
                   
                   
                   
                   
                }
           });           
           
                 }
    
     });
    return ActivityView;
});
