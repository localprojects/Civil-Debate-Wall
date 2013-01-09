define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var categoryModel = Backbone.Model.extend({
    url: 'http://dev.civildebatewall.com/api/questions/categories'
  });
  return categoryModel;
});
