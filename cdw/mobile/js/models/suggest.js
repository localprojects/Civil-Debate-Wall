/*
 * Delete
 */


define([
  'underscore',
  'backbone',
 'config'
], function(_, Backbone,Config) {
  var suggestModel = Backbone.Model.extend({
    url: Config.api_host+ 'api/suggestion'
  });
  return suggestModel;
});
