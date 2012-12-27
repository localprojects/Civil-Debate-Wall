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
	var postCount;
	
	var commentsView,threadId;
		
    var CommentsView = Backbone.View.extend({

        el: $("#comments"),

        initialize: function () {
            var isFirstEntry = false;
            
            this.models = {
                debate: new DebateModel(),
                question: new QuestionModel(),
                stats: new StatsModel()
            }
            
            
	/*
	 * Note on sorting and offset. Main opinion calls use skip/limit,
	 * hence skip = current page (from 0) times repliesPerPage.
	 * 
	 * Comments use page/items instead and &sort=-1 from back to front.
	 * Page begins on 1.
	 */

            this.currentpage = 1;
            this.perPage = repliesPerPage;

            
            console.log("comments view init");
            
            
             $(window).bind("CDW.onPostNewReply", function(e,data) {
             	console.log("comments callback CDW.onPostNewReply ");
             	console.log(data);
             	
             	var newTot = parseInt($('#comments .total').text())+1;
             	$('#comments .total').text(newTot);
             	 	
             	_.templateSettings.variable = "entry";
             	//$("#feeds .debates.bottom").prepend(_.template(_debateTemplate,data));
             	$(".debates.bottom .top").after(_.template(_debateTemplate,data));
             	
             	 $("#commentsform input").attr("value", "@" + commentsView.models.debate.data.firstPost.author.username);
             	
             	
             	
             	
             	
               /* $(".debate").removeClass("self");
                _.templateSettings.variable = "entry";
                $(".debates.bottom .top").after(_.template(_debateTemplate,data));
                $(".debates.bottom .debate").first().addClass("self");
                CDW.utils.likes(data.id, $(".self .likes"));*/
           });
           /*
            $(window).bind("CDW.isLogin", function() {
              $("#reg-overlay").hide();
            });
            
            $(window).bind("CDW.onYesNoViewDone", function() {
              $("#commentsform .reply").trigger("click");
            });
            */
            //CDW.utils.auth.regHeader();

			commentsView = this;
		  $(window).bind('scrollstop', function () {
		  		//only run if active page
		  	if($.mobile.activePage.attr('id') !='reply'){
		  		return;
		  	}
		  	var d = $(document).height() - $(window).height() - $(document).scrollTop();
		  	if(d<scrollDist  &&  commentsView.postCount > $("#comments .debates.bottom .debate").length){
		  		commentsView.getMore();
			  //console.log('This page was just scrolled: '+d );
			}
		});

			
			
			
        },

        events: {
                
                "click .reply":"postReply",
                "click .debate .likes": "like"
       
        },
        
        render: function (threadId, qId,qData,postId,offset ) {
        	
        	/*
        	 * 
        	 * Pass known question model to save RPC
        	 */
        	
                
            
            this.postCount = 0;       
            this.threadId = threadId; 
			this.postId = postId;
			
			if(offset){
				this.currentpage = offset;
			}else{
				this.currentpage = 0;//reset to first page on render
			}


			
			$('.footer').hide();
			$('.tmpl').hide();
			$.mobile.loading( 'show', { theme: "c", text: "Loading...", textonly: false });
			
			
			
            
            if(qData){
            	//if we already have the question data use it
            	this.models.question.data = qData.data;
            	$("#comments .question .text").text(this.models.question.data.text);
            	commentsView.loadComments();
            }else{
            	//else call
            	this.models.question.url = apiHost+"api/questions/" + qId;
            	 this.models.question.fetch({
                	dataType: "jsonp",
	               	 success: function (model, questiondata) {
	               	 	commentsView.models.question.data = questiondata;
	               	 	$("#comments .question .text").text(questiondata.text);
	               	 	
	               	 	commentsView.loadComments();
	               	 	
	               	 }
	              });
            		
            }
            
               /* }

            });*/


        },
        loadComments:function(){
        	

           // this.models.question.url = apiHost+"api/questions/" + qid;
            //this.models.debate.url = apiHost+"api/threads/" + did;
            this.models.debate.url = apiHost+"api/threads/"+commentsView.threadId+"?page="+commentsView.currentpage+"&items="+commentsView.perPage + "&sort=-1";
/*
            this.models.question.fetch({

                dataType: "jsonp",

                success: function (model, questiondata) {
                	*/

                    commentsView.models.debate.fetch({
                        dataType: "jsonp",
                        success: function (model, debatedata) {


							


                            commentsView.models.debate.data = debatedata;
                           
                           
                           CDW.utils.misc.setTitle('@'+commentsView.models.debate.data.firstPost.author.username);

                           
                            _.templateSettings.variable = "main";
                            commentsView.$el.find(".tmpl").html(_.template(_commentsTemplate, commentsView.models));
                            commentsView.$el.find(".debates.answer").html(_.template(_quickreplyTemplate, commentsView.models));

                            //commentsView.$el.bind("onYesNoView", $.proxy(commentsView.onYesNoView, commentsView));
                            
                            //$("#comments .nav .middle").text("@" + commentsView.models.debate.data.firstPost.author.username + " comments")
                            $("#commentsform input").attr("value", "@" + commentsView.models.debate.data.firstPost.author.username);
                          
                            $("#commentsform").find("input").bind("focus", function() {
                              $(this).attr("value", "");
                            });
                            
                            
                            commentsView.postCount = debatedata.postCount;
                            
                           /* if (debatedata.postCount > $(".debates.bottom .debate").length) {
                              $(".seemore .more").show();
                            } else {                             
                              $(".seemore .past").show();
                            }*/
 
                                   //  $(".debates.bottom .likes").each(function() {
                                    //  CDW.utils.likes($(this).parent().parent().parent().attr("data-postid"), $(this));
                                  ///  });
                                  
                                  
			//hide all reply btns..single threaded
			$('#comments .debates.bottom .reply').hide();

					//hide loader
									$.mobile.loading('hide');
									$('.footer').fadeIn();
									$('.tmpl').fadeIn();
									
									//$('#comments .reply').hide();

							/*
 							commentsView.models.stats.url = apiHost+"api/stats/questions/" + commentsView.models.question.data.id;
                            commentsView.models.stats.fetch({
                                dataType: "jsonp",
                                success: function (model, statsdata) {
                      
                                    commentsView.models.stats.data = statsdata;
                                    commentsView.$el.find(".discussion").html(_.template(_quickvoteTemplate, commentsView.models));
                                    
                                    //bind likes
                                     $(".debates.to .likes").each(function() {
                                      CDW.utils.likes($(this).parent().parent().parent().attr("data-postid"), $(this));
                                    });
                            
                            	
                                }
                            });*/
                        }

                    });

        },
         getMore : function() {
            this.currentpage++;   
            this.models.debate.url = apiHost+"api/threads/"+this.threadId+"?page="+this.currentpage+"&items="+this.perPage+"&sort=-1";
            //CDW.utils.misc.getMore(this.models.debate, this.currentpage);
            
           
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
                   if (commentsView.currentpage < 3) {
                     if ($(".debates.bottom .debate").length >= total) {
                       container.find(".loader, .more").hide();
                     } else {
                       container.find(".loader").hide().end().find(".more").show();
                     }
                   } else {
                    container.find(".loader, .more").hide();
                   }
                   
                   
                   if (total  <= ((commentsView.currentpage+1) * repliesPerPage) ) {
                     $("#comments .seemore .more").hide();
                   }
                   
                   if (total <= repliesPerPage) {
                     container.find(".loader, .more").hide();
                   }
                   
                  // $('#comments .reply').hide();
                  
                  	//hide all reply btns..single threaded
					$('#comments .debates.bottom .reply').hide();
                   
                   
                }
           });
                   
        },
        postReply:function(e){
        	
        	var txt = $("#commentsform input").val();
        	
        	if(!(txt.length>0) || txt == ("@" + commentsView.models.debate.data.firstPost.author.username)){
        		return;
        	}
        	  if (!CDW.utils.auth.getLoginStatus()) {
              	//alert("Please login");
              	$.mobile.changePage( "#login", {changeHash: true,role:"dialog",transition:"pop"} );
              	return;
              }
        	//
        	var vote = CDW.utils.quickvote.getVote(this.models.question.data.id);
        	
        	//alert("postReply "+this.models.question.data.id + txt+" vote: "+vote);
        	
        	if(vote!= undefined){
        		CDW.utils.quickreply.replyThread(this.threadId,txt,vote);
        	}else{
        		CDW.utils.quickvote.setCurrentQuestion(this.models.question.data.id);//this is just to
        		//store a reference for the dialog window
        		$.mobile.changePage( "#vote", {changeHash: true,role:"dialog",transition:"pop"} );
        	}
        },
        like : function(e) {
         	 CDW.utils.likes($(e.currentTarget).attr("data-postid"), $(e.currentTarget));
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
             var container = $(".debates.answer.quickreply");
                       
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
