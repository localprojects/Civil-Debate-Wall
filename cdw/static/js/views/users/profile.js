define([
  'jquery',
  'jquery_form',
  'jquery_numeric',
  'underscore',
  'backbone',
  'config',
  'cdw'
], function($,$form,Numeric, _, Backbone, Config){
	
		var apiHost = Config.api_host;
		var profileView;
		var newUser;
		
		var imgUrl = Config.img_url;
	
  var UserListView = Backbone.View.extend({
    
    el: $("#profile-wrap"),
    
    initialize: function(){

		profileView = this;
      
         //to prevent forms from self-submitting and jumping to other page
       //make suresubmit button is cast as normal button by type="button"
      $("#photoform").attr("action",apiHost+"api/profile/photo");
       $("#verifyphone").attr("action",apiHost+"api/verify/code");//?
       
       
       //make jump to next number input when complete
       //oninput tracks also paste on safari
        $("input[name='areacode']").bind("input", function() {
        	    var str = $(this).attr("value");
                if(str.length==3){
                	$("input[name='firstthree']").focus();
                	//safari doesn't allow focus change when typing
                	/*setTimeout(function() {
			            $("input[name='firstthree']").focus();
			        }, 500);*/
                }
                
          });
       
       $("input[name='firstthree']").bind("input", function() {
        	    var str = $(this).attr("value");
                if(str.length==3){
                	$("input[name='lastfour']").focus();
                	
                	/*setTimeout(function() {
			            $("input[name='lastfour']").focus();
			        }, 500);*/
                }
          });
       
            
            /*
             * Above works in breowsers but not mobile...see
             * //http://jquerymobile.com/test/docs/forms/textinputs/events.html
             
            $("input[name='areacode']").textinput({
			   create: function(event, ui) { 
			   	 }
			});*/
			
			//continue
       
        if (!CDW.utils.misc.hasFileUploadSupport()) {
       	  $(".instruction, .savePhoto").hide();
       	  $(".notsupported").show();
     	 }
     	 $("#done").hide();
     	 
     	 this.clearFields();
   
    },
    
    injectData : function() {
    	
    	console.log("injectData");
      var userData = CDW.utils.auth.getUserData(),
          myForm = $("form.register"); 
                    
          myForm.find("#username").val(userData.username).end().find("#email").val(userData.email);
          if (userData && userData.webProfilePictureThumbnail) {
            $(".mypic div.w").html('<img src="'+imgUrl+userData.webProfilePictureThumbnail+'" border="0" width=""/>');
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
    clearFields:function(){
    	console.log("clearFields");
    	$("#username").val("");
        $("#pwd1").val("");
        $("#pwd2").val("");
        $("#email").val("");
        $("input[name='areacode']").val(""); 
      	$("input[name='firstthree']").val(""); 
      	$("input[name='lastfour']").val(""); 
      	$(".verify-code input[name='code']").val("");
    },
    
    events: {
            "click #saveProfile": "updateProfile",
            "click #validatephone": "validatePhone",
            "click #validatecode" : "validateCode",
            "click .savePhoto": "submitPhoto" ,
            "click .cancel-verify" : function() {
               this.showPhoneNum("");
            },
            "click #continue": function(){
            	history.back();
            }
    },

    submitPhoto : function() {
      $("#upload_target").bind("load", function() {
            $("#done").show();
        
      });
      $('#photoform').ajaxForm(function() { 
                console.log("Photo has been uploaded"); 
            }); 
      $("#photoform").submit();
    },
    validateCode : function (e) {
    	
    	console.log("validateCode: "+$(".verify-code input[name='code']").val());
      CDW.utils.misc.validateCode($(".verify-code input[name='code']").val()).done(function(res) {
        profileView.showPhoneNum();
      }).fail(function(e) {
         $(".verify-msg").text("No match. Try again.");
      });
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
                            
                    CDW.utils.auth.status();
                     CDW.utils.auth.updateTopmenu();
                     
                     
                     
                     if(profileView.newUser){
                     	$("#continue").parents('.ui-btn').show();
                     	$("#photoupload").show();
                     	//redirect on new user
                     	//$.mobile.changePage( "#home", {  changeHash: true} );
                     }
                   
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
    	
    	
    	/*
    	$('#verifyphone').ajaxForm(function() { 
                console.log("Code has has been verified"); 
            }); 
    	$('#verifyphone').submit();
    	*/
    	
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
      });
    },
    
    render: function(isNew){
        $(".error").removeClass("error");
        
        
        $("input[name='areacode']").numeric();
      	$("input[name='firstthree']").numeric();
      	$("input[name='lastfour']").numeric();
      		
      	$("#continue").parents('.ui-btn').hide();//jqm wraps with span tags
      		
        profileView.newUser = isNew;
        if(isNew) {
        	CDW.utils.auth.setUserData({});
        	profileView.clearFields();
        	
        	//hide until saved
        	$("#photoupload").hide();
        } else {
            profileView.injectData();
        }
       /*
      if (!CDW.utils.auth.getLoginStatus()) {
         $(".mypic, .info").hide();
         
         $(window).bind("CDW.isLogin", function() {
           profileView.injectData();
           //CDW.utils.auth.regHeader();
           $(".mypic, .info").show();
           $(window).bind("CDW.isLogin", that.injectData);           
         });
         */
        // $("#email").attr("value",CDW.utils.misc.getParameterByName("email"));
        // var sc = document.cookie;
        var sc = CDW.utils.misc.getCookie('social');
        if(sc){
        	var kvs = this.kvPairs(sc);
        	 console.log("We should load stuff from cookie here: " + kvs['username']);
        	 // Populate the field values
       		$("input#username").val(kvs['username']);
       		$("input#email").val(kvs['email']);
    
      	 }
      
       
          
    },
    
    kvPairs: function(sc) {
           var kvs = new Array();
           var kvpairs = sc.split(',');
            for (i=0;i<kvpairs.length;i++) {
               k=kvpairs[i].substr(0,kvpairs[i].indexOf("="));
               v=kvpairs[i].substr(kvpairs[i].indexOf("=")+1);
               k=k.replace(/^\s+|\s+$|\"/g,"");    // strip out spaces and quotes
               v=v.replace(/^\s+|\s+$|\"/g,"");    // strip out spaces and quotes
               kvs[k] = unescape(v);
            }
            return kvs;
    }
        


  });
  return UserListView;
});
