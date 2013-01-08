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
    	//$.mobile.changePage( backUrl, {changeHash: true} );
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
//    	$.mobile.changePage( backUrl, {changeHash: true} );
    },
    render: function(postFunc){
       // alert(backUrl);
      voteView.postFunc = postFunc;
      console.log("voteView render");
      //$("#agreeBtn").attr("href",backUrl);
      

     // href="#" data-rel="back"  data-role="button" id="agreeBtn" 
      
      
      /*	var str ='Please vote';
      	str+='<a href="#" data-rel="back"  data-role="button" id="agreeBtn" onclick="CDW.utils.quickvote.setVote(false,1);return false;">Agree</a>'; 
		str+='<a href="#" data-rel="back" data-role="button" id="disagreeBtn" onclick="CDW.utils.quickvote.setVote(false,0);return false;">Disagree</a>'; 
		$("#voteform .content").html(str);
    */
      
    }
  });
  return VoteView;
});
