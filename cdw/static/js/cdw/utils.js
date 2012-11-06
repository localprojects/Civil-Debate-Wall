define(['underscore', 'text!templates/reg/login.html', 'text!templates/quickvote/quickreply.html', 'text!templates/comments/yesno.html'], function (_, _regLoginTemplate, _quickreplyTemplate, _yesnoTemplate) {

    var CDW = CDW || {};

    CDW.utils = CDW.utils || {};

    window.CDW = CDW;

    CDW.utils = (function (window, document, $, undefined) {

        var likes = function (postId, target) {

            $(window).bind("CDW.isLogin", function () {
                $.ajax({
                    url: 'ttp://ec2-107-22-36-240.compute-1.amazonaws.com/api/posts/' + postId + '/like',
                    type: 'POST',
                    dataType: 'json',
                    success: function (msg) {
                        var cnt = target.find(".count").text() * 1 + 1;
                        target.find(".count").text(cnt);
                    },
                    error: function (e) {
                        var cnt = target.find(".count").text() * 1 + 1;
                        target.find(".count").text(cnt);
                    }
                });
            });

            CDW.utils.auth.init();

        },



        auth = {

            init: function () {

                var isLogin = false,
                    overlay = $("#reg-overlay");

                if (isLogin) {
                    $(window).trigger("CWDW.isLogin");
                    return false;
                }

                if ($("#reg-overlay").length === 0) {
                    $("body").append(_.template(_regLoginTemplate));
                }

                overlay = $("#reg-overlay");
                overlay.find(".close").bind("click", function () {
                    overlay.hide().siblings().show();
                }).end().siblings().hide();

                $("#reg-overlay").show();

                // login process needs to be worked on


            },

            login: function (callback) {

                //load reg templates;


                var overlay = $("#reg-overlay"),
                    regFrom = $("#reg-overlay #login_or_signup_form"),
                    error = regFrom.find(".error-msg"),
                    submit = regFrom.find(".submit"),
                    email,
                    newuser = true,
                    re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/;


                /*FB Login*/
                //https://www.facebook.com/login.php?api_key=175633859196462&skip_api_login=1&display=page&cancel_url=http%3A%2F%2Fwww.civildebatewall.com%2Flogin%2Ffacebook%3Ferror_reason%3Duser_denied%26error%3Daccess_denied%26error_description%3DThe%2Buser%2Bdenied%2Byour%2Brequest.&fbconnect=1&next=https%3A%2F%2Fwww.facebook.com%2Fdialog%2Fpermissions.request%3F_path%3Dpermissions.request%26app_id%3D175633859196462%26redirect_uri%3Dhttp%253A%252F%252Fwww.civildebatewall.com%252Flogin%252Ffacebook%26display%3Dpage%26response_type%3Dcode%26perms%3Demail%26fbconnect%3D1%26from_login%3D1%26client_id%3D175633859196462&rcount=1
                $.when(CDW.utils.cdwFB.loadSDK()).done(function () {

                    var furl = "https://www.facebook.com/login.php?api_key=175633859196462&skip_api_login=1&display=page&cancel_url=http%3A%2F%2Fwww.civildebatewall.com%2Flogin%2Ffacebook%3Ferror_reason%3Duser_denied%26error%3Daccess_denied%26error_description%3DThe%2Buser%2Bdenied%2Byour%2Brequest.&fbconnect=1&next=https%3A%2F%2Fwww.facebook.com%2Fdialog%2Fpermissions.request%3F_path%3Dpermissions.request%26app_id%3D175633859196462%26redirect_uri%3Dhttp%253A%252F%252Fwww.civildebatewall.com%252Flogin%252Ffacebook%26display%3Dpage%26response_type%3Dcode%26perms%3Demail%26fbconnect%3D1%26from_login%3D1%26client_id%3D175633859196462&rcount=1";

                    $("#reg-overlay .sbtn.fb").bind("click", function () {

                        window.open(furl);

                    })
                });

                /*TWITTER Login*/

                /* EMAIL login */
                regFrom.find('input[name="email"]').unbind().bind("click", function () {

                    email = $(this).val();

                    $.ajax({
                        type: "POST",
                        url: "http://ec2-107-22-36-240.compute-1.amazonaws.com/api/users/search",
                        data: "email=" + email,
                        success: function (msg) {
                            regFrom.find(".submit .btn").text("Sign In");
                            newuser = false;
                        },
                        error: function (error) {
                            regFrom.find(".submit .btn").text("Register");
                        }
                    });

                });



                submit.unbind().bind("click", function () {

                    email = regFrom.find('input[name="email"]').val();


                    if (newuser) {
                        window.location.href = "/register/email";
                        return false;
                    }


                    if (re.test(email)) {

                        $.ajax({
                            type: "POST",
                            url: "http://www.civildebatewall.com",
                            data: "fld_emailaddress=" + emailaddress,
                            success: function (msg) {

                            },
                            error: function (error) {
                                console.log(error)
                            }
                        });



                    } else {
                        error.text("Please enter a valid email address");
                    }


                });




            }

        },

        cdwFB = {

            loadSDK: function (cfg) {
                var that = this,
                    dfd = $.Deferred(),
                    loadingFB = false,
                    fbscript = "//connect.facebook.net/en_US/all.js";


                if (!window.FB && !loadingFB) {

                    cfg = $.extend({
                        appId: "175633859196462",
                        status: true,
                        cookie: true,
                        logging: null,
                        oauth: true,
                        xfbml: true
                    }, cfg);


                    if ($("#fb-root").length === 0) {
                        $('body').prepend('<div id="fb-root"></div>');
                    }

                    $.getScript("http://" + fbscript, function () {
                        loadingFB = true;
                        FB.init(cfg);
                        dfd.resolve();

                    });


                } else {

                    dfd.resolve();

                }

                return dfd.promise();

            }

        },

        quickreply = {

            sayIt: function (qid, container) {

                if ($("#commentsform input").attr("value") === '') {
                    return false;
                }

                if (!sessionStorage["question_" + qid + "_vote"]) {
                    CDW.utils.quickreply.onYesNoView(qid, container);
                } else {
                    // post the debate
                }



            },

            onYesNoView: function (qid, container) {
                var key = "question_" + qid + "_vote",
                    container = $(container);

                if ($("#yesno-overlay").length === 0) {

                    $("#wrapper").prepend(_.template(_yesnoTemplate));

                    //bind events

                    $("#yesno-overlay .close,#yesno-overlay .cancel").unbind().bind("click", function () {
                        $("#yesno-overlay").hide();
                        container.show();
                    });

                    //bind yes no button
                    $("#yesno-overlay .btn-wrap .btn").unbind().bind("click", function () {
                        $(window).trigger("updateYourVote", [key, $(this).attr("data-vote")]);
                        $(this).siblings().removeClass("select").end().addClass("select");
                        $("#yesno-overlay").hide();
                        container.show();


                        $(window).bind("CDW.isLogin", function () {
                            //post to thread and indert to the dom
                            container.show();
                        });

                        CDW.utils.auth.init();


                    });

                } else {

                    $("#yesno-overlay").show();

                }
                container.hide();
            }

        },

        init = function () {

            $(window).bind("updateYourVote", function (e, key, yourvote) {
                CDW.utils.updateYourVote(key, yourvote)
            });

        },

        updateYourVote = function (key, yourvote) {
            sessionStorage.setItem(key, yourvote);
        },

        quickvote = {


            showStats: function (e) {
                e.preventDefault();
                $(".discussion .btn-wrap, .discussion .selected,  .discussion .total").show();
                $(".discussion .answar").hide();
            },

            hideResetReplyForm: function (e) {
                e.preventDefault();
                $(".discussion .btn-wrap, .discussion .selected").hide();
                $(".discussion .answar").hide();
                $(".discussion .total").hide();
            },

            showReplyForm: function (e, slKey) {
                e.preventDefault();
                var yourvote = ($(e.currentTarget).hasClass("yes")) ? "yes" : "no",
                    key = slKey,
                    data = (sessionStorage.getItem(key)) ? sessionStorage.getItem(key) : "";

                $("#feedsform input").one("focus", function () {
                    $(this).attr("value", "");
                });


                $(e.currentTarget).removeClass("notselect").siblings().addClass("notselect");

                $(".discussion .btn-wrap, .discussion .selected").show();
                $(".discussion .answar").show();
                $(".discussion .total").hide();
                $("#feedsform .text").removeClass().addClass((yourvote === 'yes') ? "text textblue" : "text textorange");
                $(".answar .yourvote").text("You say " + yourvote + "!");
                $(window).trigger("updateYourVote", [key, yourvote]);


            },

            reply: function (e) {
                e.preventDefault();
                var that = this,
                    feedsDiv = $("#feeds");

                $(window).bind("CDW.isLogin", function () {
                    that.postToThread();
                });

                CDW.utils.auth.init();
                $(".discussion").children().hide();

                $(".mask").css("top", "-100000px");

            }

        },

        misc = {

            normalizeData: function () {

            },

            yesNo: function (vote) {
                return (vote == 0) ? "no" : "yes";
            },

            daysDifference: function (date) {

                var test = date,
                    arr = date.split(".");

                date = new Date(arr[0].replace(" ", "T"));

                var seconds = Math.floor((new Date() - date) / 1000);

                var interval = Math.floor(seconds / 31536000);

                if (interval > 1) {
                    return interval + " years";
                }
                interval = Math.floor(seconds / 2592000);
                if (interval > 1) {
                    return interval + " months";
                }
                interval = Math.floor(seconds / 86400);
                if (interval > 1) {
                    return interval + " days";
                }
                interval = Math.floor(seconds / 3600);
                if (interval > 1) {
                    return interval + " hours";
                }
                interval = Math.floor(seconds / 60);
                if (interval > 1) {
                    return interval + " minutes";
                }
                return Math.floor(seconds) + " seconds";

            }
        };

        function Buttons(cfg) {

            this.cfg = $.extend({
                container: "",
                url: document.location.href,
                title: document.title
            }, cfg);

        };

        Buttons.prototype = {

            publish: function (selector, cfg) {

                cfg = $.extend({
                    url: document.location.href,
                    headline: document.title,
                    caption: undefined,
                    desc: $("meta[name='description']").attr("content") || "",
                    img: undefined,
                    usr_msg: undefined,
                    force_display: 'dialog',
                    track_pfx: (window.omPageName || "Facebook UI") + ": ",
                    success: undefined,
                    // callback function
                    error: undefined // callback function
                }, cfg);



                $(selector).unbind().bind("click", function () {
                    $("html, body").animate({
                        scrollTop: 0
                    }, "slow");
                    cfg.track_pfx && bam.tracking && bam.tracking.track && bam.tracking.track({
                        genericExternalLinkTracker: {
                            tracked: cfg.track_pfx + 'Initial Click'
                        }
                    });
                    window.FB.ui({
                        method: 'stream.publish',
                        display: cfg.force_display,
                        message: cfg.usr_msg,
                        attachment: {
                            name: cfg.headline,
                            caption: cfg.caption,
                            description: cfg.desc,
                            href: cfg.url,
                            media: cfg.img && [{
                                type: "image",
                                href: cfg.url,
                                src: cfg.img
                            }]
                        }
                    }, function (response) {
                        if (response && response.post_id) {
                            cfg.track_pfx && bam.tracking && bam.tracking.track && bam.tracking.track({
                                genericExternalLinkTracker: {
                                    tracked: cfg.track_pfx + 'Success Click'
                                }
                            });
                            (typeof cfg.success === "function") && cfg.success();
                        } else {
                            cfg.track_pfx && bam.tracking && bam.tracking.track && bam.tracking.track({
                                genericExternalLinkTracker: {
                                    tracked: cfg.track_pfx + 'Cancel Click'
                                }
                            });
                            (typeof cfg.error === "function") && cfg.error();
                        }
                    });
                    return false;
                });


                return this;
            },

            likes: function (postId) {

                $.ajax({
                    url: '/api/posts/' + postId + '/like',
                    type: 'POST',
                    dataType: 'json',
                    success: callback
                });
            }

        }


        return {

            social: Buttons,

            cdwFB: cdwFB,

            auth: auth,

            misc: misc,

            likes: likes,

            quickvote: quickvote,

            quickreply: quickreply,

            updateYourVote: updateYourVote,

            init: init
        }



    })(this, this.document, this.jQuery);

});


String.prototype.toTitleCase = function () {
    var A = this.split(' '),
        B = [];
    for (var i = 0; A[i] !== undefined; i++) {
        B[B.length] = A[i].substr(0, 1).toUpperCase() + A[i].substr(1);
    }
    return B.join(' ');
}

