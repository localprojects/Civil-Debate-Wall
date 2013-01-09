define(['jquery', 
'underscore', 
'backbone', 
'config',
'sdate',
'models/stats', 
'models/debate', 
'models/question', 
'text!templates/comments/comments.html', 
'text!templates/debate/debate.html',
'jquery_mobile' 
], 
function ($, 
	_, 
	Backbone, 
	Config,
	Sdate,
	StatsModel, 
	DebateModel, 
	QuestionModel, 
	_commentsTemplate, 
	_debateTemplate,
	Mobile) {

	var apiHost = Config.api_host;
	var repliesPerPage = Config.replies_per_page;
	var scrollDist = Config.scroll_reload_margin;
	var postCount;
	var refresh;
	
	var commentsView,threadId,questionId;
		
    var CommentsView = Backbone.View.extend({

        el: $("#comments"),

        initialize: function () {
            var isFirstEntry = false;
            this.refresh = true;
            this.models = {
                debate: new DebateModel(),
                question: new QuestionModel(),
                stats: new StatsModel()
            }
            
            commentsView = this;
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
             	
             	
             	
             	$('#comments .debates.bottom .reply').hide();

           });
           
           
            $(window).bind("CDW.onNewVote", function(e,data) {
            
            //{q:qid,vote:vote}
            var urVote = CDW.utils.quickvote.getVote(commentsView.models.question.data.id);
            	if(urVote){
					$("#commentsform .text").text("YOU SAY YES!"); 
					$("#commentsform .text").removeClass("nocolor").addClass("yescolor");
				
				}else if(urVote!= undefined){
					$("#commentsform .text").text("YOU SAY NO!"); 
					$("#commentsform .text").removeClass("yescolor").addClass("nocolor");
					
				}
            });
           
          
           
           
           

			
		  $(window).bind('scrollstop', function () {
		  		//only run if active page
		  	if($.mobile.activePage.attr('id') !='reply'){
		  		return;
		  	}
		  	var d = $(document).height() - $(window).height() - $(document).scrollTop();
		  	//commentsView.postCount includes the first post
		  	if(d<scrollDist  &&  (commentsView.postCount-1) > $("#comments .debates.bottom .debate").length){
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
        	window.scrollTo(0, 0);
        	/*
        	 * 
        	 * Pass known question model to save RPC
        	 */
        	console.log("comments view, threadId: "+threadId +" q: " +qId +" data: "+ qData +" post: "+ postId +" offset: "+offset);
                
            if(!this.refresh && this.threadId == threadId && this.questionId == qId){
            	return;
            }
            this.refresh = false;
            
           this.threadId = threadId;
           this.questionId = qId;
            
            this.postCount = 0;       
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
        
            commentsView.models.debate.url = apiHost+"api/threads/"+commentsView.threadId+"?page="+commentsView.currentpage+"&items="+commentsView.perPage + "&sort=-1";
			commentsView.models.debate.fetch({
                        dataType: "jsonp",
                        success: function (model, debatedata) {
	                        commentsView.models.debate.data = debatedata;
                            CDW.utils.misc.setTitle('@'+commentsView.models.debate.data.firstPost.author.username);
                           
                            _.templateSettings.variable = "main";
                            commentsView.$el.find(".tmpl").html(_.template(_commentsTemplate, commentsView.models));
                           
                           
                           //removed separate template
                           // commentsView.$el.find(".debates.answer").html(_.template(_quickreplyTemplate, commentsView.models));


							var urVote = CDW.utils.quickvote.getVote(commentsView.models.question.data.id);
							if(urVote){
								$("#commentsform .text").text("YOU SAY YES!"); 
        						$("#commentsform .text").removeClass("nocolor").addClass("yescolor");
        					
							}else if(urVote!= undefined){
								$("#commentsform .text").text("YOU SAY NO!"); 
        						$("#commentsform .text").removeClass("yescolor").addClass("nocolor");
								
							}


                            //commentsView.$el.bind("onYesNoView", $.proxy(commentsView.onYesNoView, commentsView));
                            
                            //$("#comments .nav .middle").text("@" + commentsView.models.debate.data.firstPost.author.username + " comments")
                            $("#commentsform input").attr("value", "@" + commentsView.models.debate.data.firstPost.author.username);
                          
                            $("#commentsform").find("input").bind("focus", function() {
                              $(this).attr("value", "");
                            });
                            
                            
                            commentsView.postCount = debatedata.postCount;
                            
                                  
			//hide all reply btns..single threaded
			$('#comments .debates.bottom .reply').hide();

					//hide loader
									$.mobile.loading('hide');
									$('.footer').fadeIn();
									$('.tmpl').fadeIn();
									
									
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
        	console.log("commentview postReply");
        	var txt = $("#commentsform input").val();
        	
        	if(!(txt.length>0) || txt == ("@" + commentsView.models.debate.data.firstPost.author.username)){
        		return;
        	}
        	
        	CDW.utils.quickvote.setCurrentQuestion(commentsView.models.question.data.id);//this is just to
        		//store a reference for the dialog window
        	  if (!CDW.utils.auth.getLoginStatus()) {
        	  	console.log("not logged in postreply");
              	//postComment=true flags a success function to be sent via the router
              	//got an infinite loop somewhere here when enabled. fix. seems like multiple bind
              	//$.mobile.changePage( "#login?postComment=true", {changeHash: true,role:"dialog",transition:"pop"} );
              	$.mobile.changePage( "#login", {changeHash: true,role:"dialog",transition:"pop"} );
              	return;
              }
        	//
        	var vote = CDW.utils.quickvote.getVote(commentsView.models.question.data.id);
        	
        	//alert("postReply "+this.models.question.data.id + txt+" vote: "+vote);
        	
        	if(vote!= undefined){
        		CDW.utils.quickreply.replyThread(commentsView.threadId,txt,vote);
        	}else{
        		console.log("not voted in postreply");
        		$.mobile.changePage( "#vote?postComment=true", {changeHash: true,role:"dialog",transition:"pop"} );
        	}
        },
        like : function(e) {
         	 CDW.utils.likes($(e.currentTarget).attr("data-postid"), $(e.currentTarget));
	      }
        
        

    });
    return CommentsView;
});
