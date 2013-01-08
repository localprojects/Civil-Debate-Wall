define(['jquery', 
'jquery_form',
'underscore', 
'backbone',
'config'], function ($,$form, _, Backbone,Config) {

var apiHost = Config.api_host;


    var ContactView = Backbone.View.extend({

        el: $("#suggestbody"),
        
        
        events: {
            'click #sendSuggestion': 'send'
        },

       
        initialize: function () {
          // $('#suggestform').attr("action",apiHost+"api/suggestion");
           
          
        },
        
        successHandler: function(res) {
           $(".error").html("");
           $(".success-message.success.sub-title").hide();
           $(".success-message").show();
          
           
           if (res.status === 200) {
             $(".success-message.success.sub-title").html(res.message).show();
             $("html, body").animate({ scrollTop: 0 }, "slow");
           
           
            $("#suggestTitle").hide();
           
           $("#suggestform").hide();
           
           
           } else {
             
             if (res.errors) {
               var errs = res.errors;
               
               for (e in errs) {
                
                for (var i = 0; i < errs[e].length; i++) {
                  var error = errs[e];
                  
                  $(".success-"+ e).html(error[i]);
                  
                }
               
               }
             }
             
           }
           
        },

        send: function () {
        	
        	$('#suggestform').ajaxForm(function() { 
                console.log("suggestform should be sent"); 
            }); 
    	//$('#suggestform').submit();
        	
        	
        var that = this;
        var userData = CDW.utils.auth.getUserData();
        
            $.ajax({
                    url:apiHost+ 'api/suggestion',                    
                    dataType: 'jsonp',
                    type: 'POST',
                    data: JSON.stringify({
                     'email': userData.email,
                     'question': $("textarea").val(),
                     'category' : $(".styled-select option:selected").val()
                    }),                    
                    contentType: "application/json;charset=utf-8",
                    success: function(res) {
                      that.successHandler(res);
                    },
                    error: function(error) {
                      console.log(error);
                    }
                });
         
        },

        render: function () {     
        	
        	
        	if(!CDW.utils.auth.getLoginStatus()){
        		$.mobile.changePage( "#login", {changeHash: true,role:"dialog",transition:"pop"} );
              	return;
        	}     
            //this.$el.find(".tmpl").html(_.template(_suggestTemplate));
            $("#suggestform").show();
             $("#suggestTitle").show();
             
             $(".success-message").hide();
             
             $("textarea").val("");
            $.ajax({
              url: apiHost + 'api/questions/categories',
              dataType: "jsonp",
              success : function(data) {
                //var html = '<option value="question" selected="selected">SUGGEST A QUESTION</option>';
                var html="";
                for (var i = 0; i < data.length; i++) {
                   html += '<option value="'+data[i].id+'"' +((i==0)?'selected="true"':'')+'" >'+data[i].name+'</option>';  
                }
                
                //$(".styled-select select").html(html);
                
                
                $("#select-category").html(html).selectmenu('refresh', true);
                
                //$('#select-category').selectmenu('refresh', true);  
               // $('.styled-select select').selectmenu();
    
				//$(".styled-select select").val( "question" ).attr('selected',true);
                        // $("input[name='email']").val(CDW.utils.auth.getUserData().email);
                
                
              }
            })
        }

    });
    return ContactView;
});