
userPhotoPostError = function() {
  console.log('userPhotoPostError');
}

userPhotoPostComplete = function() {
  window.PopupHolder.closePopup();
  window.location.reload(true);
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

window.ProfileView = Backbone.View.extend({
  el: $('div.profile-view'),
  
  events: {
    'click a.recent-activity': 'onBtnClick',
    'click a.my-debates': 'onBtnClick',
  },
  
  initialize: function() {
    this.$('div.panel').hide();
    this.select(this.$('a.recent-activity'));
  },
  
  select: function($btn) {
    if(this.$selected) {
      this.$selected.toggleClass('selected');
      var selector = 'div.' + this.$selected.attr('class');
      this.$(selector).hide();
    }
    this.$('div.' + $btn.attr('class')).show();
    this.$selected = $btn;
    this.$selected.toggleClass('selected');
  },
  
  onBtnClick: function(e) {
    e.preventDefault();
    this.select($(e.currentTarget));
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
  
})


$(function() {
  $('a.photo-booth').click(function(e) {
    e.preventDefault();
    window.PopupHolder.showPopup(new PhotoBoothView, 600);
    var flashVars = {
      postUrl: "/profile/photo",
      postField: "photo",
      captureWidth: 867,
      captureHeight: 650,
      previewWidth: 480,
      previewHeight: 360,
      outputWidth: 867,
      outputHeight: 650,
      fps: 24,
      cropX: 184,
      cropY: 0,
      cropWidth: 500,
      cropHeight: 650,
      cropOverlayColor: '0x000000',
      cropOverlayAlpha: 0.75,
      postPhotoErrorFunction: "userPhotoPostError",
      postPhotoCompleteFunction: "userPhotoPostComplete",
    }
    swfobject.embedSWF("/static/swf/photo-booth.swf", "photo-booth-flash", "600", "500", "10", null, flashVars);
  });
  
  tools.bodyClass('profile-index', function() {
    window.Profile = new ProfileView;
  });
  
  tools.bodyClass('profile-edit',function() {
    window.VerifyPhone = new VerifyPhoneView;
  });
  
});
