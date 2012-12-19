
define(['jquery', 'underscore', 'backbone', 'models/past', 'text!templates/past/past.html'], function ($, _, Backbone, PastModel, _pastTemplate) {

    var PastView = Backbone.View.extend({

        el: $("#past"),

        initialize: function () {
        
            this.models = {};
            this.models.past = new PastModel();
   
            CDW.utils.auth.regHeader();
          
        },

        
        
        render: function () {

          var userData = CDW.utils.auth.getUserData(),
              that = this;
              
              this.models.past.fetch({
                        
                        dataType: "json",

                        success: function (model, pastdata) {
                        console.log(pastdata)
                         _.templateSettings.variable = "main";                        
                         that.$el.find(".tmpl").html(_.template( _pastTemplate, pastdata));
                        }

              });
          
          
          
          
          
        
          
        }
    });
    return PastView;
});
