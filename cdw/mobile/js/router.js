// Filename: router.js


/*
 * To get the backbone router and jquery mobile to work together is tricky
 * 
 * The app is a single page app so all pages are hastags within that one page.
 * Hitting a href will change the hash and fire the router.
 * To trigger login without changing hash tag so as to stay modal I use
 * <a onclick="CDW.utils.auth.showLogin();return false;" data-role="button" data-rel="dialog" data-transition="pop">
 * and not the default dialog close btn as it is wrapped in an href.
 * 
 *  
 * 
 * 
 */


var M={}, V={}, C={};

window.router = C;

var homeView,apiHost,repliesPerPage;

require(['config'], function(Config) {
	
	apiHost = Config.api_host;
	repliesPerPage = Config.replies_per_page;
});


C.home = function(){
	require(['views/home/main'], function(HomeView) {
		CDW.utils.auth.status();
        	//creating homepage view
       		//$.mobile.changePage( "" , { reverse: $.mobile.activePage.attr('id') =='reply', changeHash: false, transition:"fade" } );
			
			if(!homeView){
				//todo: add check same debate
       			homeView = new HomeView();
        		homeView.render();
        	}
       })
};

C.gotoThread = function(){
	require(['views/comments/comments'], function(CommentsView) {
		
		CDW.utils.auth.status();
	    	//pass on current q id from homeview
	    	//var qid = homeView.models.current.id;//question id
	    	var qData = homeView.models.current;//no need to pass question id when question string is alrteady known
	    	var did = homeView.currThread;//debate id 
	    	var skip = homeView.currenPage;
	    	var limit = repliesPerPage;
	    	
	    	var commentView = new CommentsView();
	       	commentView.render(qData,did,skip,limit);
	    	
	    	
      })
};


C.pageInit = function (type, match, ui, page) {
    console.log('This page '+$(page).jqmData("url")+" has been initialized");
    
};



/*
 * 
 * 
 * https://github.com/azicchetti/jquerymobile-router
 * 
 *    bc  => pagebeforecreate
        c   => pagecreate
        i   => pageinit
        bs  => pagebeforeshow
        s   => pageshow
        bh  => pagebeforehide
        h   => pagehide
        rm  => pageremove
        bC  => pagebeforechange
        bl  => pagebeforeload
        l   => pageload

 */



C.router=new $.mobile.Router({
	"#": function(){ 
		handler: C.home
	},
	"#home([?].*)?": {
		handler: C.home, 
		events: "bs"
	},
	"#signup([?].*)?" : {
		handler : C.renderForm, 
		events : "bs"
	},
	"#reply([?].*)?" : {
		handler : C.gotoThread, 
		events : "bs"
	},
	".": {
		handler: C.pageInit, events: "i"
	}
});


C.init = function(){
	if(this.inited){
		return;
	}
	
	this.inited = true;
	
	//alert($(page).jqmData("url"));
	this.home();
	
}
