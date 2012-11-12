define(['jquery', 'underscore', 'backbone', 'models/suggest', 'text!templates/contact/suggest.html'], function ($, _, Backbone, SuggestModel, _suggestTemplate) {

    var ContactView = Backbone.View.extend({

        el: $("#contactus"),

       
        initialize: function () {
            this.model = new SuggestModel();
        },
        
        successHandler: function(res) {
         
        },

        saveToModel: function () {
        var that = this;
        
            $.ajax({
                    url: '/suggest',
                    type: 'POST',
                    data: {
                     'firstname': $('[name="firstname"]').val(),
                     'lastname': $('[name="lastname"]').val(),
                     'email': $('[name="email"]').val(),
                     'comment': $("textarea").val(),
                     'feedback' : $(".styled-select option:selected").val()
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
            this.$el.find(".tmpl").html(_.template(_suggestTemplate));
        }

    });
    return ContactView;
});