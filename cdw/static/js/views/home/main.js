define(['jquery', 'underscore', 'backbone', 'models/current', 'models/question', 'models/debates', 'models/stats', 'text!templates/home/main.html', 'text!templates/debate/debate_home.html', 'text!templates/debate/debate.html', 'text!templates/reg/login.html', 'text!templates/quickvote/quickvote.html', 'text!templates/users/list.html', 'sdate'], function ($, _, Backbone, CurrentModel, QuestionModel, DebatesModel, StatsModel, _mainHomeTemplate, _debateTemplate, _debateSingleTemplate, _regLoginTemplate, _quickvoteTemplate, _listTemplate) {

    var MainHomeView = Backbone.View.extend({

        el: $("#feeds"),

        initialize: function () {
            this.models = {};
            this.models.current = new CurrentModel();
            this.models.debates = new DebatesModel();
            this.models.stats = new StatsModel();
            this.currentQuestion = {};
            this.currentpage = 1;
            this.perPage = 25;
            
          $(window).bind("CDW.onPostNewOpinion", function(e,data) {
                $("#reg-overlay .close").trigger("click");
                _.templateSettings.variable = "entry";
                $(".debates.bottom").prepend(_.template(_debateTemplate,data));
                CDW.utils.likes($(this).parent().parent().parent().attr("data-postid"), $(this));
                           
           });
           
            
      
           CDW.utils.auth.regHeader();
        


        },

        events: {
            "click .question .reply": "showStats",
            "click .question .text": "showStats",
            "click div.yes.btn": "showReplyForm",
            "click div.no.btn": "showReplyForm",
            "click #feedsform .reply": "reply",
            "click .debates .debate .reply" : "goThread",
            "click .debate .desc": "goThread",
            "click .seemore .more": "getMore",
            "click .seemore .past": "getPastDebates"
            
            
        },

        goThread : function(e) {
           $(".clicked").removeClass("clicked");
           $(e.currentTarget).parent().parent().parent().addClass("clicked");
           e.preventDefault();
           var fragment = ($(e.currentTarget).hasClass("desc")) ? "" : "/reply",
               that = this;
               
           setTimeout(function() {
              window.location.href = "comments.html#/questions/"+that.models.current.id+"/debates/"+$(e.currentTarget).parent().parent().parent().attr("data-thread")+"/posts";
           }, 1000);
           
        },
        
        
        
        closeRegForm: function () {
            $("#reg-overlay").hide();
        },

        showStats: function (e) {
            e.preventDefault();
            CDW.utils.quickvote.showStats(e);
            
        },

        insertNewPost: function (data) {
            // added to this.models.debates.data
            //_.templateSettings.variable = "entry";
            //that.$el.html( _.template( _debateTemplate, data ) );
            //alert("insertNewPost")

        },

        postToThread: function () {

            var that = this,
                vote = (sessionStorage["question_" + this.models.current.data.id + "_vote"] === 'no') ? "0" : "1";

            $.ajax({
                type: "POST",
                url: "/api/questions/" + that.models.current.data.id + "/threads",
                
                
                data: {
                    author: "5085fa93106dfe107500003d",
                    yesno: vote,
                    text: $("#feedsform").find("input").val(),
                    origin: "cell"
                },
                success: function (data) {
                    that.insertNewPost(data);
                },
                error: function (error) {
                    //console.log(error)
                }
            });


        },

        hideResetReplyForm: function (e) {
            e.preventDefault(); 
            CDW.utils.quickvote.hideResetReplyForm();
        },

        reply: function (e) {
           
           e.preventDefault();
           CDW.utils.quickvote.reply(e,this.models.current.data.id,sessionStorage["question_" + this.models.current.data.id + "_vote"], $("#feedsform input").val());
        
        },

        showReplyForm: function (e) {
           e.preventDefault();            
            CDW.utils.quickvote.showReplyForm(e, "question_" + this.models.current.data.id + "_vote");
            
        },
        
        getPastDebates : function() {
          window.location.href = "past.html#past";
        },
        
        getMore : function() {
            this.currentpage++;   
            this.models.debates.url = "/api/questions/" + this.models.current.data.id + "/posts?skip="+this.currentpage+"&limit="+this.perPage;
            CDW.utils.misc.getMore(this.models.debates, this.currentpage);
                   
        },
        
        render: function (qid) {

            var that = this;

            var that = this,
                homeViewData = {};


            if (qid) {
                $(".nav.question").show();
                that.models.current = new QuestionModel();
                that.models.current.url = "/api/questions/" + qid;
            } else {
                $(".nav.main").show();
            } 
            
            //bind events
            
            that.$el.bind("resetReplyForm", that.hideResetReplyForm);
            
            //get questions
            this.models.current.fetch({

                dataType: "jsonp",

                success: function (model, currentdata) {
             
                    that.models.current.data = currentdata;

                    that.models.debates.url = "/api/questions/" + currentdata.id + "/posts?skip="+that.currentpage+"&limit="+that.perPage;
                    
                   
                    that.models.debates.fetch({

                        dataType: "jsonp",

                        success: function (model, debatesdata) {

                            that.models.debates.data = debatesdata;

                            that.models.stats.url = "/api/stats/questions/" + currentdata.id;

                            that.models.stats.url = "/api/stats/questions/"+that.models.current.data.id;
                            
                                 _.templateSettings.variable = "main";
                                that.$el.find(".tmpl").html(_.template(_mainHomeTemplate, that.models));                                
                                $("#feeds .question .text").text(that.models.current.data.text);                                    
                                $("#feeds #footer-container").show();
                                
                                if (debatesdata.total > that.perPage) {
                                  $(".seemore .more").show();
                                }
                            
                            that.models.stats.fetch({

                                dataType: "jsonp",

                                success: function (model, statsdata) {
                                   
                                    that.models.stats.data = statsdata;
                                    that.$el.find(".debates.top").html(_.template(_listTemplate, that.models));
                                    that.$el.find(".discussion").html(_.template(_quickvoteTemplate, that.models));
                                   
                                    
                                    //bind likes
                                    $(".likes").each(function() {
                                      CDW.utils.likes($(this).parent().parent().parent().attr("data-postid"), $(this));
                                    });
                                    


                                }
                            });

                        }
                    });

                }
            });


        }
    });
    return MainHomeView;
});
