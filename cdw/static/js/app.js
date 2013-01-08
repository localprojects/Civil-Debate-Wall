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

  		
  		
  		
    // Pass in our Router module and call it's initialize function

	//$(function() { $("body").show(); });

//$.mobile.loading( 'show', { theme: "a", text: "Loading...", textonly: false });

//$( document ).delegate("#home", "pagebeforecreate", function() {
 // alert('A page with an id of "aboutPage" is about to be created by jQuery Mobile!');
 //$('#preloader').css('display', 'none');
 //$('#body-wrapper').css('display', 'inline');
 


//$.mobile.activePage not yet set


 //$('#body-wrapper').hide().delay(500).fadeIn (1000); 
 
 $.data(this, 'timer', setTimeout(function() {
     // $('#download').stop(true, true).fadeIn('fast');
     
     
     $('#body-wrapper').fadeIn(500, function() {
        // Animation complete
 //alert($.mobile.activePage);
 
 		//$.mobile.loading( 'show', { theme: "c", text: "Loading...", textonly: false });
 		
 		//$.mobile.loading('hide');
      });
      
      
  }, 500));
  
  





 //$('#body-wrapper').hide().delay(500).fadeIn (1000); 

/*

*/
        		
  		/*
  		 * Please see
  		 * http://jquerymobile.com/test/docs/pages/backbone-require.html
  		 */

		//});
		      

	
	
  		//window.router = Router.initialize();
  		
 
    // init the app
    CDW.utils.init();
    
    /*CDW = {};
        CDW.utils = CDW.utils || {};

    window.CDW = CDW;*/
  
  	//
     /*
      * home page is loaded from
     views/home/main
     loaded by router
      
       var homeView = new HomeView();
        homeView.render();
      
      */
  };

  return { 
    initialize: initialize
  };
});
