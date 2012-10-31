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
      'questions/:qid': 'questions',
      'questions/:qid/debates': 'browse',
      'questions/:qid/debates/:did': 'debates',
      'questions/:qid/debates/:did/posts/reply': 'commentsReply',
      'questions/:qid/debates/:did/posts': 'comments',      
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
    
    app_router.on('route:questions', function(qid){
       require(['views/home/main'], function(HomeView) {
        alert(qid);
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


    app_router.on('route:commentsReply', function(qid,did){
      require(['views/comments/comments'], function(CommentsView) {
       
        var commentsView = new CommentsView();
        commentsView.render(qid,did,true);
      }) 
    });

    Backbone.history.start();
  };
  return { 
    initialize: initialize
  };
});
