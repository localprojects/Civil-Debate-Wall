define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var categoryModel = Backbone.Model.extend({
    url: '/api/questions/categories'
  });
  return categoryModel;
});
