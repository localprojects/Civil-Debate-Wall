define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone){
  var UserListView = Backbone.View.extend({
    
    el: $("#photo"),
    
    initialize: function(){
    
      
    },
    
    
    events: {
       "click .save": "submit"     
    },
    
    submit : function() {
      $("#upload_target").bind("load", function() {
        
        $("#done").show();
        
      });
      
      $("#photoform").submit();
    }
    
    
    
   
  });
  return UserListView;
});
