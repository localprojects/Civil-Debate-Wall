
define(['jquery', 'underscore', 'backbone', 'models/past', 'text!templates/past/past.html'], function ($, _, Backbone, PastModel, _pastTemplate) {

    var PastView = Backbone.View.extend({

        el: $("#past"),

        initialize: function () {
        
            this.models = {};
            this.models.past = new PastModel();
   
            CDW.utils.auth.regHeader();
          
        },

        events: {
        
        },

       
        render: function () {

          var userData = CDW.utils.auth.getUserData(),
              that = this;
              
              this.models.profile.fetch({
                        
                        dataType: "json",

                        success: function (model, pastdata) {
                         console.log(pastdata);                                    
                        }

              });
          
          
          
          
          
        
          
        }
    });
    return PastView;
});
