define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var contactModel = Backbone.Model.extend({
    url: 'http://ec2-107-22-36-240.compute-1.amazonaws.com/contact'
  });
  return contactModel;
});
