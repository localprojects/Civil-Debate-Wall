
define(['jquery', 'underscore', 'backbone', 'models/profile', 'text!templates/users/profile.html'], function ($, _, Backbone, ProfileModel, _profileTemplate) {

    var MainHomeView = Backbone.View.extend({

        el: $("#profile"),

        initialize: function () {
        
            this.models = {};
            this.models.profile = new ProfileModel();
   
            CDW.utils.auth.regHeader();
          
        },

        events: {
            "click .debates .debate .reply" : "goThread",
            "click .debate .desc": "goThread"            
        },

        goThread : function(e) {           
           e.preventDefault();
           /*var container = (e.currentTarget).parent().parent().parent(),
               qid = container.attr("data-qid"),
               postid = (!container.attr("data-isresponse")) ? container.attr("data-postid") : "",
               
           setTimeout(function() {
              window.location.href = "comments.html#/questions/"+that.models.current.id+"/debates/"+$(e.currentTarget).parent().parent().parent().attr("data-did")+"/posts" + fragment;
           }, 1000);*/
           
        },
        
        render: function () {

          var userData = CDW.utils.auth.getUserData(),
              that = this;
              
              this.models.profile.fetch({
                        
                        dataType: "json",

                        success: function (model, profiledata) {
                          console.log(profiledata);
                           _.templateSettings.variable = "main";
                           that.$el.find(".tmpl").html(_.template(_profileTemplate, profiledata));
                           
                           // update profile picture and name
                           $(".question").find(".mypic .w").html('<img src="http://civildebatewall.s3.amazonaws.com'+userData.webImages.thumb+'" border="0" width=""/>').end().find(".info .name").text(userData.username);
                        }

              });
          
          
          
          
          
        
          
        }
    });
    return MainHomeView;
});
