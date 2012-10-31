define([
  'underscore',
  'backbone'
], function(_, Backbone) {
  var QuestionModel = Backbone.Model.extend({
    urlRoot: '/api/questions'    
  });
  return QuestionModel;
});


