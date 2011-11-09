if(window.models === undefined) {
  window.models = {}
}

models.MostDebatedList = Backbone.Collection.extend({
  
})

window.StatsScreenView = Backbone.View.extend({
  tagName: 'div',
  className: 'stats-view',
  template: _.template($('#stats-screen-template').html()),
  
  events: {
    'click a.close-btn': 'onCloseClick',
    'change select.navigator': 'onNav',
  },
  
  initialize: function() {
    $('div.stats-outer').append($(this.render().el));
    
    this.$('div.screen').hide();
    
    var data = this.model.toJSON();
    
    window.StatsMostDebated = 
      new StatsMostDebatedView({
        el: $('div.most-debated'), 
        model: new models.MostDebatedList(data.mostDebatedOpinions) 
      });
      
    this.gotoScreen('screen-1');
  },
  
  render: function() {
    var data = this.model.toJSON();
    $(this.el).html(this.template(data));
    
    var totalAnswers = data.debateTotals.yes + data.debateTotals.no;
    var yesWidth = Math.floor(100 * (data.debateTotals.yes / totalAnswers));
    var noWidth = 100 - yesWidth;
    
    this.$('div.opinions-bar .yes-bar').css({width: yesWidth + '%'});
    this.$('div.opinions-bar .no-bar').css({ width: noWidth + '%' });
    
    if(yesWidth <= noWidth) {
      this.$('div.yes-bar img').hide();
    }
    if(noWidth <= yesWidth) {
      this.$('div.no-bar img').hide();
    }
      
    return this
  },
  
  onNav: function(e) {
    this.gotoScreen($(e.currentTarget).val());
  },
  
  onCloseClick: function(e) {
    e.preventDefault();
    this.remove();
  },
  
  gotoScreen: function(screen) {
    console.log(screen);
    if(this.$currentScreen) this.$currentScreen.hide();
    this.$currentScreen = this.$('div.' + screen);
    this.$currentScreen.show();
  },
  
})

window.StatsMostDebatedDetailView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#stats-most-debated-detail-template').html()),
  
  render: function() {
    var data = this.model.toJSON();
    data.qid = models.currentQuestion.id;
    data.raggedText = tools.ragText(data.firstPost.text, 40);
    $(this.el).html(this.template(data));
    $(this.el).addClass('item-' + this.model.get('rank'));
    var yesNo = (data.firstPost.yesNo == 0) ? 'no' : 'yes'
    $(this.el).addClass(yesNo);
    return this;
  }
});

window.StatsMostDebatedMenuView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#stats-most-debated-menu-template').html()),
  
  render: function() {
    var data = this.model.toJSON();
    var selector = 'item-' + this.model.get('rank');
    $(this.el).html(this.template(data));
    $(this.el).addClass(selector);
    $(this.el).data('selector', selector);
    return this;
  }
});

window.StatsMostDebatedView = Backbone.View.extend({
  
  initialize: function() {
    this.addAll();
    this.$('div.detail-view li').hide();
    this.$('div.menu-view li').click($.proxy(function(e) {
      this.setSelection($(e.currentTarget).data('selector'));
    }, this));
    this.setSelection('item-1');
  },
  
  addAll: function() {
    this.model.each(this.addOne, this);
  },
  
  addOne: function(item, index) {
    item.set({rank:index + 1});
    
    var view = new StatsMostDebatedDetailView({model:item});
    this.$('div.detail-view ul').append(view.render().el);
    
    view = new StatsMostDebatedMenuView({model:item});
    this.$('div.menu-view ul').append(view.render().el);
  },
  
  setSelection: function(itemSelector) {
    if(this.currentSelector == itemSelector) return;
    
    if(this.$currentSelection) {
      var item = this.model.at(this.currentIndex)
      var yesNo = (item.get('firstPost').yesNo == 0) ? 'no' : 'yes';
      this.$currentSelection.removeClass('selected-' + yesNo)
      this.$('div.detail-view li.' + this.currentSelector).hide();
    }
    
    var index = itemSelector.charAt(itemSelector.length - 1)
    this.currentSelector = itemSelector;
    this.currentIndex = index - 1;
    
    var item = this.model.at(this.currentIndex);
    var yesNo = (item.get('firstPost').yesNo == 0) ? 'no' : 'yes';
    this.$currentSelection = this.$('div.menu-view li.' + this.currentSelector);
    this.$currentSelection.addClass('selected-' + yesNo)
    this.$('div.detail-view li.' + this.currentSelector).show();
  },
  
})
