// -----------------------
// Common Views
// -----------------------
window.PopupHolderView = Backbone.View.extend({
  
  el: $('div.popup-outer'),
  
  initialize: function() {
    this.$inner = this.$('div.popup-inner');
  },
  
  showPopup: function(view, width) {
    this.closePopup();
    this.currentPopup = view;
    this.$inner.html(view.render().el);
    this.$inner.css({ width: width || 500 });
    this.el.show();
    this.onResize();
  },

  closePopup: function() {
    try {
      this.currentPopup.remove();
    } catch(e) { }
    this.el.hide();
  },
  
  onResize: function(e) {
    var centered = Math.max(0, $(window).height() / 2 - this.$inner.height() / 2);
    this.$inner.css('top', Math.round(centered - 100));
  }
  
});

window.LoginPopupView = Backbone.View.extend({
  tagName: 'div',
  className: 'popup login-popup',
  template: _.template($('#login-popup-template').html()),
  
  events: {
    'blur p.username input': 'checkIfUserExists',
    'submit #login_or_signup_form': 'onSubmit',
  },
  
  initialize: function() {
    this.isSignin = true;
  },
  
  render: function() {
    $(this.el).html(this.template());
    return this;
  },
  
  toggle: function() {
    this.$('form').toggleClass('disabled');
  },
  
  setValues: function(signIn, label, action, addClass, removeClass, fieldName) {
    this.isSignin = signIn;
    this.$('form').attr('action', action).addClass(addClass).removeClass(removeClass);
    this.$('p.username input').attr('name', fieldName);
    this.$('form button').text(label);
  },
  
  setRegister: function(label) {
    this.setValues(false, label || 'Register', '/register/email', 'register-form', 'signin-form', 'email');
  },
  
  setSignin: function(label) {
    this.setValues(true, label || 'Register/Sign In', '/auth', 'signin-form', 'register-form', 'username');
  },
  
  showError: function(error) {
    var $div = this.$('div.error-msg');
    if(error) {
      $div.text(error);
      $div.show()
    } else {
      $div.hide();
    }
  },
  
  checkIfUserExists: function(e) {
    this.toggle();
    $.ajax({
      url: '/api/users/search', type: 'POST',
      data: {
        'email': this.$('p.username input').attr('value'),
      },
      complete: $.proxy(function() {
        this.toggle();
      }, this),
      error: $.proxy(function() {
        this.setSignin();
      }, this),
      success: $.proxy(function(data) {
        if(data.length == 1) {
          this.setSignin('Sign In');
        } else {
          this.setRegister('Register');
        }
      }, this),
    });
  },
  
  onSubmit: function(e) {
    this.showError(null);
    if(this.isSignin) {
      e.preventDefault();
      var $form = this.$('form');
      $.ajax({
        url: $form.attr('action'),
        type: 'POST',
        dataType: 'json',
        data: $form.serialize(),
        success: $.proxy(function(data) {
          if(data.success) {
            window.location.reload(true);
          } else {
            this.showError(data.error);
          }
        }, this)
      })
    }
  },
});

window.PopupHolder = new PopupHolderView
window.resizeable.push(PopupHolder);

$(function() {
  // Open the LoginPopup
  $('a.create-account-btn, a.signin-btn').live('click', function(e) {
    e.preventDefault();
    window.PopupHolder.showPopup(new LoginPopupView);
  });
  
  // Close the popup
  $('.close-popup-btn').live('click', function(e) {
    e.preventDefault();
    window.PopupHolder.closePopup();
  });
  
  // Always close the popup if the mask if clicked
  $('div.popup-mask').click(function(e) {
    e.preventDefault();
    window.PopupHolder.closePopup();
  });
});
