define([
  'underscore',
  'backbone',
   'config'
], function(_, Backbone,Config) {
  var DebateModel = Backbone.Model.extend({
    urlRoot: Config.api_host +  'api/threads/'    
  });
  return DebateModel;
});
