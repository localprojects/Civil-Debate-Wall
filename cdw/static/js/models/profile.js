define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var ProfileModel = Backbone.Model.extend({
    urlRoot: '/api/profile'    
  });
  return ProfileModel;
});

