// Filename: app.js
define([
  'jquery', 
  'underscore', 
  'backbone',
  'sdate',
   'utils',
   'config',
   'cdw',
   'jquery_mobile'
], function($, _, Backbone,Sdate,Utils,Config,CD,Mobile){
	
  	var initialize = function(){
 	
 	//Create a little fade in on page load to prevent flashes of unstyled content
	 $.data(this, 'timer', setTimeout(function() {
         
     	$('#body-wrapper').fadeIn(500);
  
   
    	// init the app
    	CDW.utils.init();

     /*
      * home page is loaded from
  		   views/home/main
    	 loaded by router
      */
  	}));
	}
  return { 
    initialize: initialize
  };
});
