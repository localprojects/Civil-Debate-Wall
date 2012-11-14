define(['jquery', 'underscore', 'backbone', 'models/stats', 'models/debate', 'models/question', 'text!templates/comments/comments.html', 'text!templates/comments/yesno.html', 'text!templates/quickvote/quickvote.html', 'text!templates/quickvote/quickreply.html', 'text!templates/debate/debate.html'], function ($, _, Backbone, StatsModel, DebateModel, QuestionModel, _commentsTemplate, _yesnoTemplate, _quickvoteTemplate, _quickreplyTemplate,_debateTemplate) {

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
            this.perPage = 25;
            this.threadId;
            
             $(window).bind("CDW.onPostNewReply", function(e,data) {
                $(".debate").removeClass("self");
                _.templateSettings.variable = "entry";
                $(".debates.bottom .top").after(_.template(_debateTemplate,data));              
           });
           
            $(window).bind("CDW.isLogin", function() {
              $("#reg-overlay").hide();
            });
            
            $(window).bind("CDW.onYesNoViewDone", function() {
              $("#commentsform .reply").trigger("click");
            });
            
            CDW.utils.auth.regHeader();


        },

        events: {
            "click #commentsform .reply": "sayIt",
                "click .likes": "likes",
                "click .debates.bottom .debate .reply": "replyTD",
                "click .question .reply": "showStats",
                "click .question .text": "showStats",
                "click div.yes.btn": "showReplyForm",
                "click div.no.btn": "showReplyForm",
                "click #feedsform .reply": "reply",
                "click .seemore .more": "getMore",
                "click .seemore .past": "getPastDebates"
        },

              
         getMore : function() {
            this.currentpage++;   
            this.models.debate.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/threads/"+this.threadId+"?page="+this.currentpage+"&amt="+this.perPage;
            CDW.utils.misc.getMore(this.models.debate, this.currentpage);
                   
        },
        
        
        getPastDebates : function() {
          console.log("getPastDebates");
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
        },

        likes: function (e) {

            //CDW.utils.cdwFB.social.likes($(e.currentTarget).attr("data-did"));

            var target = $(e.currentTarget);

            CDW.utils.likes(target.parent().parent().parent().attr("data-did"), target);

        },


        sayIt: function (e) {
             e.preventDefault();
            if ($("#commentsform input").attr("value") === '') {
              return false;
            }
            
            CDW.utils.quickreply.sayIt(this.models.question.data.id, "#comments", this.models.debate.data.id, $("#commentsform input"));

        },

        render: function (qid, did, pid) {
            var that = this;
            this.threadId = did; 

            this.models.question.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/questions/" + qid;
            this.models.debate.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/threads/" + did;
            this.models.debate.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/threads/"+did+"?page="+that.currentpage+"&amt="+that.perPage;


            this.models.question.fetch({

                dataType: "jsonp",

                success: function (model, questiondata) {

                    that.models.question.data = questiondata;

                    that.models.debate.fetch({

                        dataType: "jsonp",

                        success: function (model, debatedata) {

                            that.models.debate.data = debatedata;

                            that.models.stats.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/stats/questions/" + that.models.question.data.id;

                            _.templateSettings.variable = "main";
                            that.$el.find(".tmpl").html(_.template(_commentsTemplate, that.models));
                            that.$el.find(".debates.answar").html(_.template(_quickreplyTemplate, that.models));

                            that.$el.bind("onYesNoView", $.proxy(that.onYesNoView, that));
                            $("#comments .question .text").text(that.models.question.data.text);
                            $("#comments .nav .middle").text("@" + that.models.debate.data.firstPost.author.username + " comments")
                            $("#commentsform input").attr("value", "@" + that.models.debate.data.firstPost.author.username);
                          
                            $("#commentsform").find("input").bind("focus", function() {
                              $(this).attr("value", "");
                            });
                            
                            //bind likes
                            $(".likes").each(function() {
                                      CDW.utils.likes($(this).parent().parent().parent().attr("data-postid"), $(this));
                            });
                            
                            
                            if (pid) {
                                var target = $("div[data-postId='"+pid+"']");
                                
                                if (target.length > 0) {
                                $('html, body').animate({
                                     scrollTop: target.offset().top                                     
                                }, 2000);
                                target.addClass("self");
                                }
     
                            }
                            
                            if (debatedata.postCount-1 > $(".debates.bottom .debate").length) {
                              $(".seemore .more").show();
                            } else {
                              $(".seemore").hide();
                            }

                            

                            that.models.stats.fetch({

                                dataType: "jsonp",

                                success: function (model, statsdata) {
                                    console.log(statsdata);
                                    that.models.stats.data = statsdata;
                                    that.$el.find(".discussion").html(_.template(_quickvoteTemplate, that.models));

                                }
                            });
                        }

                    });

                }


            });


        }
    });
    return CommentsView;
});