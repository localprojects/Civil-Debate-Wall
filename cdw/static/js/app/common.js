/**
 * PopupHolderView
 */
window.PopupHolderView = Backbone.View.extend({
  el : $('div.popup-outer'),

  initialize : function() {
    this.$inner = this.$('div.popup-inner');
    this.$mask = this.$('div.popup-mask');
  },
  
  /**
   * Show the supplied popup view
   */
  showPopup : function(view, width, opacity) {
    this.closePopup();
    this.currentPopup = view;
    this.$inner.html(view.render().el);
    this.$inner.css({
      width : width || 500
    });
    this.$mask.css({ opacity: (opacity == undefined) ? 0.85 : opacity })
    this.el.show();
    this.onResize();
  },
  
  /**
   * Close the current popup
   */
  closePopup : function() {
    try { this.currentPopup.remove(); } catch(e) { }
    this.el.hide();
  },
  
  onResize : function(e) {
    var centered = Math.max(0, 
      $(window).height() / 2 - this.$inner.height() / 2);
    this.$inner.css('top', Math.round(centered - 100));
  }
});

/**
 * LoginPopupView
 */
window.LoginPopupView = Backbone.View.extend({
  tagName : 'div',
  className : 'popup login-popup',
  template : _.template($('#login-popup-template').html()),

  events : {
    'submit #login_or_signup_form' : 'onSubmit',
    'submit form.forgot-form': 'onForgotSubmit',
    'click a.forgot': 'onForgotClick',
    'click a.back-to-login': 'hideForgot'
  },
  
  initialize : function() {
    this.isSignin = true;
  },
  
  render : function() {
    $(this.el).html(this.template(this.model));
    this.$('input.defaulttext').blur(); // Set the default text stuff
    
    // Register after the first blur
    this.$('input.username').blur($.proxy(function(e) {
      this.checkIfUserExists(e);
    }, this));
    this.$('div.forgot-view').hide();
    return this;
  },
  
  /**
   * Toggle the form's ableness
   */
  toggle : function() {
    this.$('form').toggleClass('disabled');
  },
  
  /**
   * Set the values for the form.
   */
  setValues : function(signIn, label, action, 
      addClass, removeClass, fieldName) {
      
    this.isSignin = signIn;
    this.$('form').attr('action', action).
      addClass(addClass).removeClass(removeClass);
    this.$('p.username input').attr('name', fieldName);
    this.$('#login_or_signup_form button').text(label);
  },
  
  /**
   * Makes the form a register form
   */
  setRegister : function(label) {
    this.setValues(false, label || 'Register', 
      '/register/email', 'register-form', 'signin-form', 'email');
  },
  
  /**
   * Makes the form a login form
   */
  setSignin : function(label) {
    this.setValues(true, label || 'Register/Sign In', 
      '/auth', 'signin-form', 'register-form', 'username');
  },
  
  /**
   * Show an error
   */
  showError : function(error) {
    var $div = this.$('div.error-msg');
    if(error) {
      $div.text(error);
      $div.show()
    } else {
      $div.hide();
    }
  },
  
  /**
   * Check if the user exists. If the user exists, set the form
   * to a login form, otherwise, make it a register form.
   */
  checkIfUserExists : function(e) {
    var val = this.$('p.username input').val();
    if(val == '' || val == 'Email Address') {
      return false;
    }
    this.toggle();
    $.ajax({
      url : '/api/users/search',
      type : 'POST',
      data : {
        'email' : this.$('p.username input').val(),
      },
      complete : $.proxy(function() {
        this.toggle();
      }, this),
      error : $.proxy(function() {
        this.setSignin();
      }, this),
      success : $.proxy(function(data) {
        if(data.length == 1) {
          this.setSignin('Sign In');
        } else {
          this.setRegister('Register');
        }
      }, this),
    });
  },
  
  /**
   * If its a login form, do an AJAX login call so that login
   * errors can be shown without a page refresh.
   */
  onSubmit : function(e) {
    this.showError(null);
    if(this.isSignin) {
      e.preventDefault();
      var $form = this.$('form');
      
      $.ajax({
        url : $form.attr('action'),
        type : 'POST',
        dataType : 'json',
        data : $form.serialize(),
        
        error: $.proxy(function(data) {
          this.showError('Please enter a valid email address');
        }, this),
        
        success : $.proxy(function(data) {
          
          if(data.success) {
            window.location.reload(true);
          } else {
            this.showError(data.error);
          }
        }, this)
      })
    }
  },
  
  onForgotClick: function(e) {
    e.preventDefault();
    this.showForgot();
  },
  
  hideForgot: function(e) {
    e.preventDefault();
    this.$('div.main-view').show();
    this.$('div.forgot-view').hide();
  },
  
  showForgot: function() {
    this.$('div.main-view').hide();
    
    this.$('span.forgot-error').text('');
    this.$('form.forgot-form input.email').val('');
    this.$('div.forgot-view .screen-1').show();
    this.$('div.forgot-view .screen-2').hide();
    
    this.$('div.forgot-view').show();
  },
  
  onForgotSubmit: function(e) {
    e.preventDefault();
      var $form = this.$('form.forgot-form');
      var data = $form.serialize();
      $.ajax({
        url : $form.attr('action'),
        type : 'POST',
        dataType : 'json',
        data : data,
        success : $.proxy(function(data) {
          if(data.success) {
            var e = this.$('form.forgot-form input.email').val();
            this.$('span.sent-to').text(e);
            this.$('div.forgot-view .screen-1').hide();
            this.$('div.forgot-view .screen-2').show();
          } else {
            this.showError(data.error);
            this.$('form.forgot-form input.email').val('');
            this.$('span.forgot-error').text('Sorry, that email is not registered with us.');
            this.$('span.forgot-error').delay(3000).fadeOut()
          }
        }, this)
      })
  }
});

window.PopupHolder = new PopupHolderView
window.resizeable.push(PopupHolder);

/**
 * Opens the login popup. 
 */
tools.openLoginPopup = function(message) {
  window.PopupHolder.showPopup(new LoginPopupView({
    model : {
      "message" : message
    }
  }));
}


$(function() {
  $('div.disable-ui').hide();
  $('body').ajaxStart(function() {
    $('div.disable-ui').show();
  }).ajaxStop(function() {
    $('div.disable-ui').hide();
  });
  
  // Open the LoginPopup
  $('a.create-account-btn, a.signin-btn').live('click', function(e) {
    e.preventDefault();
    tools.openLoginPopup();
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

  // Show and hide any flash messages
  $('div.flashes').slideDown().delay(6000).slideUp();

  // Handle focus on any input fields with defaulttext set
  $("input.defaulttext").live('focus', function(e) {
    var input = $(this);
    if(input.val() == input[0].title) {
      input.addClass("active");
      input.val("");
    }
  });

  // Handle blur on any input fields with defaulttext set
  $("input.defaulttext").live('blur', function(e) {
    var input = $(this);
    if(input.val() == "") {
      input.removeClass("active");
      input.val(input[0].title);
    }
  });
  
  // Blur the input fields to set their default text
  $('input.defaulttext').blur();
});


tools.bodyClass('questions-archive', function(){
  $('.category-selector').bind('change', function(e){
    var url = '/questions/archive';
    var val = $(this).attr('value');
    if(val.length > 0) {
      url += '/' + val;
    }
    window.location =   url;
  })
});

tools.bodyClass('suggest-index', function() {
  $('textarea').bind('focus', function(e) {
    $(e.currentTarget).val(''); 
  });
});
