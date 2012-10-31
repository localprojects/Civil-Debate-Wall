define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var StatsModel = Backbone.Model.extend({
    urlRoot: '/api/threads/'    
  });
  return StatsModel;
});
