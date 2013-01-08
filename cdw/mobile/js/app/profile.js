/*--------------------------------------------------------------------
  Copyright (c) 2011 Local Projects. All rights reserved.
  License: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
 --------------------------------------------------------------------*/

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

$(function() {
  tools.bodyClass('profile-index', function() {
    window.Profile = new ProfileView;
  });
  
  tools.bodyClass('profile-edit',function() {
    window.VerifyPhone = new VerifyPhoneView;
  });
});
