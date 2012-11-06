define(['jquery', 'underscore', 'backbone', 'models/contact', 'text!templates/contact/contact.html'], function ($, _, Backbone, ContactModel, _contactTemplate) {

    var ContactView = Backbone.View.extend({

        el: $("#contactus"),

        events: {
            'click .fullsubmit': 'saveToModel'
        },

        initialize: function () {
            this.model = new ContactModel();
        },

        saveToModel: function () {
            //firstname=sundar&lastname=raman&email=sundar@localprojects.net&comment=site sucks" "http://localhost:9000/contact
            /*this.model.save({
                'firstname': $('[name="firstname"]').val(),
                    'lastname': $('[name="lastname"]').val(),
                    'email': $('[name="email"]').val(),
                    'comment': $("textarea").val().
                success: function (model, response) {
                    console.log('success');
                },
                error: function () {
                    console.log('error');
                }
            });*/
          /*
          saveWine:function () {
        this.model.set({
            name:$('#name').val(),
            grapes:$('#grapes').val(),
            country:$('#country').val(),
            region:$('#region').val(),
            year:$('#year').val(),
            description:$('#description').val()
        });
        if (this.model.isNew()) {
            app.wineList.create(this.model);
        } else {
            this.model.save();
        }
        return false;
    },
    */  
        
           $.ajax({
             type: 'POST',
               url: 'http://ec2-107-22-36-240.compute-1.amazonaws.com/contact',
               dataType: "json",  
               contentType: "application/json; charset=utf-8",
               data: {
                 'firstname': $('[name="firstname"]').val(),
                 'lastname': $('[name="lastname"]').val(),
                 'email': $('[name="email"]').val(),
                 'comment': $("textarea").val()
               },
                 success: function(r) {
                 console.log(r);
               }, error: function(e) {
                 console.log(e)
               }
            }); 
         
        },

        render: function () {
            this.$el.find(".tmpl").html(_.template(_contactTemplate));
        }

    });
    return ContactView;
});