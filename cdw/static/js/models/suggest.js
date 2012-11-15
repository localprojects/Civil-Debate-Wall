define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var suggestModel = Backbone.Model.extend({
    url: '/api/suggestion'
  });
  return suggestModel;
});
