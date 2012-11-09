define(['jquery', 'underscore', 'backbone', 'models/profile', 'models/stats', 'text!templates/users/profile.html'], function ($, _, Backbone, ProfileModel, StatsModel, _profileTemplate) {

    var MainHomeView = Backbone.View.extend({

        el: $("#profile"),

        initialize: function () {
        
            this.models = {};
            this.models.profile = new ProfileModel();
            this.models.stats = new StatsModel();
            
            CDW.utils.auth.regHeader();
            

        },

        events: {
            
        },

        render: function () {

          var userData = CDW.utils.auth.getUserData(),
              that = this;
              
              this.models.profile.fetch({
                        
                        dataType: "jsonp",

                        success: function (model, profiledata) {
                          
                           _.templateSettings.variable = "main";
                           this.$el.find(".tmpl").html(_.template(_profileTemplate));
                           
                           // update profile picture and name
                           $(".question").find(".mypic .w").html('<img src="http://civildebatewall.s3.amazonaws.com'+userData.webImages.thumb+'" border="0" width=""/>').end().find(".info .name").text(userData.username);
                        }

              });
          
          
          
          
          
        
          
        }
    });
    return MainHomeView;
});
