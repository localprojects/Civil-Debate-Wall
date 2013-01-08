define([
  'jquery',
  'jquery_form',
  'underscore',
  'backbone',
  'config'
], function($,$form, _, Backbone, Config){
	
		var apiHost = Config.api_host;
		var profileView;
	
  var UserListView = Backbone.View.extend({
    
    el: $("#profile"),
    
    initialize: function(){

		profileView = this;
       //CDW.utils.auth.regHeader();
       
       //to prevent forms from self-submitting and jumping to other page
       //make suresubmit button is cast as normal button by type="button"
      $("#photoform").attr("action",apiHost+"api/profile/photo");
       $("#verifyphone").attr("action",apiHost+"api/verify/code");//?
       
       
        if (!CDW.utils.misc.hasFileUploadSupport()) {
       	  $(".instruction, .savePhoto").hide();
       	  $(".notsupported").show();
     	 }
     	 $("#done").hide();
   
    },
    
    injectData : function() {
      var userData = CDW.utils.auth.getUserData(),
          myForm = $("form.register"); 
                    
          myForm.find("#username").val(userData.username).end().find("#email").val(userData.email);
          if (userData && userData.webProfilePictureThumbnail) {
            $(".mypic div.w").html('<img src="http://civildebatewall.s3.amazonaws.com'+userData.webProfilePictureThumbnail+'" border="0" width=""/>');
          }
          $(".info .name").text(userData.username);
      
      
      if(userData.phoneNumber){
      	if(userData.phoneNumber.length>5){
      		//2342454567
      		
      		$("input[name='areacode']").val(userData.phoneNumber.substr(0,3)); 
      		$("input[name='firstthree']").val(userData.phoneNumber.substr(3,3)) 
      		$("input[name='lastfour']").val(userData.phoneNumber.substr(6,4)) 
      	}
     
      }
      
    },
    
    events: {
            "click #saveProfile": "updateProfile",
            "click #validatephone": "validatePhone",
            "click .verify-code .submit" : "validateCode",
            "click .savePhoto": "submitPhoto" ,
            "click .cancel-verify" : function() {
               this.showPhoneNum("");
            }
    },

    submitPhoto : function() {
      $("#upload_target").bind("load", function() {
        
        //http://civildebatewall.s3.amazonaws.com/images/users/50a3272185c5d36f62000000-thumbnail.jpg
        
        //var data = JSON.parse($("#upload_target").contents().find("body pre").html());
        
        //alert("done");
        $("#done").show();
        
      });
      $('#photoform').ajaxForm(function() { 
                console.log("Photo has been uploaded"); 
            }); 
      $("#photoform").submit();
    },
    validateCode : function (e) {
    	
    	
    	/*
      e.preventDefault();
      CDW.utils.misc.validateCode($(".verify-code input[name='code']").val()).done(function(res) {
        that.showPhoneNum();
      }).fail(function(e) {
         $(".verify-msg").text("No match. Try again.");
      });*/
    },
    
    updateProfile : function() {
    	
      var phonenumber = $("input[name='areacode']").val() + $("input[name='firstthree']").val() + $("input[name='lastfour']").val();
      
      
      if ($("#pwd1").val() !== $("#pwd2").val()) {
         $(".error-msg.success-password").text("Your password doesnt match.");
         return false;
      }
      
      $(".error").removeClass("error");
      $(".error-msg.success-email, .error-msg.success-password, .error-msg.success-username").text("");
      
  	
      
      var data = {
          username : $("#username").val(),
          password: $("#pwd1").val(),
          password2: $("#pwd2").val(),
          email:$("#email").val(),
          phoneNumber: phonenumber 
         },
         
         url = (CDW.utils.auth.getLoginStatus()) ? apiHost+'api/profile/edit' : apiHost+'api/register';
         
       
      $.ajax({
         url: url,
         type: 'POST',
         data: JSON.stringify(data),
         dataType: 'json',
         contentType: "application/json; charset=utf-8",
         success: function(response) {
           
            
               if (response.status !== 200 && (response.error || response.errors)) {
                  var error = (response.error) ? response.error : response.errors;
                  
                  for (e in error) {
                     
                     $("p."+ e).addClass("error");
                     $(".error-msg.success-"+e).text(error[e][0]);
                  }
                  
               } else {                 
                  
                   
                     $(".info").find(".name").text($("#username").val()).end().show();
                     $(".confirm-msg").text(response.message); 
                     $(".error-msg").text("");
                     
                     console.log("User details saved");
                    // window.location.href = "/static/edit-photo.html#edit-photo";
                    
                   
                   
               }
                        
         },
         error: function(e) {
             console.log(e)
         }
       });
    
    },  
    
    showPhoneNum: function(msg) {
      $(".verify-phone").show(); 
      $(".verify-code").hide();
      $(".verify-msg").text(msg);
    },
    
    showCode: function() {
      $(".verify-phone").hide(); 
      $(".verify-code").show();
      $(".verify-msg").text("");
    },
    
    validatePhone : function() {
    	
    	
    	
    	$('#verifyphone').ajaxForm(function() { 
                console.log("Code has has been verified"); 
            }); 
    	$('#verifyphone').submit();
    	
    	/*
      var phoneDiv  =  $(".verify-phone"),
          areacode    = phoneDiv.find("input[name='areacode']").val(), 
          firstthree  = phoneDiv.find("input[name='firstthree']").val(), 
          lastfour     = phoneDiv.find("input[name='lastfour']").val(),
          phonenumber  = areacode + firstthree + lastfour,
          csrf = $("#csrf").attr("id");
      
      CDW.utils.misc.validatePhone(phonenumber, areacode, firstthree, lastfour,csrf).done(function(res) {
        if (res.success) {
          profileView.showCode();
          
        } else {          
          profileView.showPhoneNum(res.error);
        }
        
      }).fail(function(e) {
        console.log(e);
      });*/
    },
    
    render: function(isNew){
    
    if(isNew){
    	CDW.utils.auth.setUserData({});
    }


      if (!CDW.utils.auth.getLoginStatus()) {
         $(".mypic, .info").hide();
         
         $(window).bind("CDW.isLogin", function() {
           profileView.injectData();
           //CDW.utils.auth.regHeader();
           $(".mypic, .info").show();
           $(window).bind("CDW.isLogin", that.injectData);           
         });
         
         $("#email").attr("value",CDW.utils.misc.getParameterByName("email"));
         
         
       } else {
         profileView.injectData();
       }
    
      
    }
  });
  return UserListView;
});
