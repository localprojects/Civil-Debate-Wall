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
    
      $.ajax({
         url: (CDW.utils.auth.getLoginStatus()) ? '/api/profile/edit' : '/auth',
         type: 'POST',
         data: {
          username : $("#username").val(),
          password: $("#pwd1").val(),
          password2: $("#pwd2").val(),
          email:$("#email").val()
         },
         dataType: 'json',
         success: function(response) {
           console.log(response.message)
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
         
         $(window).bind("CDW.isLogin", function() {
           that.injectData();
           CDW.utils.auth.regHeader();
           $(window).bind("CDW.isLogin", that.injectData);           
         });
         
       } else {
         this.injectData();
       }
    
      
    }
  });
  return UserListView;
});
