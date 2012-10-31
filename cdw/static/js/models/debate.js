define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var DebateModel = Backbone.Model.extend({
    urlRoot: '/api/threads/'    
  });
  return DebateModel;
});
