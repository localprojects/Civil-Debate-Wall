define([
  'underscore',
  'backbone',
  'config'
], function(_, Backbone,Config) {
  var HomeModel = Backbone.Model.extend({
    urlRoot:Config.api_host+ 'api/current'    
  });
  return HomeModel;

});
