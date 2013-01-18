/*
 RequireJS will load any dependency that is passed to require() without a ".js" file from
 the same directory as the one used for data-main.

 */
require.config({
    paths : {
        jquery : 'libs/jquery/jquery-min',
        underscore : 'libs/underscore/underscore-min',
        backbone : 'libs/backbone/backbone-min',
        jqmr : 'libs/jquery/jquery.mobile.router',
        jquery_mobile : 'libs/jquery/jquery.mobile-1.2.0.min',
        jquery_form : 'libs/jquery/jquery.form',
        jquery_numeric:'libs/jquery/jquery.numeric',
        jquery_color:'libs/jquery/jquery.color',
        utils : "cdw/utils",
        cdw : "cdw/CDW",
        sdate : 'libs/date/date',
        config : 'cdw/config',
        preloader : "cdw/tpl",
        templates : '/static/partials',
        typekit:'http://use.typekit.com/oth3eox'
    }

});

require(['jquery', 'preloader','typekit'], function($, Preloader,Fonts) {
    // preload templates during production..
    // currently both templates and css can be optimized and simplified massively
    // good read: http://coenraets.org/blog/2012/01/backbone-js-lessons-learned-and-improved-sample-app/
	
	
	Typekit.load();
	
	
	// var tmplPath = "../../templates/";//currently confusingly templates for underscorejs are within templates folder for flask
    var tmplPath = "/static/partials/";//currently confusingly templates for underscorejs are within templates folder for flask

    // var page_templates = new Array('home/main', 'debate/debate', 'comments/comments', 'users/list', 'reg/login', 'quickvote/quickvote', 'users/activity');
    var page_templates = new Array(tmplPath+'home/main', tmplPath+'debate/debate', tmplPath+'comments/comments', tmplPath+'users/list', tmplPath+'reg/login', tmplPath+'quickvote/quickvote', tmplPath+'users/activity', tmplPath+'stats/stats');
    Preloader.loadTemplates(page_templates, function() {
        console.log('templates ' + page_templates + ' preloaded');

        $(document).bind("mobileinit", function() {

            $.mobile.autoInitializePage = false;
            //disable page load before our router is ready

            // This is a hack because mobile router doesn't fire on first page load.
            // http://stackoverflow.com/questions/13086110/jquery-mobile-router-doesnt-route-the-first-page-load
            // Fix?
            $(document).one('pagebeforechange', function(event, data) {
                data.toPage = window.location.hash;
                console.log("pagebeforechange: " + data.toPage);
            });
        });

        $(document).bind('pageinit', function(e, data) {
            console.log("page init");
        });

        require(['jquery', 'jqmr', 'jquery_mobile', 'app', 'router'], function($, jqmr, $$, App, Router) {

            console.log('jquery.mobile.router loaded');
            //require('app').init();

            Router.initialize();

            console.log("app init");
            App.initialize();

            CDW.utils.auth.status();

            // init only when all dependencies are loaded
            // the load order is super important, especially when using JQM and JQMR
            $.mobile.initializePage();

            //for some reason the above line doesn't kickstart when there are no params in hash
            var page = window.location.hash.replace(/\?.*$/, "");

            var wasDialog = window.location.hash.indexOf("&ui-state=dialog") > -1;
            if (page == '' || wasDialog) {
                console.log("Router init page fix for not firing without params");
                Router.router.home("bs", []);
                window.location.hash = "";
                //$.mobile.changePage( "#home", {changeHash: false} );
            }

        });

    });
    //end preloader

});

