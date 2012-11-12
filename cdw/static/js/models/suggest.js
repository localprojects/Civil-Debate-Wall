define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var suggestModel = Backbone.Model.extend({
    url: '/suggest'
  });
  return suggestModel;
});
