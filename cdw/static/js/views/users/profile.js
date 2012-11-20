
define(['jquery', 'underscore', 'backbone', 'models/profile', 'text!templates/users/profile.html', 'text!templates/debate/debate.html'], function ($, _, Backbone, ProfileModel, _profileTemplate, _debateTemplate) {

    var MainHomeView = Backbone.View.extend({

        el: $("#profile"),

        initialize: function () {
        
            this.models = {};
            this.models.profile = new ProfileModel();
            this.currentPage = 1;
            this.perPage = 25;
            this.userData;
            CDW.utils.auth.regHeader();
          
        },
        
        
        getPastDebates : function() {
          window.location.href = "past.html#past";
        },
        
        getMore : function() {
            var data,
                container = $(".seemore"),
                nextEnd = (this.userData.posts.length > (this.currentPage * 1 * this.perPage * 1)) ? (this.currentPage * 1 * this.perPage * 1) : this.userData.posts.length;
            
            this.currentPage++;
            
            if (this.userData.posts.length >= nextEnd) {
               var posts = this.getContent(this.currentPage);
               
               for (i = 0; i < posts.length; i++) {  
                 _.templateSettings.variable = "entry";                        
                 $(".seemore").before(_.template(_debateTemplate, posts[i]));
               }
                        
            } else {
               $(".seemore .more, .seemore .loader").hide();
               
            }
            
            
            if (this.currentPage < 3) {
                     container.find(".loader, .past").hide().end().find(".more").show();
                } else {
                     container.find(".loader, .more").hide().end().find(".past").show();
            }
                   
                   
            if ($(".debates.bottom .debate").length >= this.userData.posts.length) {
                $(".seemore .more").hide();
                $(".seemore .past").show();
            } 
            
            
                   
        },
        
        getContent : function(page) {

            var total = this.userData.posts.length,
                start = ((page-1) * this.perPage),
                end   =  (total > page * this.perPage) ? (page * this.perPage) : total;
                
                console.log(start + " " + end);
                
                return this.userData.posts.slice(start,end);
        },

        events: {
            "click .debates .debate .reply" : "goThread",
            "click .debate .desc": "goThread",
            "click .seemore .more": "getMore",
            "click .seemore .past": "getPastDebates"
        },

        goThread : function(e) {           
           $(".clicked").removeClass("clicked");
           $(e.currentTarget).parent().parent().parent().addClass("clicked");
           e.preventDefault();
           var container = $(e.currentTarget).parent().parent().parent(),
               qid = container.attr("data-qid"),
               postid = container.attr("data-postid");
               
           setTimeout(function() {
              window.location.href = "comments.html#/questions/"+container.attr("data-question")+"/debates/"+container.attr("data-thread")+"/posts";
           }, 1000);
           
        },
        
        render: function () {

          var userData = CDW.utils.auth.getUserData(),
              that = this;
              
              this.models.profile.fetch({
                        
                        dataType: "json",

                        success: function (model, profiledata) {
                          console.log(profiledata);
                         
                          that.userData = profiledata;
                           _.templateSettings.variable = "main";                        
                           that.$el.find(".tmpl").html(_.template(_profileTemplate, {
                               debates:profiledata.debates,
                               threads:profiledata.threads,
                               posts: that.getContent(that.currentPage)                               
                           }));
                           
                           if (profiledata.posts.length > $(".debates.bottom .debate").length){
                             $(".seemore .more").show();
                           } 
                           
                           if (profiledata.posts.length <= 25) {
                             $(".seemore .more").hide();
                           } 
                           
                           
                           // update profile picture and name
                           $(".question").find(".mypic .w").html('<img src="http://civildebatewall.s3.amazonaws.com'+userData.webImages.thumb+'" border="0" width=""/>').end().find(".info .name").text(userData.username);
                           
                           //bind likes
                            $(".likes").each(function() {
                               CDW.utils.likes($(this).parent().parent().parent().attr("data-postid"), $(this));
                            });
                                    
                        }

              });
          
          
          
          
          
        
          
        }
    });
    return MainHomeView;
});
