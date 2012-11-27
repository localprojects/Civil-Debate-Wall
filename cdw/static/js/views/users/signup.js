define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){
  var UserListView = Backbone.View.extend({
    
    el: $("#profile"),
    
    initialize: function(){
    
       CDW.utils.auth.regHeader();
    },
    
    injectData : function() {
      var userData = CDW.utils.auth.getUserData(),
          myForm = $("form.register"); 
                    
          myForm.find("#username").val(userData.username).end().find("#email").val(userData.email);
          if (userData.webImages && userData.webImages.thumb) {
            $(".mypic div.w").html('<img src="http://civildebatewall.s3.amazonaws.com'+userData.webImages.thumb+'" border="0" width=""/>');
          }
          $(".info .name").text(userData.username);
      
      
    },
    
    events: {
            "click .btn.save": "updateProfile",
            "click .btn.validate": "validatePhone",
            "click .verify-code .submit" : "validateCode",
            "click .cancel-verify" : function() {
               this.showPhoneNum("");
            }
    },
    
    validateCode : function (e) {
      e.preventDefault();
      CDW.utils.misc.validateCode($(".verify-code input[name='code']").val()).done(function(res) {
        that.showPhoneNum();
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
         
         url = (CDW.utils.auth.getLoginStatus()) ? '/api/profile/edit' : '/api/register';
         
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
                   if (response.status === 200) {
                   
                     $(".info").find(".name").text($("#username").val()).end().show();
                     $(".confirm-msg").text(response.message); 
                     //CDW.utils.auth.setUserData(response);
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
      var phoneDiv  =  $(".verify-phone"),
          areacode    = phoneDiv.find("input[name='areacode']").val(), 
          firstthree  = phoneDiv.find("input[name='firstthree']").val(), 
          lastfour     = phoneDiv.find("input[name='lastfour']").val(),
          phonenumber  = areacode + firstthree + lastfour,
          csrf = $("#csrf").attr("id"),
          that = this;
      
      CDW.utils.misc.validatePhone(phonenumber, areacode, firstthree, lastfour,csrf).done(function(res) {
        if (res.success) {
          that.showCode();
          
        } else {          
          that.showPhoneNum(res.error);
        }
        
      }).fail(function(e) {
        console.log(e);
      });
    },
    
    render: function(){
       var that = this;
       
       CDW.utils.auth.regHeader();
      
       if (!CDW.utils.auth.getLoginStatus()) {
         $(".mypic, .info").hide();
         
         $(window).bind("CDW.isLogin", function() {
           that.injectData();
           CDW.utils.auth.regHeader();
           $(".mypic, .info").show();
           $(window).bind("CDW.isLogin", that.injectData);           
         });
         
         $("#email").attr("value",CDW.utils.misc.getParameterByName("email"));
         
         
       } else {
         this.injectData();
       }
    
      
    }
  });
  return UserListView;
});
