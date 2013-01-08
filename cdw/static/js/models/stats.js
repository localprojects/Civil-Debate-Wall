define([
  'underscore',
  'backbone',
  'config'
], function(_, Backbone,Config) {
  var StatsModel = Backbone.Model.extend({
    urlRoot: Config.api_host + 'api/stats/questions/'    
  });
  return StatsModel;
});
