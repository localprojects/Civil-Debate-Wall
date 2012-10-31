define(['jquery', 'underscore', 'backbone', 'models/current', 'models/question', 'models/debates', 'models/stats', 'text!templates/home/main.html', 'text!templates/debate/debate.html', 'text!templates/reg/login.html'], function ($, _, Backbone, CurrentModel, QuestionModel, DebatesModel, StatsModel, _mainHomeTemplate, _debateTemplate, _regLoginTemplate) {

    var MainHomeView = Backbone.View.extend({

        el: $("#feeds"),

        initialize: function () {
            this.models = {};
            this.models.current = new CurrentModel();
            this.models.debates = new DebatesModel();
            this.models.stats = new StatsModel();
            this.currentQuestion = {};


        },

        events: {
            "click div.reply": "showStats",
            "click .question .text": "showStats",
            "click div.yes.btn": "showReplyForm",
            "click div.no.btn": "showReplyForm",
            "click .debate": "goThread",
            "click #feedsform .reply": "reply",
            "click .debates .debate .reply" : "goThreadOpenKeyboard"
        },

        goThread : function(e) {
         
           window.location.href = "comments.html#/questions/"+this.models.current.id+"/debates/"+$(e.currentTarget).attr("data-did")+"/posts";
        },
        
        goThreadOpenKeyboard : function(e) {
           
           window.location.hash = "comments.html#/questions/"+this.models.current.id+"/debates/"+$(e.currentTarget).attr("data-did")+"/reply";
          
        },
        
        
        closeRegForm: function () {
            $("#reg-overlay").hide();
        },

        showStats: function () {

            $(".discussion .btn-wrap, .discussion .selected,  .discussion .total").show();
            $(".discussion .answar").hide();
        },

        insertNewPost: function (data) {
            // added to this.models.debates.data
            //_.templateSettings.variable = "entry";
            //that.$el.html( _.template( _debateTemplate, data ) );

        },

        postToThread: function () {

            var that = this,
                vote = (sessionStorage["question_" + this.models.current.data.id + "_vote"] === 'no') ? "0" : "1";

            $.ajax({
                type: "POST",
                url: "http://www.civildebatewall.com/api/questions/" + that.models.current.data.id + "/threads",
                data: {
                    author: "5085fa93106dfe107500003d",
                    yesno: vote,
                    text: $("#feedsform").find("input").val(),
                    origin: "mobile"
                },
                success: function (data) {
                    that.insertNewPost(data);
                },
                error: function (error) {
                    console.log(error)
                }
            });


        },

        hideResetReplyForm: function () {
            $(".discussion .btn-wrap, .discussion .selected").hide();
            $(".discussion .answar").hide();
            $(".discussion .total").hide();
        },

        reply: function () {

            var isLogin = false,
                that = this,
                feedsDiv = $("#feeds");

            

            if (sessionStorage["question_" + this.models.current.data.id + "_vote"]) {

                if (!isLogin) {
               
                    feedsDiv.hide();
                    that.$el.trigger("resetReplyForm");

                    if ($("#reg-overlay").length === 0) {

                        $("body").prepend(_.template(_regLoginTemplate));

                    } else {

                        $("#reg-overlay").show();
                    }

                    // have to use live because the parent is body

                    $("#reg-overlay").find(".close").live("click", function () {
                        $("#reg-overlay").hide();
                        feedsDiv.show();
                    });

                    CDW.utils.auth.login(function () {

                        that.postToThread();

                    });

                    return false;
                }

                //do the posting
                this.postToThread();

            }

        },

        showReplyForm: function (e) {
            var yourvote = ($(e.currentTarget).hasClass("yes")) ? "yes" : "no",
                key = "question_" + this.models.current.data.id + "_vote",
                data = (sessionStorage.getItem(key)) ? sessionStorage.getItem(this.models.current.data.id) : "";
                
                 $("#feedsform input").one("focus", function() {
                   $(this).attr("value", "");                                      
                 });


            $(e.currentTarget).removeClass("notselect").siblings().addClass("notselect");

            $(".discussion .btn-wrap, .discussion .selected").show();
            $(".discussion .answar").show();
            $(".discussion .total").hide();
            $("#feedsform .text").removeClass().addClass((yourvote === 'yes') ? "text textblue" : "text textorange");
            $(".answar .yourvote").text(yourvote);

            sessionStorage.setItem(key, yourvote);

        },

        render: function (qid) {

            var that = this;

            var that = this,
                homeViewData = {};


            if (qid) {
                that.models.current = new QuestionModel();
                that.models.current.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/questions/" + qid;
            }

            //bind events
            
            that.$el.bind("resetReplyForm", that.hideResetReplyForm);
            
            //get questions
            this.models.current.fetch({

                dataType: "jsonp",

                success: function (model, currentdata) {

                    that.models.current.data = currentdata;

                    that.models.debates.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/questions/" + currentdata.id + "/threads?id_offset=current"

                    that.models.debates.fetch({

                        dataType: "jsonp",

                        success: function (model, debatesdata) {


                            that.models.debates.data = debatesdata;

                            that.models.stats.url = "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/stats/questions/" + currentdata.id;

                            //TEST FOR NOW
                            console.log(that.models);
                            _.templateSettings.variable = "main";
                            that.$el.html(_.template(_mainHomeTemplate, that.models));
                            //TEST FOR NOW



                            that.models.stats.fetch({

                                dataType: "jsonp",

                                success: function (model, statsdata) {

                                    that.models.stats.data = statsdata;

                                    _.templateSettings.variable = "main";
                                    
                                    that.$el.html(_.template(_mainHomeTemplate, that.models));
                                    
                                   

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