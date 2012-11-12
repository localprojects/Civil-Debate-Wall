define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){
  var UserListView = Backbone.View.extend({
    
    el: $("#profile"),
    
    initialize: function(){
    
      
    },
    
    injectData : function() {
      var userData = CDW.utils.auth.getUserData(),
          myForm = $("form.register"); 
                    
          myForm.find("#username").val(userData.username);
      
      
    },
    
    events: {
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
