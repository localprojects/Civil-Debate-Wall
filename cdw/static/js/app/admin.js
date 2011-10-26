

$(function(){
  
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
