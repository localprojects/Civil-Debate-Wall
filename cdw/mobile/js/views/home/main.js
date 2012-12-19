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
'text!templates/debate/debate.html'
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
    	_debateTemplate) {

	var apiHost = Config.api_host;
	var repliesPerPage = Config.replies_per_page;
	var scrollDist = Config.scroll_reload_margin;
	
	var currThread;
	
	var wasLiked;//helps to stop like clicks bubble through to bg click 
	
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
          /*  
          $(window).bind("CDW.onPostNewOpinion", function(e,data) {
                $("#reg-overlay .close").trigger("click");
                _.templateSettings.variable = "entry";
                $(".debates.bottom").prepend(_.template(_debateTemplate,data));
                CDW.utils.likes($(this).parent().parent().parent().attr("data-postid"), $(this));
                           
           });
           */
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
           
        
			var that = this;
		  $(window).bind('scrollstop', function () {
		  	//only run if active page
		  	if($.mobile.activePage.attr('id') !='home'){
		  		return;
		  	}
		  	
		  	var d = $(document).height() - $(window).height() - $(document).scrollTop();
		  	if(d<scrollDist){
		  		that.getMore();
			  //console.log('This page was just scrolled: '+d );
			}
		});
			

        },

        events: {
           "click .debates .debate .reply" : "goThread",
            "click .debate .content": "goThread",
            "click .debate .likes": "like",
            
        },
        render: function (qid) {
        	
        	
        	
        	 
        	 
        	 
        	/* var AuthModel = Backbone.Model.extend({  });
            var aMod = new AuthModel();
            aMod.url =  apiHost+"authenticated";
            
           // aMod.url =  apiHost+"api/questions/current";
            aMod.fetch({
                        dataType: "jsonp",
                         success: function (model, response, options) {
                         	alert("im happy");
                         	console.log(model);
                     	 },
                     	 error:function(model, xhr, options){
                     	 	console.log(xhr);
                     	 }
              })
        	 
        	*/
        	
        	
        	/*
        	$.get(apiHost +'authenticated?callback=',function(result){
        		
        		alert("got:");
        		
        		var json = $.parseJSON(($(result.responseText)));
    			// alert(json.data[0].id);
        		
        	});
        	*/
        	
        	 /*
        	  $.ajax({
                       url: apiHost +'authenticated', 
                       dataType:"jsonp", 
                       type:'GET',
                       
                       success: function(response) { 
                       		alert("happy ho "+response);
                           if (response.status === '201') {
                             // CDW.utils.auth.setUserData(response.result);
                           }
                        
                       },
                       error:function(xhr, msg, thrownError){
                       	console.log(xhr);
                      
                      	alert(msg);
                       	
                       }});
        	 */
        	 
        	 
        	 
        	 
        	 
        	
			//home page default render function
            var that = this;//scope trick 
            
            //alert("Config apiHost "+apiHost);
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
                that.models.current = new QuestionModel();
                that.models.current.url = apiHost+"questions/" + qid;
            } else {
                //$(".nav.main").show();
            } 
          // that.$el.find(".text").text("loaded question");
           $("#feeds .question .text").text("Loading question..."); 
            //$("#feeds .question .text").show(); 
            //bind events
            
           // that.$el.bind("resetReplyForm", that.hideResetReplyForm);
            
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
                    that.models.current.data = currentdata;
                    
                    //question doesn't have or need an underscore template because it doesn't contain an array of data
 					$("#feeds .question .text").text(that.models.current.data.text); 
 					
					$.mobile.loading( 'show', { theme: "c", text: "Loading...", textonly: false });
  					
  					
                          //that.$el.find(".tmpl").html(_.template(_mainHomeTemplate, that.models));                                
                              //  $("#feeds .question .text").text(that.models.current.data.text);                                    
                               // $("#feeds #footer-container").show();
 						//$("#feeds .question .text").text("Loading"); 

					//alert("Loading "+apiHost+"api/stats/questions/"+that.models.current.data.id);
					//load top debated/top faved
 					that.models.stats.url =  apiHost+"api/stats/questions/"+that.models.current.data.id;
					that.models.stats.fetch({
                        dataType: "jsonp",
                         success: function (model, statsdata) {
                              that.models.stats.data = statsdata;
                              
                              
                               //populate the list template with top debated
                              /*
								 * By default, template places the values from your data in the local scope via the 
								 * withstatement. However, you can specify a single variable name with the variable setting. 
								 * This can significantly improve the speed at which a template is able to render.
								 * Within the list.html template this variable is referenced. Effectively it
								 * becomes an alias for your associative array.
								 */
  					
                               _.templateSettings.variable = "main";
                               that.$el.find(".debates.top").html(_.template(_listTemplate, that.models));
                                //that.$el.find(".discussion").html(_.template(_quickvoteTemplate, that.models));

                                //bind likes
                               $(".debates.top .likes").each(function() {
                                 // CDW.utils.likes($(this).parent().parent().parent().attr("data-postid"), $(this));
                               });
    
    
        
        
        			////load response
        
                    that.models.debates.url =  apiHost+"api/questions/" + currentdata.id + "/posts?skip="+that.currentpage+"&limit="+that.perPage; 
                    that.models.debates.fetch({
                        dataType: "jsonp",
                        success: function (model, debatesdata) {
                            that.models.debates.data = debatesdata;
                           // that.models.stats.url =  apiHost+"api/stats/questions/" + currentdata.id;
                                _.templateSettings.variable = "main";
                                that.$el.find(".tmpl").html(_.template(_mainHomeTemplate, that.models));                                
                               // $("#feeds .question .text").text(that.models.current.data.text);                                    
                                //$("#feeds #footer-container").show();
                                
                                if (debatesdata.total > that.perPage) {
                                  $(".seemore .more").show();
                                }
                                
                                 //bind likes
                                    $(".debates.bottom .likes").each(function() {
                                     // CDW.utils.likes($(this).parent().parent().parent().attr("data-postid"), $(this));
                                    });




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
         			
         			$.mobile.changePage( "#reply", { reverse: false, changeHash: true,transition:"fade"} );
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
               that = this;
               
           setTimeout(function() {
              window.location.href = "comments.html#/questions/"+that.models.current.id+"/debates/"+$(e.currentTarget).parent().parent().parent().attr("data-thread")+"/posts";
           }, 1000);*/
           
        },
    
    
         like : function(e) {
         	//alert("like ");
         	//e.preventDefault();
         	//stop bg clicks
         	this.wasLiked = true;
         	//this.currThread = $(e.currentTarget).attr("data-thread");
         	//alert( $(e.currentTarget).prop("tagName"));
         	//alert( $(e.currentTarget).attr("data-thread"));
         	// ="/#reply"
         	//$.mobile.changePage( "#reply?this.models.current.id", { reverse: false, changeHash: false,transition: "slide" } );
           /*$(".clicked").removeClass("clicked");
           $(e.currentTarget).parent().parent().parent().addClass("clicked");
           e.preventDefault();
           var fragment = ($(e.currentTarget).hasClass("desc")) ? "" : "/reply",
               that = this;
               
           setTimeout(function() {
              window.location.href = "comments.html#/questions/"+that.models.current.id+"/debates/"+$(e.currentTarget).parent().parent().parent().attr("data-thread")+"/posts";
           }, 1000);*/
           
        },
        getMore : function() {
            this.currentpage++;   
            this.models.debates.url = apiHost + "api/questions/" + this.models.current.data.id + "/posts?skip="+this.currentpage+"&limit="+this.perPage;
           // CDW.utils.misc.getMore(this.models.debates, this.currentpage);
           
           

            var that = this;
           
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
                   if (that.currentpage < 3) {
                     if ($(".debates.bottom .debate").length >= total) {
                       container.find(".loader, .more").hide();
                     } else {
                       container.find(".loader").hide().end().find(".more").show();
                     }
                   } else {
                    container.find(".loader, .more").hide();
                   }
                   
                   
                   if (total  <= ((that.currentpage+1) * repliesPerPage) ) {
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
