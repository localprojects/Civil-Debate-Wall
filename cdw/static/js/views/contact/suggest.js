define(['jquery', 'underscore', 'backbone', 'models/suggest', 'text!templates/contact/suggest.html'], function ($, _, Backbone, SuggestModel, _suggestTemplate) {

    var ContactView = Backbone.View.extend({

        el: $("#contactus"),
        
        
        events: {
            'click .fullsubmit': 'saveToModel'
        },

       
        initialize: function () {
            this.model = new SuggestModel();
        },
        
        successHandler: function(res) {
           $(".error").html("");
           $(".success-message.success.sub-title").hide();
           
           if (res.status === 200) {
             $(".success-message.success.sub-title").html(res.message).show();
           
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

        saveToModel: function () {
        var that = this;
        
            $.ajax({
                    url: '/api/suggestion',
                    type: 'POST',
                    data: {
                     'csrf' : $("#csrf").val(),
                     'firstname': $('[name="firstname"]').val(),
                     'lastname': $('[name="lastname"]').val(),
                     'email': $('[name="email"]').val(),
                     'question': $("textarea").val(),
                     'category' : $(".styled-select option:selected").val()
                    },
                    dataType: 'json',
                    success: function(res) {
                      that.successHandler(res);
                    },
                    error: function(error) {
                      console.log(error);
                    }
                });
         
        },

        render: function () {          
            this.$el.find(".tmpl").html(_.template(_suggestTemplate));
            
            $.ajax({
              url: '/api/questions/categories',
              dataType: "json",
              success : function(data) {
                var html = '<option value="question">SUGGEST A QUESTION</option>';
                
                for (var i = 0; i < data.length; i++) {
                   html = html + '<option value="'+data[i].id+'">'+data[i].name+'</option>';  
                }
                
                $(".styled-select select").html(html)
                
                
              }
            })
        }

    });
    return ContactView;
});