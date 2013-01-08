define([
  'underscore',
  'backbone',
  'config'
], function(_, Backbone,Config) {
  var CurrentModel = Backbone.Model.extend({
    urlRoot:Config.api_host+ 'api/questions/current'    
  });
  return CurrentModel;
});
