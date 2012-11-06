// Filename: app.js
define([
  'jquery', 
  'underscore', 
  'backbone',
  'utils',
  'tpl',
  'router'
], function($, _, Backbone, Utils, Tpl ,Router){
  var initialize = function(){
    // Pass in our Router module and call it's initialize function
    Router.initialize();
    
    // init the app
    $(function () {
      CDW.utils.init();
    });
  };

  return { 
    initialize: initialize
  };
});
