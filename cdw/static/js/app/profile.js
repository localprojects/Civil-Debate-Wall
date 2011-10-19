window.PhotoBoothView = Backbone.View.extend({
  tagName: 'div',
  className: 'popup photo-booth',
  template: _.template($('#photo-booth-template').html()),
  
  render: function() {
    $(this.el).html(this.template());
    return this;
  }
})

userPhotoPostError = function() {
  console.log('userPhotoPostError');
}

userPhotoPostComplete = function() {
  window.PopupHolder.closePopup();
  window.location.reload(true);
}

$(function() {
  $('div.profile-col1 a').click(function(e) {
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
});