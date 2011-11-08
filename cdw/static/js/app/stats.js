

window.StatsScreenView = Backbone.View.extend({
  tagName: 'div',
  className: 'stats',
  template: _.template($('#stats-screen-template').html()),
  
  events: {
    'click a.close-btn': 'onCloseClick',
  },
  
  initialize: function() {
    console.log('init!');
  },
  
  render: function() {
    $(this.el).html(this.template(this.model.toJSON()));
    return this
  },
  
  onCloseClick: function(e) {
    e.preventDefault();
    this.remove();
  }
  
})
