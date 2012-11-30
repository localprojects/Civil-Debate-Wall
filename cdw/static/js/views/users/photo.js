define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){
  var UserListView = Backbone.View.extend({
    
    el: $("#photo"),
    
    initialize: function(){
    
      CDW.utils.auth.regHeader();
      
    },
    
    
    events: {
       "click .save": "submit"     
    },
    
    submit : function() {
      $("#upload_target").bind("load", function() {
        
        //http://civildebatewall.s3.amazonaws.com/images/users/50a3272185c5d36f62000000-thumbnail.jpg
        
        //var data = JSON.parse($("#upload_target").contents().find("body pre").html());
        
        $("#done").show();
        
      });
      
      $("#photoform").submit();
    }
    
    
    
   
  });
  return UserListView;
});
