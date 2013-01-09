define([
  'jquery',
  'underscore',
  'backbone',
  'oauth',
  'config'
], function($, _, Backbone, Oauth, Config){
	
		var apiHost = Config.api_host;
		var facebookAppId = Config.fb_app_id;
		var facebookRedirect = Config.fb_redirect_url;
		var postFunc;//on success
		var loginView;
  var UserListView = Backbone.View.extend({
    
    el: $("#loginform"),
    
    initialize: function(){
		loginView = this;
		
		var fbURL = "https://www.facebook.com/dialog/oauth/?client_id=";
		fbURL+=Config.fb_app_id;
		fbURL+="&redirect_uri=YOUR_REDIRECT_URL";
		fbURL+="&state=YOUR_STATE_VALUE";
		fbURL+="&scope=COMMA_SEPARATED_LIST_OF_PERMISSION_NAMES";
    
    
    	//$("#loginform .facebook_auth").attr("href",fbURL);
		
		
		
      },
    
    events: {
            "click .submit .btn" : "login",
            "click .facebook_auth":"facebookAuth"
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
     			//console.log(response);
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
       loginView.postFunc = postFunc;
        var userData = CDW.utils.auth.getUserData();
        $("#input_usr").val(userData.username);
    
      
      
    
      
    },
    facebookAuth:function(e){
    	
		
				// Configurate the Facebook OAuth settings.
			_.extend(Backbone.OAuth.configs.Facebook, {
			    client_id: facebookAppId,
			    redirect_url: window.location.protocol + '//' + window.location.host + facebookRedirect +"?returnpage="+window.location.hash,
			
			    // Called after successful authentication.
			    onSuccess: function(params) {
			///we get this on success
			//http://dev.civildebatewall.com/static/auth_redirect.html#access_token=AAADvtW010ukBADFI5psYgh68pZCUKFIYmoEP95ISRYcfIvDZCkIq1eIvfKcIuwfvFQMJt7C8uuIRPtEDVoprUtzW5vtA0jAAFrptNEKgZDZD&expires_in=6726
			        // Get the user's data from Facebook's graph api.
			        $.ajax('https://graph.facebook.com/me?access_token=' + params.access_token, {
			            success: function(data) {
			                alert('Howdy, ' + data.name);
			                CDW.utils.misc.setTitle('Hi '+ data.name);
			            }
			        });
			    }
			});
			
			// Create a new OAuth object and call the auth() method to start the process.
			var FB = new Backbone.OAuth(Backbone.OAuth.configs.Facebook);
				FB.auth();
			




    	
    }
  });
  return UserListView;
});
