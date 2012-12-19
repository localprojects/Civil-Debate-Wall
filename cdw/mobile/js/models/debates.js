define([
  'underscore',
  'backbone',
  'config'
], function(_, Backbone,Config) {
  var DebatesModel = Backbone.Model.extend({
    urlRoot:Config.api_host+ 'api/questions/'    
  });
  return DebatesModel;
});
