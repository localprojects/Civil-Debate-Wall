// Filename: app.js
define([
  'jquery', 
  'underscore', 
  'backbone',
  'utils',
  'tpl',
  'sdate',
  'router'
], function($, _, Backbone, Utils, Tpl, SDate ,Router){
  var initialize = function(){
    // Pass in our Router module and call it's initialize function
    Router.initialize();
    
    // init the app
    CDW.utils.init();
   
  };

  return { 
    initialize: initialize
  };
});
