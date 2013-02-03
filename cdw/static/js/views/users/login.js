define([
  'jquery',
  'underscore',
  'backbone',
  'config'
], function($, _, Backbone, Config){
	
    var apiHost = Config.api_host;
    var facebookAppId = fb_app_id;
    var facebookRedirect = fb_redirect_url;
    var facebookScope = Config.fb_scope;
    var facebookState = Config.fb_state;//should come from cookie?
    var postFunc;//on success
    var loginView;
  var UserListView = Backbone.View.extend({
    
    el: $("#loginform"),
    
    initialize: function(){
		loginView = this;
		
		
    
    
    	//$("#loginform .facebook_auth").attr("href",fbURL);
		
		
		
      },
    
    events: {
            "click #login_or_signup_form .submit .btn" : "login",
            "click .facebook_auth":"facebookAuth",
            "click .twitter_auth": "twitterAuth",
            "click .forgot_psw":"showForgotPsw",
            "click #forgot_psw_form .submit .btn":"sendReminder"
            
    },
    login : function() {

      
      var data = {
          username : $("#input_usr").val(),
          pwd: $("#input_psw").val()};
          //email:$("#email").val()};
          
          console.log(data);
        // CDW.utils.auth.signIn(data);
        
         	$.ajax({
   				url: apiHost+'auth',
			   	type: 'POST',
			   data: {
			     password: $("#input_psw").val(),
			     username: $("#input_usr").val()
  			 },
  			 dataType: 'json',
   			success: function(response) {
     			//console.log("login.js got reply has func? "+loginView.postFunc);
 				if (response.success || response.status == '201') {
					CDW.utils.auth.setUserData(response);
					CDW.utils.auth.setLoginStatus(true);
					
					if(loginView.postFunc){
						loginView.postFunc(null);
						console.log("loging fired postfunc");
						loginView.postFunc = null;
					}
					$("#login").dialog("close");
 					$("#loginform .error-msg").hide();
 
//CDW.utils.auth.setLoginStatus(true);
//$(window).trigger("CDW.isLogin");
                                       
 				} else if (response.error) {
    				CDW.utils.auth.setLoginStatus(false);
  //  cfg.container.text(response.error);
  					$("#loginform .error-msg").text(response.error);
  					$("#loginform .error-msg").show();
  
  
             	}
           }
 		});
    },  
    render: function(postFunc){
    	loginView.hideForgotPsw();
    	//console.log("had postfunc? "+postFunc);
       loginView.postFunc = postFunc;
        var userData = CDW.utils.auth.getUserData();
        $("#input_usr").val(userData.username);
        
       
    },
    hideForgotPsw:function(e){
    	$("#forgot_psw_form").hide();
    	$("#login_or_signup_form").show();
    	
    },
    showForgotPsw:function(e){
    	$("#forgot_psw_form").show();
    	$("#login_or_signup_form").hide();
    	
    },
    sendReminder:function(e){
          console.log("Send reminder to "+$("#input_usr_remind").val());
        
         	$.ajax({
   				url: apiHost+'api/forgot',
			   	type: 'POST',
			   data: {
			     username: $("#input_usr_remind").val()
  			 },
  			 dataType: 'json',
   			success: function(response) {
     			//console.log("login.js got reply has func? "+loginView.postFunc);
 				if (response.success || response.status == '201') {
					
					loginView.hideForgotPsw();
					$("#loginform .error-msg").text("Email sent");
 					$("#loginform .error-msg").show();
 

 				} else if (response.error) {
    				
  					$("#forgot_psw_form .error-msg").text(response.error);
  					$("#forgot_psw_form .error-msg").show();
  
  
             	}
           }
    	});
    },
    twitterAuth: function(e) {
        if (!window.location.origin) {
           // only webkit has window.location.origin 
           window.location.origin = window.location.protocol+ "//"+ 
                                    window.location.host;
        }
        // Clicking on the twitter link should send a POST request to
        // https://api.twitter.com/oauth/request_token
        var nonce = "cdwNeedsANonce";
        var twitterRedirectUrl = "/tw_login"
        var callbackUrl = window.location.origin + twitterRedirectUrl;
        var unixTime = parseInt(new Date.getTime() / 1000);
        var signature = b64_hmac_sha1();
        
        var twitterAuthData = JSON.stringify({
           Authorization: {
               oauth_nonce: nonce,
               oauth_callback: encodeURIComponent(callbackUrl),
               oauth_signature_method: "HMAC-SHA1",
               oauth_signature: signature,
               oauth_consumer_key: "90VpETwGUGB6Wjm3mMUTQ",
               oauth_version: "1.1" ,
               aauth_timestamp: unixTime,

           } 
        });
        $.ajax({
            url: "https://api.twitter.com/oauth/request_token",
            type: "post",
            headers: twitterAuthData,
            dataType: "jsonp",     
        });
        
    },  // end twitterAuth()
    
   
   
    facebookAuth:function(e){
    	if (!window.location.origin) {
    	   // only webkit has window.location.origin 
    	   window.location.origin = window.location.protocol+ "//"+ 
    	                            window.location.host;
    	}
    	//remove  &ui-state=dialog from return url
    	var currPage = window.location.href.split("&ui-state=dialog")[0];
    	var currBase = escape(window.location.origin);
    	
    	/*
    	 * In order for us to be able to return to the current location, 
    	 * we need to store the currPage into the session. FB redirect will
    	 * then have the session in the browser's cookie 
    	 */
    	currPage = escape(currPage);
    	// $.cookie("cdw_plurl", currPage, {expires:7});
    	document.cookie="cdw_plurl" + "=" + currPage;
    	var fbURL = "https://www.facebook.com/dialog/oauth/?client_id=";
		fbURL+=facebookAppId;
		// fbURL+="&redirect_uri="+fbcurrPage;
		fbURL+="&redirect_uri="+window.location.origin + facebookRedirect;
		fbURL+="&state="+facebookState;
		fbURL+="&scope="+facebookScope;
		
		
		window.location.href = fbURL;
		
    }
  });
  return UserListView;
});
