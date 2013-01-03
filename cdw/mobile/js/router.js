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

// Filename: app.js
define([
  'jquery', 
   'config',
   'jquery_mobile'
], function($,Config,Mobile){
	
				
	

	
	
	var apiHost = Config.api_host;
	var repliesPerPage = Config.replies_per_page;
	
	var C={};
	
	
  	var initialize = function(){







//var M={}, V={}, C={};

//window.router = C;

var homeView,commentView,apiHost,repliesPerPage;




C.home = function(type, match, ui, page){
	
	var params = C.router.getParams(match[1]);
	var qid;
	if(params){
		qid = params['q'];
	}
	//use for past debates
	
	require(['views/home/main'], function(HomeView) {
		
        	//creating homepage view
       		//$.mobile.changePage( "" , { reverse: $.mobile.activePage.attr('id') =='reply', changeHash: false, transition:"fade" } );
			
			//this is jsut a way of saving reloads...you can recreate every time if you fancy
			if(!homeView){
				//todo: add check same debate
       			homeView = new HomeView();
        		
        	}
        	
        	if(homeView.refresh){
        		homeView.render(qid);
        	}else{
        		//bit of a hack to prevent need for whole page reload on return from comments
        		homeView.hideInputs();
        	}
        	if(CDW.utils.auth.getLoginStatus()){
        		var usr = CDW.utils.auth.getUserData();
        	 	CDW.utils.misc.setTitle("Hi "+usr.username);
        	}else{
        		CDW.utils.misc.setTitle('');
        		
        	}
       })
};

C.gotoThread = function(type, match, ui, page){
	var params = C.router.getParams(match[1]);
	
	
	require(['views/comments/comments'], function(CommentsView) {
		

	    	var qData;
	    	if(homeView){
	    		qData = homeView.models.current;//no need to pass question id when question string is already known
	    	}
	    	
	    	var thread = params.thread;//debate id 
	    	var qid = params.q;//question id
	    	//var skip = homeView.currenPage;
	    	//var limit = repliesPerPage;
	    	
	    	if(!commentView){
	    		commentView = new CommentsView();
	    	}
	    	//thread,question,qData model,postId,page offset
	    	//not implemented scroll to specific post or page
	       	commentView.render(thread,qid,qData);
	    	
	    	
      })
};

/*
C.signup = function(){
	require(['views/users/signup'], function(SignupView) {       
        var signupView = new SignupView();
        signupView.render();
      }) 
	
}*/


C.login = function(type, match, ui, page){
	
	require(['views/users/login'], function(LoginView) {       
        var loginView = new LoginView();
        loginView.render();
      }) 
	
}


C.profile = function(type, match, ui, page){
		var params = C.router.getParams(match[1]);
		var isNew = false;
		if(params){
			isNew = params['new'] =="true";
		}
	require(['views/users/profile'], function(ProfileView) {       
        var profileView = new ProfileView();
        profileView.render(isNew);
      }) 
	
}

C.stats = function(type, match, ui, page){
	
	var params = C.router.getParams(match[1]);
	var qid;
	if(params){
		if(params['qid']){
			qid = params['qid'];
		}
	}
	require(['views/stats/stats'], function(StatsView) {       
        var statsView = new StatsView();
        statsView.render(qid);
      }) 

	
}
C.pageShow = function (type, match, ui, page) {
    console.log('This page '+$(page).jqmData("url")+" has been initialized");
    		
		CDW.utils.auth.updateTopmenu();
    /*
    $( "#popupPanel" ).on({
    popupbeforeposition: function() {
        var h = $( window ).height();

        $( "#popupPanel" ).css( "height", h );
    }
});*/
    
};


C.quickvote = function(type,match,ui,page){
	//$('#agreeBtn').attr("onclick","alert('whatece')");
	//$('#disagreeBtn').attr("onclick","alert('dis')");

}


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
	"#profile([?].*)?" : {
		handler : C.profile, 
		events : "bs"
	},
	"#reply([?].*)?" : {
		handler : C.gotoThread, 
		events : "bs"
	},
	"#login([?].*)?" : {
		handler : C.login, 
		events : "bs"
	},
	"#stats([?].*)?" : {
		handler : C.stats, 
		events : "bs"
	},
	"#vote([?].*)?" : {
		handler : C.quickvote, 
		events : "bs"
	},
	".": {
		handler: C.pageShow, events: "bs"
	}});
//{fixFirstPageDataUrl: true, firstPageDataUrl: "index.html"}

C.init = function(){
	if(this.inited){
		return;
	}
	
	this.inited = true;
	
	//alert($(page).jqmData("url"));
	//CDW.utils.auth.status();
	//CDW.utils.auth.updateTopmenu();
	//TODO check url reference to deeplink route
	/*
	var page=window.location.hash.replace( /\?.*$/, "" );
	
	
	if(page==''){
		console.log("Router init page fix for not firing without params: "+page);
		this.home("bs",[]); 
	}*/
	/*
	var u = $.mobile.path.parseUrl( data.toPage );
	var page=u.hash.replace( /\?.*$/, "" );
				// We don't want the data-url of the page we just modified
				// to be the url that shows up in the browser's location field,
				// so set the dataUrl option to the URL with hash parameters
				data.options.dataUrl = u.href;
				// Now call changePage() and tell it to switch to
				// the page we just modified, but only in case it's different
				// from the current page
				if (	$.mobile.activePage &&
					page.replace(/^#/,"")==$.mobile.activePage.jqmData("url")
				){
					data.options.allowSamePageTransition=true;
					$.mobile.changePage( $(page), data.options );
				} else {
					$.mobile.changePage( $(page), data.options );
				}*/
	//this.home();
	
	
	//var o = C.router.getParams(match[1]);
	
//	console.log(o);
}



	 };

  return { 
    initialize: initialize,
    router:C
  };
});