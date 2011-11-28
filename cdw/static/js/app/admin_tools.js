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