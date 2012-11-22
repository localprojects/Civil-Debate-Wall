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
      $("#photoform").submit();
    }
    
    
    
   
  });
  return UserListView;
});
