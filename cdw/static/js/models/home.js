define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var HomeModel = Backbone.Model.extend({
    urlRoot: '/api/current'    
  });
  return HomeModel;

});
