define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var DebatesModel = Backbone.Model.extend({
    urlRoot: '/api/questions/'    
  });
  return DebatesModel;
});
