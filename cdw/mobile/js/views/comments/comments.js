define(['jquery', 
'underscore', 
'backbone', 
'config',
'models/stats', 
'models/debate', 
'models/question', 
'text!templates/comments/comments.html', 
'text!templates/comments/yesno.html', 
'text!templates/quickvote/quickvote.html', 
'text!templates/quickvote/quickreply.html', 
'text!templates/debate/debate.html',
'jquery_mobile' 
], 
function ($, 
	_, 
	Backbone, 
	Config,
	StatsModel, 
	DebateModel, 
	QuestionModel, 
	_commentsTemplate, 
	_yesnoTemplate, 
	_quickvoteTemplate, 
	_quickreplyTemplate,
	_debateTemplate,
	Mobile) {

	var apiHost = Config.api_host;
	var repliesPerPage = Config.replies_per_page;
	var scrollDist = Config.scroll_reload_margin;
	
    var CommentsView = Backbone.View.extend({

        el: $("#comments"),

        initialize: function () {
            var isFirstEntry = false;
            
            this.models = {
                debate: new DebateModel(),
                question: new QuestionModel(),
                stats: new StatsModel()
            }
            
            this.currentpage = 1;
            this.perPage = repliesPerPage;
            this.threadId;
            /*
             $(window).bind("CDW.onPostNewReply", function(e,data) {
                $(".debate").removeClass("self");
                _.templateSettings.variable = "entry";
                $(".debates.bottom .top").after(_.template(_debateTemplate,data));
                $(".debates.bottom .debate").first().addClass("self");
                CDW.utils.likes(data.id, $(".self .likes"));
           });
           
            $(window).bind("CDW.isLogin", function() {
              $("#reg-overlay").hide();
            });
            
            $(window).bind("CDW.onYesNoViewDone", function() {
              $("#commentsform .reply").trigger("click");
            });
            */
            //CDW.utils.auth.regHeader();

			var that = this;
		  $(window).bind('scrollstop', function () {
		  		//only run if active page
		  	if($.mobile.activePage.attr('id') !='reply'){
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
                "click .seemore .more": "getMore",
       
        },
        
        render: function (threadId, qId,qData,postId,offset ) {
        	
        	/*
        	 * 
        	 * Pass known question model to save RPC
        	 */
        	
            var that = this;
            
            if(qData){
            	//if we already have the question data use it
            	this.models.question.data = qData.data;
            	$("#comments .question .text").text(this.models.question.data.text);
            }else{
            	//else call
            	this.models.question.url = apiHost+"api/questions/" + qId;
            	 this.models.question.fetch({
                	dataType: "jsonp",
	               	 success: function (model, questiondata) {
	               	 	this.models.question.data = questiondata;
	               	 	$("#comments .question .text").text(this.models.question.data.text);
	               	 	
	               	 }
	              });
            		
            }
            
            
            this.threadId = threadId; 
			this.postId = postId;
			
			if(offset){
				this.currentpage = offset;
			}else{
				this.currentpage = 1;//reset to first page on render
			}


			
			$('.footer').hide();
			$('.tmpl').hide();
			$.mobile.loading( 'show', { theme: "c", text: "Loading...", textonly: false });
           // this.models.question.url = apiHost+"api/questions/" + qid;
            //this.models.debate.url = apiHost+"api/threads/" + did;
            this.models.debate.url = apiHost+"api/threads/"+threadId+"?page="+that.currentpage+"&items="+that.perPage + "&sort=-1";
/*
            this.models.question.fetch({

                dataType: "jsonp",

                success: function (model, questiondata) {
                	*/

                    that.models.debate.fetch({
                        dataType: "jsonp",
                        success: function (model, debatedata) {

                            that.models.debate.data = debatedata;
                           
                            _.templateSettings.variable = "main";
                            that.$el.find(".tmpl").html(_.template(_commentsTemplate, that.models));
                            that.$el.find(".debates.answar").html(_.template(_quickreplyTemplate, that.models));

                            that.$el.bind("onYesNoView", $.proxy(that.onYesNoView, that));
                            
                            $("#comments .nav .middle").text("@" + that.models.debate.data.firstPost.author.username + " comments")
                            $("#commentsform input").attr("value", "@" + that.models.debate.data.firstPost.author.username);
                          
                            $("#commentsform").find("input").bind("focus", function() {
                              $(this).attr("value", "");
                            });
                            
                            
                            setTimeout(function() {
                            
                               if (that.postId) {
                                var target = $("div[data-postId='"+that.postId+"']");
                                
                                if (target.length > 0) {
                                $('html, body').animate({
                                     scrollTop: target.offset().top*1 - 100                                     
                                }, 2000);
                                target.addClass("self");
                                }
     
                            }
                            
                            },3000);
                            
                            
                            if (debatedata.postCount > $(".debates.bottom .debate").length) {
                              $(".seemore .more").show();
                            } else {                             
                              $(".seemore .past").show();
                            }
 
                                     $(".debates.bottom .likes").each(function() {
                                      CDW.utils.likes($(this).parent().parent().parent().attr("data-postid"), $(this));
                                    });



					//hide loader
									$.mobile.loading('hide');
									$('.footer').fadeIn();
									$('.tmpl').fadeIn();
									
									$('#comments .reply').hide();

							/*
 							that.models.stats.url = apiHost+"api/stats/questions/" + that.models.question.data.id;
                            that.models.stats.fetch({
                                dataType: "jsonp",
                                success: function (model, statsdata) {
                      
                                    that.models.stats.data = statsdata;
                                    that.$el.find(".discussion").html(_.template(_quickvoteTemplate, that.models));
                                    
                                    //bind likes
                                     $(".debates.to .likes").each(function() {
                                      CDW.utils.likes($(this).parent().parent().parent().attr("data-postid"), $(this));
                                    });
                            
                            	
                                }
                            });*/
                        }

                    });

               /* }

            });*/


        },
         getMore : function() {
            this.currentpage++;   
            this.models.debate.url = apiHost+"api/threads/"+this.threadId+"?page="+this.currentpage+"&items="+this.perPage;
            //CDW.utils.misc.getMore(this.models.debate, this.currentpage);
            
            
            var that = this;
           
           $("#comments .seemore").find(".more").hide().end().find(".loader").show();
           

           
           this.models.debate.fetch({
                dataType: "jsonp",
                
                success: function(model, postsdata) {
                  
                   var posts = (postsdata.data) ? postsdata.data : postsdata.posts,
                       container = $("#comments .seemore"),
                       i,
                       total = postsdata.postCount;
                   
                   if (posts.length === 0 ) {
                     container.find(".loader, .more").hide();
                     return false;
                   } 
                   
                   for (i = 0; i < posts.length; i++) {                   
                     _.templateSettings.variable = "entry";
                     $("#comments .seemore").before(_.template(_debateTemplate,posts[i]));                
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
                     $("#comments .seemore .more").hide();
                   }
                   
                   if (total <= repliesPerPage) {
                     container.find(".loader, .more").hide();
                   }
                   
                   $('#comments .reply').hide();
                   
                   
                }
           });
                   
        }
        
        /*
         ,
         
        getPastDebates : function() {
          window.location.href = "past.html#past";
        },
        
        showStats: function (e) {

            CDW.utils.quickvote.showStats(e);

        },

        hideResetReplyForm: function (e) {
            CDW.utils.quickvote.hideResetReplyForm(e);
        },

        reply: function (e) {
        
            CDW.utils.quickvote.reply(e,this.models.question.id,sessionStorage["question_" + this.models.question.id + "_vote"], $("#commentsform input").val());
        },

        showReplyForm: function (e) {

            CDW.utils.quickvote.showReplyForm(e, "question_" + this.models.question.data.id + "_vote");

        },


        replyTD: function (e) {
             var container = $(".debates.answar.quickreply");
                       
            $(".debate").removeClass("self");
            container.find("input").attr("value", "");    
            $(container).insertAfter($(e.currentTarget).parent().parent().parent());
            $('html, body').animate({scrollTop: container.offset().top - 350}, 1000);
        },

        likes: function (e) {

            var target = $(e.currentTarget);

            CDW.utils.likes(target.parent().parent().parent().attr("data-did"), target);

        },


        sayIt: function (e) {
             e.preventDefault();
            if ($("#commentsform input").attr("value") === '') {
              return false;
            }
            
            CDW.utils.quickreply.sayIt(this.models.question.data.id, "#comments", this.models.debate.data.id, $("#commentsform input"));

        }*/

    });
    return CommentsView;
});
