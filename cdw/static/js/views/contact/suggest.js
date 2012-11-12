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
         
        },

        saveToModel: function () {
        var that = this;
        
            $.ajax({
                    url: '/contact',
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
        }

    });
    return ContactView;
});