define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var StatsModel = Backbone.Model.extend({
    urlRoot: '/api/stats/questions/'    
  });
  return StatsModel;
});
