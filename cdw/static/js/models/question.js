define([
  'underscore',
  'backbone',
  'config'
], function(_, Backbone,Config) {
  var QuestionModel = Backbone.Model.extend({
    urlRoot: Config.api_host + 'api/questions'    
  });
  return QuestionModel;
});


