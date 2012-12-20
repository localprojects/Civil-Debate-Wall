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
		
	    	//pass on current q id from homeview
	    	//todo take these from url
	    	var qData;
	    	if(homeView){
	    		qData = homeView.models.current;//no need to pass question id when question string is alrteady known
	    	}
	    	
	    	var thread = homeView.currThread;//debate id 
	    	var qid = homeView.models.current.id;//question id
	    	//var skip = homeView.currenPage;
	    	//var limit = repliesPerPage;
	    	
	    	var commentView = new CommentsView();
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


C.login = function(){
	require(['views/users/login'], function(LoginView) {       
        var loginView = new LoginView();
        loginView.render();
      }) 
	
}


C.profile = function(){
	require(['views/users/profile'], function(ProfileView) {       
        var profileView = new ProfileView();
        profileView.render();
      }) 
	
}
C.pageShow = function (type, match, ui, page) {
    console.log('This page '+$(page).jqmData("url")+" has been initialized");
    
    //checks if logged and update topmenu
		CDW.utils.auth.status();
    /*
    $( "#popupPanel" ).on({
    popupbeforeposition: function() {
        var h = $( window ).height();

        $( "#popupPanel" ).css( "height", h );
    }
});*/
    
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
	".": {
		handler: C.pageShow, events: "bs"
	}
});


C.init = function(){
	if(this.inited){
		return;
	}
	
	this.inited = true;
	
	//alert($(page).jqmData("url"));
	CDW.utils.auth.status();
	CDW.utils.auth.updateTopmenu();
	//TODO check url reference to deeplink route
	this.home();
	
}
