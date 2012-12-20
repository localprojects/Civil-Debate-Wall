// Author: Thomas Davis <thomasalwyndavis@gmail.com>
// Filename: main.js

/*
RequireJS will load any dependency that is passed to require() without a ".js" file from the same directory as the one used for data-main.

*/
require.config({
  paths: {
    jquery: 'libs/jquery/jquery-min',
    underscore: 'libs/underscore/underscore-min',
    backbone: 'libs/backbone/backbone-min',
    jqmr : 'libs/jquery/jquery.mobile.router',
    jquery_mobile: 'libs/jquery/jquery.mobile-1.2.0.min',
    templates: '../templates',
    utils: "cdw/utils",
    cdw: "cdw/CDW",
    tpl: "cdw/tpl",
    sdate: 'libs/date/date',
    config:'cdw/config'
  }

});






require(
    /* No AMD support in jQuery 1.6.4, underscore 1.3 and backbone 0.5.3 :(
    Using this shim instead to ensure proper load sequence*/

    ['jquery', 'underscore', 'backbone' ],
    function ($, _, Backbone) {

        // Exposing globals just in case that we are switching to AMD version of the lib later
        var global = this;

        global.$ = global.$ || $;
        global._ = global._ || _;
        global.Backbone = global.Backbone || Backbone;

        console.log('core libs loaded');

        require(
            [ 'jqmr', 'jquery_mobile', 'app','router'],
            function ( jqmr, $$,  App,Router) {
                console.log('jquery.mobile.router loaded');
                //require('app').init();
                
                
                App.initialize();
                
               
            });
    });



require( [ "jquery"  ], function( $ ) {

	$(document).bind ('pageinit', function (e, data) {
		
		

		require(['app','backbone','router'], 
		function(App,Backbone,Router){
			window.router.init();
			
			
		});
		
	});
	
	
	
	
	$(document).bind("mobileinit", function(){
  		// Prevents all anchor click handling
       // $.mobile.linkBindingEnabled = false;

        // Disabling this will prevent jQuery Mobile from handling hash changes
       // $.mobile.hashListeningEnabled = false;

	  	//$.mobile.ajaxEnabled = false;
	  	//$.mobile.pushStateEnabled = true;//if disabled creates /avc/sdfs/sd style isntead of hash
	  	//$.mobile.changePage.defaults.changeHash = false;
	  	
	  	
	  	
	  	//$.mobile.page.prototype.options.domCache = true;
	  	
	 	/*$.mobile.jqmRouter={
            //ajaxApp: true
        };*/
	});

});

