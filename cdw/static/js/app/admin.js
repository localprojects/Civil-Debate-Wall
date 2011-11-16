
$(function(){
  $('form.delete-form button[type=submit]').click(function(e){
    if(confirm("Are you sure you want to delete this item? This cannot be undone.")) {
      return true
    }
    e.preventDefault();
  });
  
  $('form.archive-form button[type=submit]').click(function(e){
    if(confirm("Are you sure you want to archive this item? This cannot be undone.")) {
      return true
    }
    e.preventDefault();
  });
});