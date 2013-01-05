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
           $('#suggestform').attr("action",apiHost+"api/suggest");
           
           
        },
        
        successHandler: function(res) {
           $(".error").html("");
           $(".success-message.success.sub-title").hide();
           
           if (res.status === 200) {
             $(".success-message.success.sub-title").html(res.message).show();
             $("html, body").animate({ scrollTop: 0 }, "slow");
           
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
        
            $.ajax({
                    url:apiHost+ 'api/suggestion',                    
                    dataType: 'json',
                    type: 'POST',
                    data: JSON.stringify({                     
                     'firstname': $('[name="firstname"]').val(),
                     'lastname': $('[name="lastname"]').val(),
                     'email': $('[name="email"]').val(),
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
            //this.$el.find(".tmpl").html(_.template(_suggestTemplate));
            
            $.ajax({
              url: apiHost + 'api/questions/categories',
              dataType: "json",
              success : function(data) {
                var html = '<option value="question">SUGGEST A QUESTION</option>';
                
                for (var i = 0; i < data.length; i++) {
                   html = html + '<option value="'+data[i].id+'">'+data[i].name+'</option>';  
                }
                
                $(".styled-select select").html(html);
                $("input[name='email']").val(CDW.utils.auth.getUserData().email);
                
                
              }
            })
        }

    });
    return ContactView;
});