/*
 * Global Civil Debate Wall object to handle auth...
 */

/*
 * CDW utility functions
 * 
 * 
 */

define(['underscore', 
'config',
'text!templates/reg/login.html', 
'text!templates/quickvote/quickreply.html',
'text!templates/comments/yesno.html',
'text!templates/debate/debate.html'], 
function (_, 
	Config,
_regLoginTemplate, 
_quickreplyTemplate, 
_yesnoTemplate, 
_debateTemplate) {
var isNewUser = true,
loginStatus = false, 
perPage  = 25,
cookieData,
userdata, privateBrowser,
CDW = CDW || {};
var uservote = {};



    CDW.utils = CDW.utils || {};

    window.CDW = CDW;
	var apiHost = Config.api_host;
	//note on privateBrowser...it disables sessionStorage on safari..needs check
	privateBrowser = false;
	/*
	 * 
	 * Self-executing anonymous function
	 * See. http://www.red-root.com/code/learning-from-the-jquery-source/
	 */
    CDW.utils = (function (window, document, $, undefined) {

        var likes = function (postId,target) {
        	if(target.hasClass("liked")){
        		//this is bad practice
        		return;
        	}
         // console.log("CDW like "+postId);
        var likecall = function(cfg) {
               
               cfg.target.find(".count").text(cfg.target.find(".count").text() * 1 + 1);
               cfg.target.addClass("liked");
                        
               $.ajax({
                    url: apiHost + 'api/posts/' + cfg.postId + '/like',
                    type: 'POST',
                    dataType: 'json',
                    success: function (msg) {
                        //cfg.target.find(".count").text(msg.likes);
                        //cfg.target.unbind("click").addClass("liked");
                    },
                    error: function (e) {
                       console.log(e);
                    }
                });
                
                
            };
            
             if (CDW.utils.auth.getLoginStatus()) {
             	 likecall({postId: postId, target:target}); 
             	}else{
             		$.mobile.changePage( "#login", {changeHash: true,role:"dialog",transition:"pop"} );
             	}
 
        },

        auth = {

            init: function (callback) {
		
            },
 
 
            getLoginStatus : function() {
              return loginStatus;
            },
            
            setLoginStatus : function(s) {
              loginStatus = s;
              
              $(window).trigger("CDW.loginStatus");
            },
            
            getUserData : function() {   
            	
            	if(!privateBrowser){           
              		data = sessionStorage.getItem('userData');
          			data = JSON.parse(data);
             	 	return (data.username) ? data: false;
            	}else{
            		//userdata is not persisten across page refresh, but userful for privateBrowsing mode
            		
             	 	return (userdata.username) ? userdata: false;
            	}
              	
            
              
            },
            
            status : function() {
                      	 $.ajax({
                       url: apiHost +'authenticated', 
                       dataType:"jsonp", 
                       type:'GET',
                       success: function(response) { 
                  
                           if (response.status == '201') {
                              CDW.utils.auth.setUserData(response.result);
                              CDW.utils.auth.setLoginStatus(true);
                              console.log("got authenticated status 201 for user: "+response.result.username);
                               
                              
                           }else{
                           	 CDW.utils.auth.setUserData({});
                           	 CDW.utils.auth.setLoginStatus(false);
                           }
                        	CDW.utils.auth.updateTopmenu();
                       },
                       error:function(xhr, msg, thrownError){
                       	var response;
                       	try{
                       		// response = jQuery.parseJSON(xhr.responseText);
 						}
                      	
                       	catch(e){	}
               
						/*
						 * This is a temp hack 
						 * 
						 */
						console.log(e);
/*						try{
							if (response.status == '201') {
                              	CDW.utils.auth.setUserData(response.result);
                           	}
                       		console.log(response.message);
                       	}
                      	catch(e){	}*/
                       }});
                
          
           
            },
            
            setUserData : function(obj) {
              
              console.log("setUserData");
              console.log(obj);
              userdata = obj;
             
             try{
                 sessionStorage.setItem('userData', JSON.stringify(obj));
                }
                catch(e){
                	console.log("setUserData error: Private browsing? "+e);
                	privateBrowsing = true;
                }
             	CDW.utils.auth.updateTopmenu();

            },
            updateTopmenu:function(){
            	obj = CDW.utils.auth.getUserData();
            	

            	
            	if(obj){
            		
       	        	$('.loginBtn a').hide();
       	        	//change so that dropdown btn opens the logged in menu instead 
       	        	$('.dropdownBtn a').attr('href','#popupMenuLogged');
       	        	$('.dropdownBtn a').attr('aria-owns','#popupMenuLogged');
       	        	
            	}else{
            		//alert("not logged");
            		$('.loginName').hide();
                  	$('.loginBtn a').show();
                  	$('.loginBtn a').attr('style','');//remove the automatic display:inline style
                  	$('.dropdownBtn a').attr('href','#popupMenu');
       	        	$('.dropdownBtn a').attr('aria-owns','#popupMenu');
            		
            	}
            
            },
            login: function (callback) {
			//what is this?!

                var overlay = $("#reg-overlay"),
                    regFrom = $("#reg-overlay #login_or_signup_form"),
                    error = regFrom.find(".error-msg"),
                    submit = regFrom.find(".submit"),
                    email,
                    newuser = true,
                    re = /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/,
                    username_lookup = function() {
                        
                        $.ajax({
                           url: apiHost + 'api/users/search',
                           type: 'POST',
                           data: {email : regFrom.find('input[name="email"]').val()},
                           dataType: 'json',
                           success: function(response) {
                             if(response.length > 0) {
                               $(window).trigger("CDW.userExisted");
                             } else {
                               $(window).trigger("CDW.newUser");
                             }
                           }
                         });
                    },
                    throttled =  _.throttle(username_lookup, 100);
                    
                //load 3rd party sdks
                $.when(CDW.utils.cdwFB.loadSDK(), CDW.utils.cdwTW.loadSDK()).done(function () {
                
                   //bind FB btn
                   $("#reg-overlay .sbtn").first().bind("click", function (response) {
                       FB.login(function(res) {
                         
                         console.log("FB Login success");
                         console.log(res);
                         
                                                 
                       $.ajax({
                         url: 'xxxx',
                         type: 'POST',
                       data: {
                          accessToken: res.authResponse.accessToken,
                          userID: res.authResponse.userID
                        },
                        dataType: 'json',
                        success: function(r) {
                          $(window).trigger("CDW.isLogin");
                        }
                       });
              
                       });
                   });
                   
                   //bind tw Buttons
                   $("#reg-overlay .sbtn").last().bind("click", function () {
                       
                       twttr.anywhere.config({ callbackURL: "http://dev.civildebatewall.com/static/twitterauth.html"});
                       twttr.anywhere(function (T) {
                           
                           if (T.isConnected()) {
                              //CDW.utils.auth.setLoginStatus(true);
                              
                              console.log("twitter already login");
                              console.log(T.currentUser);
                              $(window).trigger("CDW.isLogin");
                              return false;
                           }
                           
                           T.bind("authComplete", function (e, user) {                            
                            console.log("twitter login successfully");
                            console.log(user);
                            $(window).trigger("CDW.isLogin");
                           });
                           
                           T.signIn(); 
                       });
                       
                       
                       
                   });
                   
                   /* EMAIL login */
                   
                   
                   $(window).bind("CDW.userExisted", function() {
                     regFrom.find(".btn").text("sign in").unbind().bind("click",function(e) {
                         e.preventDefault();
                         CDW.utils.auth.signIn({
                           email: regFrom.find('input[name="email"]').val(),
                           username: regFrom.find('input[name="email"]').val(),
                           pwd: regFrom.find('input[name="password"]').val(),
                           container: regFrom.find('.error-msg')
                         });
                                           
                     });
                   }).bind("CDW.newUser", function() {
                     regFrom.find(".btn").text("Register").unbind().bind("click",function(e) {
                         e.preventDefault();
                         window.location.href="signup.html?email="+$(".username input").val() + "#signup";
                                           
                     });
                   });
                   
                   regFrom.find('input[name="password"]').bind("focus",function() {
                      username_lookup();
                   });
                   
                   //regFrom.find('input[name="email"]').unbind().bind("keyup keypress blur change", throttled);
                  
                   
                });




            }


			,
			signOut : function() {
	               CDW.utils.auth.setLoginStatus(false);
                $.ajax({
                           url: apiHost+'logout',
                           type: 'GET',
                           dataType: 'json',
                           success: function(response) {
                        
                             if (response.success) {
                                //clear cookie
                                   console.log("successful logout, should redirect and clear cookie now");
                                   
                                  uservote = {}
                                	CDW.utils.auth.setUserData({});
                                CDW.utils.auth.setLoginStatus(false);
                               		
                                CDW.utils.misc.setTitle('');
                                $.mobile.changePage( "#home", {changeHash: true} );
                                window.location.hash=""; 
                                                
                             } 
                           },error:function(e){
                           		
								CDW.utils.auth.setUserData({});
								CDW.utils.auth.setLoginStatus(false);
								$.mobile.changePage( "#home", {changeHash: true} );
								window.location.hash=""; 
                           }
                 });
                 
                 
                 
                 
            }

        },
        
        cdwTW = {
        
            loadSDK: function (cfg) {
              var dfd = dfd = $.Deferred();
              
              $.getScript("http://platform.twitter.com/anywhere.js?id=90VpETwGUGB6Wjm3mMUTQ&v=1", function () {
                dfd.resolve();
              });
              
              return dfd.promise();
              
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
                        appId: "263562500362985",
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
            
            replyThread: function(did, text, vote) {
              if (!CDW.utils.auth.getLoginStatus()) {
              	//alert("Please login");
              	$.mobile.changePage( "#login", {changeHash: true,role:"dialog",transition:"pop"} );
              	return;
              }
              $.ajax({
                    url: apiHost+'api/threads/'+did+'/posts',
                    type: 'POST',
                    data: {
                      author: CDW.utils.auth.getUserData().id,
                      yesno: vote,
                      origin: "cell",
                      text: text
                    },
                    dataType: 'json',
                    success: function(res) {                      
                      $(window).trigger("CDW.onPostNewReply", [res]);                
                    }
              });
                /*
              $("#yesno-overlay").remove();
              $("#reg-overlay").remove();              
              $("#wrapper").show();
              $("#comments").show();
              $(".top.black .total").text($(".top.black .total").text()*1 + 1);*/
            },
            
            sayIt: function (qid, container, did, field) {
                /*var text,
                    submitMe = function() {
                       if (!CDW.utils.auth.getLoginStatus()) {
                          var loginme = function() {
                            CDW.utils.quickreply.replyThread(did,text, sessionStorage["question_" + qid + "_vote"]);
                            $(window).unbind("CDW.isLogin", loginme);
                             return false;   
                          };
                          
                          $(window).bind("CDW.isLogin", loginme);
                          CDW.utils.auth.init();
                       } else {
                    
                          CDW.utils.quickreply.replyThread(did,text, sessionStorage["question_" + qid + "_vote"]);
                          return false;
                       }
                  
                    }; 
                               
                if (field.attr("value") === '') {
                    return false;
                }
                
                text = field.attr("value");
                
                if (!sessionStorage["question_" + qid + "_vote"]) {
                   // CDW.onYesNoViewDone
                   $(window).bind("CDW.isLogin", function () {
                             CDW.utils.quickreply.replyThread(did,text, sessionStorage["question_" + qid + "_vote"]);
                             return false;                
                   });
                   
                   CDW.utils.quickreply.onYesNoView(qid, container);             
                
                } else {
                  
                  submitMe();
                }
                
                return false; */
            },

            onYesNoView: function (qid, container) {
                var key = "question_" + qid + "_vote",
                    container = $(container);
                    
                
                $("#wrapper").show().find("#reg-overlay").remove();

                if ($("#yesno-overlay").length === 0) {

                    $("#wrapper").prepend(_.template(_yesnoTemplate));

                    //bind events

                    $("#yesno-overlay .close,#yesno-overlay .cancel").unbind().bind("click", function () {
                        $("#yesno-overlay").hide();
                        container.show();
                    });

                    //bind yes no button
                    $("#yesno-overlay .btn-wrap .btn").unbind().bind("click", function () {
                       // $(window).trigger("updateYourVote", [key, $(this).attr("data-vote")]);
                        $(this).siblings().removeClass("select").end().addClass("select");

                        
                        if (CDW.utils.auth.getLoginStatus()) {
                            $("#yesno-overlay").hide();
                            container.show(); 
                            $(window).trigger("CDW.onYesNoViewDone");
                            return false;
                        }

                        CDW.utils.auth.init();


                    });

                } else {

                    $("#yesno-overlay").show();

                }
                container.hide();
            }

        },

        quickvote = {

            postNewOpinion: function(qid,vote,text) {
               //borg...used in home/main
               if(!CDW.utils.auth.getLoginStatus()){
    			//	$.mobile.changePage( "#login", {changeHash: true,role:"dialog",transition:"pop"} );         	
	               	return;
               }
               
               CDW.utils.quickvote.setVote(qid, vote);
               
               $.ajax({
                    url: apiHost+'api/questions/'+qid+'/threads',
                    type: 'POST',
                    data: {
                      author:CDW.utils.auth.getUserData().id,
                      yesno:vote,
                      origin: "cell",
                      text: text
                    },
                    dataType: 'json',
                    success: function(res) {  
                    	console.log(res);                   
                      $(window).trigger("CDW.onPostNewOpinion", res);                
                    }
                });
            },
			setVote: function (qid, vote) {
        	if(!qid){
        			qid = CDW.utils.quickvote.getCurrentQuestion();
        		}
        	uservote[qid] = vote;
        	/*
        	//modified from updateYourVote
        	if(CDW.utils.auth.getLoginStatus()){
        		
        		
        		var key = "question_" + qid + "_vote";
        		
        		var data = CDW.utils.auth.getUserData();
        		data[key] = vote;
        		CDW.utils.auth.setUserData(data);
            }*/
           // $("#commentsform").find(".text").text("You say "+yourvote+"!").removeClass("yes").removeClass("no").addClass(yourvote);
	        },
	        getVote: function(qid){
	        	return uservote[qid];
	        	/*
	        	//added get/set
	        	if(CDW.utils.auth.getLoginStatus()){
	        		var key = "question_" + qid + "_vote";
	        		
	        		var data = CDW.utils.auth.getUserData();
	        		return data[key];
	        	}
	        	return undefined;*/
	        },
	        setCurrentQuestion:function(qid){
	        	CDW.currentQuestion = qid;
	        },
	        getCurrentQuestion:function(){
	        	return CDW.currentQuestion;
	        }
        },

        misc = {
        	setTitle: function(str){
        		$('.titleTxt').text(str);
        	},
        
        getCookie : function(c_name){
           var i,x,y,ARRcookies=document.cookie.split(";");
            for (i=0;i<ARRcookies.length;i++) {
               x=ARRcookies[i].substr(0,ARRcookies[i].indexOf("="));
               y=ARRcookies[i].substr(ARRcookies[i].indexOf("=")+1);
               x=x.replace(/^\s+|\s+$/g,"");
            if (x==c_name) {
              return unescape(y);
            }
            }
       },
        
        getParameterByName : function(name) {
          name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
          var regexS = "[\\?&]" + name + "=([^&#]*)";
          var regex = new RegExp(regexS);
          var results = regex.exec(window.location.search);
            if(results == null)
              return "";
             else
           return decodeURIComponent(results[1].replace(/\+/g, " "));
       },


        formatDates : function(date) {
           
           var arr = date.split(".");
           
           var d = Date.parse(arr[0]),
               curr_date = d.getDate(),
               curr_month = d.getMonth(),
               curr_year = d.getFullYear();
               
               return curr_month + "/" + curr_date + "/" + curr_year;

        },
        
       hasFileUploadSupport : function(){
        
        var hasSupport = true;
          try{
            var testFileInput = document.createElement('input');
            testFileInput.type = 'file';
            testFileInput.style.display = 'none';
            document.getElementsByTagName('body')[0].appendChild(testFileInput);
            
            if(testFileInput.disabled){
              hasSupport = false;
            }
           } catch(ex){
              hasSupport = false;
           } finally {
             if(testFileInput){
               testFileInput.parentNode.removeChild(testFileInput);
           }
        }
        
           return hasSupport;
        },
         validatePhone: function (phonenumber, areacode, firstthree, lastfour,csrf) {
                
               return $.ajax({
                  url: '/verify/phone',
                  type: 'POST',
                  data: {phonenumber: phonenumber, areacode: areacode, firstthree: firstthree, lastfour: lastfour,csrf:csrf},
                  dataType: 'json'
                  });
            
            },
            
            validateCode: function (code) {
                
               return $.ajax({
                  url: '/verify/code',
                  type: 'POST',
                  data: {code: code},
                  dataType: 'json'
                  });
            
            },
     

            yesNo: function (vote) {
                return (vote == 0) ? "no" : "yes";
            },
            
            

            formatUDate: function(d) {
            var pad = function(num) {
              return ("0" + num).slice(-2);
            };
            
            return [d.getUTCFullYear(), 
                pad(d.getUTCMonth() + 1), 
                pad(d.getUTCDate())].join("-") + " " + 
                [pad(d.getUTCHours()), 
                pad(d.getUTCMinutes()), 
                pad(d.getUTCSeconds())].join(":");
             },

          
           daysDifference: function (date) {
				
				
				//format eg. 2012-12-26 21:52:49.404000
				
				var arr = date.split(".")[0].split(" ");//clear trailing millis and split get yy-mm-dd part from horus
				var yr = arr[0].split("-");
				var hr = arr[1].split(":");
				var posted = new Date(yr[0],yr[1]-1,yr[2],hr[0],hr[1],hr[2],0);
				

				var now = new Date();
				
				
/*				
//this turned out super inefficient
                var test = date,
                    arr = date.split("."),
                    now = Date.parse(CDW.utils.misc.formatUDate(new Date()));
					//now = new Date();

                date = Date.parse(arr[0]);
               
*/
                var seconds = Math.floor((now.getTime() - posted.getTime()) / 1000);
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
                
                //the max here is just to prevent frontend /server time mismatch in case client clock is set wrong
                //doesnt show up negative
                return Math.floor(Math.max(0,seconds)) + " seconds";

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

            
            likes: function (postId) {

                $.ajax({
                    url: apiHost+'api/posts/' + postId + '/like',
                    type: 'POST',
                    dataType: 'json',
                    success: callback
                });
            }

        }
		
		init = function(){};//don't know where is used

        return {

            social: Buttons,
            cdwFB: cdwFB,
            auth: auth,
            misc: misc,
            likes: likes,
            quickvote: quickvote,
            quickreply: quickreply,
            init:init,
            cdwTW: cdwTW
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
