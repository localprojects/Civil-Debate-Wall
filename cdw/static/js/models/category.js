define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  if (!window.location.origin)
    window.location.origin = window.location.protocol + "//" + window.location.host;
  var categoryModel = Backbone.Model.extend({
    url: window.location.origin + '/api/questions/categories'
  });
  return categoryModel;
});
