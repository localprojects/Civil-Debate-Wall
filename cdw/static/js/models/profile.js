define([
  'underscore',
  'backbone',
  'config'
], function(_, Backbone,Config) {
  var ProfileModel = Backbone.Model.extend({
    urlRoot:Config.api_host + 'api/profile'    
  });
  return ProfileModel;
});

