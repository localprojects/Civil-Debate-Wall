define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var contactModel = Backbone.Model.extend({
    url: '/contact'
  });
  return contactModel;
});
