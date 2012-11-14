define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var ProfileModel = Backbone.Model.extend({
    urlRoot: '/api/questions/archived'    
  });
  return ProfileModel;
});

