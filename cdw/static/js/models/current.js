define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var CurrentModel = Backbone.Model.extend({
    urlRoot: 'http://ec2-107-22-36-240.compute-1.amazonaws.com/api/questions/current'    
  });
  return CurrentModel;
});
