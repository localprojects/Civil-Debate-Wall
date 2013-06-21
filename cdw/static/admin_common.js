if(!window.tools){window.tools={};}
tools.notImplemented=function(){alert('Not yet implemented');}
tools.bodyClass=tools.bodyClasses=function(klasses,fn){if(klasses.indexOf(' ')>=0){klasses=klasses.split(/\s+/);}
$(function(){var $body=$('body');if(klasses.join){if($body.is('.'+klasses.join(',.'))){fn();}}else{if($body.hasClass(klasses)){fn();}}});};$(function(){$('form.delete-form button[type=submit]').click(function(e){if(confirm("Are you sure you want to delete this item? This cannot be undone.")){return true}
e.preventDefault();});$('form.archive-form button[type=submit]').click(function(e){if(confirm("Are you sure you want to archive this item? This cannot be undone.")){return true}
e.preventDefault();});});