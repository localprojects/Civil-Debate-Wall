
define(['jquery', 
'underscore', 
'backbone', 
'config',
'models/profile', 
'text!templates/users/profile.html', 
'text!templates/debate/debate.html'], 
function ($, 
	_,
	 Backbone,
	 Config,
	  ProfileModel, 
	  _profileTemplate,
	   _debateTemplate) {

	var apiHost = Config.api_host;
    var MainHomeView = Backbone.View.extend({

        el: $("#profile"),

        initialize: function () {
        
            this.models = {};
            this.models.profile = new ProfileModel();
            this.currentPage = 1;
            this.perPage = 25;
            this.userData;
           // CDW.utils.auth.regHeader();
          
        },

        events: {
         
        },
        
        render: function () {

          
        }
    });
    return MainHomeView;
});
