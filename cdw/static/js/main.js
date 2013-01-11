
/*
RequireJS will load any dependency that is passed to require() without a ".js" file from 
the same directory as the one used for data-main.

*/
require.config({
  paths: {
    jquery: 'libs/jquery/jquery-min',
    underscore: 'libs/underscore/underscore-min',
    backbone: 'libs/backbone/backbone-min',
    jqmr : 'libs/jquery/jquery.mobile.router',
    jquery_mobile: 'libs/jquery/jquery.mobile-1.2.0.min',
    jquery_form:'libs/jquery/jquery.form',
    templates: '../templates',
    utils: "cdw/utils",
    cdw: "cdw/CDW",
    preloader: "cdw/tpl",
    sdate: 'libs/date/date',
    config:'cdw/config'
  }

});






require(
    ['jquery','preloader'],
    function ($,Preloader) {


//preload templates during production..currently both templates and css can be optimized and simplified massively
//good read http://coenraets.org/blog/2012/01/backbone-js-lessons-learned-and-improved-sample-app/

 		Preloader.loadTemplates(['home/main', 'debate/debate', 'comments/comments','users/list','reg/login','quickvote/quickvote','users/activity'], function() {
        console.log('templates preloaded');

	
	$(document).bind("mobileinit", function(){
  		 	
	  	console.log("mobileinit");
	  	$.mobile.autoInitializePage = false; //disable page load before our router is ready
	  	
	  	/*
	  	 * This is a hack because mobile router doesn't fire on first page load.
	  	 * http://stackoverflow.com/questions/13086110/jquery-mobile-router-doesnt-route-the-first-page-load
	  	 * Fix?
	  	 */
	  	
	  	$(document).one('pagebeforechange', function(event, data) {
		   data.toPage = window.location.hash;
		    console.log("pagebeforechange: "+data.toPage);
		});
	  	

	});
	
	
	
	
	
         $(document).bind ('pageinit', function (e, data) {
		
			console.log("page init");
		});
        
        
        
        
        
      	
        require(
            ['jquery', 'jqmr', 'jquery_mobile', 'app','router'],
            function ( $,jqmr, $$, App, Router) {
            	
            		
            	
            	
                console.log('jquery.mobile.router loaded');
                //require('app').init();

                 Router.initialize();
                 
                console.log("app init");
                App.initialize();
              
               	CDW.utils.auth.status();
              
					//init only when all dependencies are loaded
				//the load order is super important, especially when using JQM and JQMR
				$.mobile.initializePage();
				
				
				//for some reason the above line doesn't kickstart when there are no params in hash
				var page=window.location.hash.replace( /\?.*$/, "" );
				
				var wasDialog = window.location.hash.indexOf("&ui-state=dialog")>-1;
				if(page=='' || wasDialog){
					console.log("Router init page fix for not firing without params");
					Router.router.home("bs",[]); 
					window.location.hash = "";
					//$.mobile.changePage( "#home", {changeHash: false} );
				}
	
	
	
				
          });
          
          
          
          
          
          
          
          
    });//end preloader

});
     

