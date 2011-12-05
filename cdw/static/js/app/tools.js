if(!window.tools){ window.tools = {}; }

tools.notImplemented = function() {
  alert('Not yet implemented');
}
/**
 * Run the JavaScript function within the context of a page
 * with the specific CSS class name.
 */
tools.bodyClass = tools.bodyClasses = function(klasses, fn){
  if(klasses.indexOf(' ') >= 0){
    klasses = klasses.split(/\s+/);
  }
  $(function(){
    var $body = $('body');
    if(klasses.join){
      if($body.is('.' + klasses.join(',.'))){ fn(); }
    }else{
      if($body.hasClass(klasses)){ fn(); }
    }
  });
};

// Keep track of resizable views
if(!window.resizeable){ window.resizeable = []; } 

tools.manualResize = function() {
  //var hW = $(window).width() / 2;
  //var dLeft = Math.round(hW - 275);
  //$('div.responses-outer').css({ left:dLeft });
}

tools.resizeElements = function(e) {
  tools.manualResize();
  for(var i = 0; i < window.resizeable.length; i++) {
    try { 
      window.resizeable[i].onResize(); 
    } catch(e) { } 
  }
}

// Setup listener to resize registered views
$(window).resize(function(e) {
  tools.resizeElements();
});
tools.resizeElements();


userPhotoPostError = function() {
  //console.log('userPhotoPostError');
}

userPhotoPostComplete = function() {
  window.PopupHolder.closePopup();
  window.location.reload(true);
}

userPhotoNoWebCam = function() {
  window.PopupHolder.closePopup();
  alert("Sorry but it looks as if you don't have a webcam.");
}

window.PhotoBoothView = Backbone.View.extend({
  tagName: 'div',
  className: 'popup photo-booth',
  template: _.template($('#photo-booth-template').html()),
  
  render: function() {
    $(this.el).html(this.template());
    return this;
  }
});

window.VerifyPhoneView = Backbone.View.extend({
  el: $('div.verify-view'),
  
  events: {
    'submit form.phone': 'onPhoneSubmit',
    'submit form.code': 'onCodeSubmit',
    'click a.cancel-verify': 'onCancelClick',
  },
  
  initialize: function() {
    
    this.$phoneView = this.$('div.verify-phone');
    this.$phoneForm = this.$('form.phone');
    this.$codeView = this.$('div.verify-code');
    this.$codeForm = this.$('form.code');
    this.phoneNumber = this.$('input[name=phonenumber]').val();
    this.setPhoneNumber(this.phoneNumber);
    
    $('.phone3, .phone4').bind('keyup keydown blur', function(e) {
      $('form input[name=phonenumber]').val(
        $('input[name=areacode]').val() +
        $('input[name=firstthree]').val() +
        $('input[name=lastfour]').val()
      );
    });
    
    this.showPhoneView();
    this.$('.verify-msg').hide();
  },
  
  setPhoneNumber: function(phoneNumber) {
    $('input[name=areacode]').val(phoneNumber.substr(0, 3));
    $('input[name=firstthree]').val(phoneNumber.substr(3, 3));
    $('input[name=lastfour]').val(phoneNumber.substr(6, 4));
  },
  
  onPhoneSubmit: function(e) {
    e.preventDefault();
    
    $.ajax({
      url: this.$phoneForm.attr('action'),
      data: this.$phoneForm.serialize(),
      type: 'POST',
      error: $.proxy(function(e, xhr) {
        $('div.disable-ui').hide();
        this.showMessage('Invalid phone number. Try again.');
      }, this),
      
      success: $.proxy(function(data) {
        this.showVerifyView();
      }, this),
    });
  },
  
  onCodeSubmit: function(e) {
    e.preventDefault();
    $.ajax({
      url: this.$codeForm.attr('action'),
      data: this.$codeForm.serialize(),
      type: 'POST',
      complete: $.proxy(function(data) {
        $('input[name=code]').val('');
      }, this),
      
      error: $.proxy(function(e, xhr) {
        this.showMessage('No match. Try again.');
      }, this),
      
      success: $.proxy(function(data) {
        this.showMessage('Success!');
        this.showPhoneView();
      }, this),
    })
  },
  
  onCancelClick: function(e) {
    e.preventDefault();
    this.showPhoneView();
    this.setPhoneNumber(this.phoneNumber);
  },
  
  showPhoneView: function() {
    this.$phoneView.show();
    this.$codeView.hide();
  },
  
  showVerifyView: function() {
    this.$phoneView.hide();
    this.$codeView.show();
  },
  
  showMessage: function(msg) {
    this.$('.verify-msg')
      .stop(true, true)
      .text(msg)
      .show().delay(3000).fadeOut();
  },
  
});

window.RegisterView = Backbone.View.extend({
  el: $('div.register-view'),
  
  events: {
    'keyup input.username': 'updateCharsLeft',
    'keydown input.username': 'updateCharsLeft',
    'blur input.username': 'updateCharsLeft',
    'click button.finish-btn': 'onFinishClick',
  },
  
  initialize: function() {
    this.$usernameInput = this.$('input.username');
    this.updateCharsLeft();
  },
  
  updateCharsLeft: function(e) {
    if(this.$usernameInput.val().length > 18) {
      this.$usernameInput
        .val(this.$usernameInput.val().slice(0, 18));
    }
    this.$('span.chars-left')
      .text(18 - this.$usernameInput.val().length)
  },
  
  onFinishClick: function(e) {
    this.$('form.register').submit();
  }
  
});

$(function() {
  $('a.photo-booth').click(function(e) {
    e.preventDefault();
    window.PopupHolder.showPopup(new PhotoBoothView, 550);
    var flashVars = {
      postUrl: "/profile/photo",
      postField: "photo",
      captureWidth: 867,
      captureHeight: 650,
      previewWidth: 530,
      previewHeight: 398,
      outputWidth: 867,
      outputHeight: 650,
      fps: 24,
      cropX: 184,
      cropY: 0,
      cropWidth: 550,
      cropHeight: 650,
      cropOverlayColor: '0x000000',
      cropOverlayAlpha: 0.75,
      postPhotoErrorFunction: "userPhotoPostError",
      postPhotoCompleteFunction: "userPhotoPostComplete",
    }
    swfobject.embedSWF("/static/swf/photo-booth.swf", "photo-booth-flash", "550", "450", "10", null, flashVars);
  });
  
  tools.bodyClass('register', function() {
    window.VerifyPhone = new VerifyPhoneView;
    window.Register = new RegisterView;
    
  });
});