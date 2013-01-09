define([
  'jquery',
  'underscore',
  'backbone',
  'config'
], function($, _, Backbone, Config){
	var apiHost = Config.api_host;
	var postFunc;
	var voteView;
	
  var VoteView = Backbone.View.extend({ 
    el: $("#voteform"),
    initialize: function(){
		voteView = this;
      },  
    events: {
            "click #agreeBtn":"voteYesAndPost",
            "click #disagreeBtn":"voteNoAndPost"
    },  
    voteYesAndPost:function(){
    	CDW.utils.quickvote.setVote(false,1);
    	if(voteView.postFunc){
    		voteView.postFunc(null);//post the reply after vote
    		voteView.postFunc = null;
    	}
    	$('#vote').dialog('close');
    },
    voteNoAndPost:function(){
    	CDW.utils.quickvote.setVote(false,0);
    	if(voteView.postFunc){
    		voteView.postFunc(null);//post the reply after vote
    		voteView.postFunc = null;
    	}
    	$('#vote').dialog('close');
    },
    render: function(postFunc){
      voteView.postFunc = postFunc;
      console.log("voteView render");

      
    }
  });
  return VoteView;
});
