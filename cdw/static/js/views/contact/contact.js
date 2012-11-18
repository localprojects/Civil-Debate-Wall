define(['jquery', 'underscore', 'backbone', 'models/suggest', 'text!templates/contact/contact.html'], function ($, _, Backbone, ContactModel, _contactTemplate) {

    var ContactView = Backbone.View.extend({

        el: $("#contactus"),

        events: {
            'click .fullsubmit': 'saveToModel'
        },

        initialize: function () {
            this.model = new ContactModel();
        },
        
        successHandler: function(res) {
          $(".error, .success").text("");
          $(".success-message").hide();
          
          for (k in res) {
            if (res.hasOwnProperty(k)) {
              console.log(k);
              console.log(res[k]);
              $(".success-"+k).text(res[k]);
              if (k === 'message') {
                $(".success-"+k).show();
              }
            }
          }
        },

        saveToModel: function () {
        var that = this;
        
            $.ajax({
                    url: '/contact',
                    type: 'POST',
                    data: {
                     'firstname': $('[name="firstname"]').val(),
                     'lastname': $('[name="lastname"]').val(),
                     'email': $('[name="email"]').val(),
                     'comment': $("textarea").val(),
                     'feedback' : $(".styled-select option:selected").val(),
                     "csrf" : $("#csrf").val()
                    },
                    dataType: 'json',
                    success: function(res) {
                      that.successHandler(res);
                    },
                    error: function(eeee) {
                      
                    }
                });
         
        },

        render: function () {
            this.$el.find(".tmpl").html(_.template(_contactTemplate));
        }

    });
    return ContactView;
});