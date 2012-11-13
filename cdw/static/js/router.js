// Filename: router.js
define([
  'jquery',
  'underscore',
  'backbone'
], function($, _, Backbone ){
  var AppRouter = Backbone.Router.extend({
    routes: {
      // Define some URL routes
      '': 'home',
      'profile' : "profile",
      'past' : "past",
      'contact' : "contact",
      'suggest' : "suggest",
      'signup' : "signup",
      'edit-photo' : "edit-photo",
      'questions/:qid': 'questions',
      'questions/:qid/stats': 'stats',
      'questions/:qid/stats/liked': 'stats',
      'questions/:qid/stats/debated': 'stats',
      'questions/:qid/debates': 'browse',
      'questions/:qid/debates/:did': 'debates',
      'questions/:qid/debates/:did/posts': 'comments',
      'questions/:qid/debates/:did/posts/:pid': 'commentsAnchor',
      '*actions': 'home'
    }
  });
  var initialize = function(){
    var app_router = new AppRouter;
    
    app_router.on('route:home', function(){
      require(['views/home/main'], function(HomeView) {
        var homeView = new HomeView();
        homeView.render();
      })
    }),
    
     app_router.on('route:edit-photo', function(){
      require(['views/user/photo'], function(photoView) {
        var photoView = new PhotoView();
       
      })
    }),
    
    app_router.on('route:past', function(){
      require(['views/past/past'], function(PastView) {
        var pastView = new PastView();
        pastView.render();
       
      })
    }),
    
    app_router.on('route:contact', function(){
      require(['views/contact/contact'], function(ContactView) {
        var contactView = new ContactView();
        contactView.render();
      })
    }),
    
    app_router.on('route:suggest', function(){
      require(['views/contact/suggest'], function(SuggestView) {
        var suggestView = new SuggestView();
        suggestView.render();
      })
    }),
    
    app_router.on('route:profile', function(qid){
      
       require(['views/users/profile'], function( ProfileView) {
        var profileView = new ProfileView();
        profileView.render();
      }) 
      
    }),
    
    app_router.on('route:stats', function(qid){
       require(['views/stats/stats'], function(StatsView) {
        var statsView = new StatsView();
        statsView.render(qid);
      }) 
    }),
    
    
    app_router.on('route:questions', function(qid){
       require(['views/home/main'], function(HomeView) {
        var homeView = new HomeView();
        homeView.render();
      })      
    });
    
     app_router.on('route:comments', function(qid,did){
      require(['views/comments/comments'], function(CommentsView) {
       
        var commentsView = new CommentsView();
        commentsView.render(qid,did);
      }) 
    });
    
    app_router.on('route:commentsAnchor', function(qid,did, pid){
      require(['views/comments/comments'], function(CommentsView) {
       
        var commentsView = new CommentsView();
        commentsView.render(qid,did,pid);
      }) 
    });
    
    app_router.on('route:signup', function(){
      require(['views/users/list'], function(SignupView) {       
        var signupView = new SignupView();
        signupView.render();
      }) 
    });

    Backbone.history.start();
  };
  return { 
    initialize: initialize
  };
});
