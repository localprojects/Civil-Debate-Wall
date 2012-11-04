define(['jquery', 'underscore', 'backbone', 'text!templates/users/profile.html'], function ($, _, Backbone, _profileTemplate) {

    var MainHomeView = Backbone.View.extend({

        el: $("#profile"),

        initialize: function () {
            this.models = {};
            

        },

        events: {
            
        },

        render: function () {

            
          //_.templateSettings.variable = "main";
          this.$el.find(".tmpl").html(_.template(_profileTemplate));
          
        }
    });
    return MainHomeView;
});
