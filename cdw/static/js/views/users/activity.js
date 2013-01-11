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
'text!templates/users/activity.html'
],
   
    function ($, 
    	_, 
    	Backbone,
    	Config, 
    	Sdate, 
    	Utils,
    	Mobile,
    	_activityTemplate
    	) {

	var apiHost = Config.api_host;
	var repliesPerPage = Config.replies_per_page;
	var scrollDist = Config.scroll_reload_margin;
	var imgUrl = Config.img_url;
	
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
                   	_.templateSettings.variable = "main";
                   	activityData.imgUrl = imgUrl;
                    activityView.$el.find(".tmpl").html(_.template(_activityTemplate, activityData));                                
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
            	
            	//var liked = $(e.currentTarget).attr("data-wasLiked");
            	if(!this.wasLiked){
           			this.currThread = $(e.currentTarget).attr("data-thread");
         			var q = $(e.currentTarget).attr("data-question");
         			$.mobile.changePage( "#reply?thread="+this.currThread +"&q="+q, {  changeHash: true} );
         		}else{
         			alert("was liked so no thread")
         		}
				this.wasLiked = false;
				
           
        }
       ,
         like : function(e) {
         	//stop bg clicks
         	this.wasLiked = true;
          	CDW.utils.likes($(e.currentTarget).attr("data-postid"), $(e.currentTarget));
         	
        }
    
     });
    return ActivityView;
});
