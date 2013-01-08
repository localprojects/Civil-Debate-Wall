define([
  'jquery',
  'underscore',
  'backbone',
  'config'
], function($, _, Backbone, Config){
	
		var apiHost = Config.api_host;
		var postFunc;//on success
		var loginView;
  var UserListView = Backbone.View.extend({
    
    el: $("#loginform"),
    
    initialize: function(){
		loginView = this;
		
      },
    
    events: {
            "click .submit .btn" : "login"
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
    
      
      
    
      
    }
  });
  return UserListView;
});
