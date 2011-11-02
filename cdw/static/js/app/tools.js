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

manualResize = function() {
  var hW = $(window).width() / 2;
  var dLeft = Math.round(hW - 275);
  $('div.responses-outer').css({ left:dLeft });
}

// Setup listener to resize registered views
$(window).resize(function(e) {
  manualResize();
  for(var i = 0; i < window.resizeable.length; i++) {
    try { 
      window.resizeable[i].onResize(); 
    } catch(e) { } 
  }
});

manualResize();
