
$(function(){
  $('form.delete-form button[type=submit]').click(function(e){
    if(confirm("Are you sure you want to delete")) {
      return true
    }
    e.preventDefault();
  });
});

tools.bodyClass('debates-upcoming', function() {
  $("input.datepicker").datepicker({
    minDate:0, 
    maxDate: "+6M",
    dateFormat: 'yy-mm-dd',
    onSelect: function(dateText, inst) {
      $(this).parent().submit();
    }
  })
});
