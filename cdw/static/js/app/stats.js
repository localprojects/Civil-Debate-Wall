/*--------------------------------------------------------------------
  Copyright (c) 2011 Local Projects. All rights reserved.
  See LICENSE for more details.
 --------------------------------------------------------------------*/

if(window.models === undefined) {
  window.models = {}
}
/*
models.MostDebatedList = Backbone.Collection.extend({
  
})
*/
window.StatsScreenView = Backbone.View.extend({
  tagName: 'div',
  className: 'stats-view',
  template: _.template($('#stats-screen-template').html()),
  
  events: {
    'click a.close-btn': 'onCloseClick'
  },
  
  initialize: function() {
    $('div.stats-outer').append($(this.render().el));
    
    
    var data = this.model.toJSON();
    
    window.StatsMostDebated = 
      new StatsMostDebatedView({
        el: $('div.most-debated'), 
        model: new Backbone.Collection(data.mostDebatedOpinions) 
      });
      
    window.StatsMostLiked = 
      new StatsMostLikedView({
        el: $('div.most-liked'), 
        model: new Backbone.Collection(data.mostLikedOpinions) 
      });
      
    window.StatsFrequentWords = 
      new StatsFrequentWordsView({
        el: $('div.frequent-words'),
        model: new Backbone.Collection(data.frequentWords)
      });
    
    this.$('div.screen').hide();
    this.gotoScreen('screen-1');
  },
  
  render: function() {
    var data = this.model.toJSON();
    $(this.el).html(this.template(data));
    
    var totalAnswers = data.debateTotals.yes + data.debateTotals.no;
    var yesWidth = Math.max(20, Math.min(80,
      Math.floor(100 * (data.debateTotals.yes / totalAnswers))));
    var noWidth = 100 - yesWidth;
    
    this.$('div.opinions-bar .yes-bar').css({width: yesWidth + '%'});
    this.$('div.opinions-bar .no-bar').css({ width: noWidth + '%' });
    
    if(yesWidth <= noWidth) {
      this.$('div.yes-bar img').hide();
    }
    if(noWidth <= yesWidth) {
      this.$('div.no-bar img').hide();
    }
    
    this.$('ul.stats-menu a').click($.proxy(function(e) {
      e.preventDefault();
      this.gotoScreen($(e.currentTarget).attr('class'));
    }, this));
    
    return this
  },
  
  onNav: function(e) {
    e.preventDefault();
    this.gotoScreen($(e.currentTarget).attr('class'));
  },
  
  onCloseClick: function(e) {
    e.preventDefault();
    this.remove();
  },
  
  gotoScreen: function(screen) {
    if(this.$currentScreen) {
      this.$currentScreen.hide();
      this.$('ul.stats-menu li.' + this.currentScreen).toggleClass('selected');
    } 
    this.currentScreen = screen;
    this.$currentScreen = this.$('div.' + screen);
    this.$('ul.stats-menu li.' + screen).toggleClass('selected');
    this.$currentScreen.show();
  }
  
});

window.StatsMostDebatedDetailView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#stats-most-debated-detail-template').html()),
  
  events: {
    'click a.reply-btn': 'onReplyClick'
  },
  
  render: function() {
    var data = this.model.toJSON();
    data.qid = models.currentQuestion.id;
    data.raggedText = tools.ragText(data.firstPost.text, 40);
    $(this.el).html(this.template(data));
    $(this.el).addClass('item-' + this.model.get('rank'));
    var yesNo = (data.firstPost.yesNo == 0) ? 'no' : 'yes';
    
    if(this.$('div.rag div').length == 1) {
      this.$('div.rag div').css('padding-top', 6);
    }
    
    $(this.el).addClass(yesNo);
    return this;
  },
  
  onReplyClick: function(e) {
    e.preventDefault();
    commands.showReplyScreen(new Post(this.model.get('firstPost')), true);
  },
  
  adjustRag: function() {
    this.$('debate-this').css('bottom', this.$('div.body').height() - 66);
  }
});

window.StatsMostDebatedMenuView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#stats-most-debated-menu-template').html()),
  
  render: function() {
    var data = this.model.toJSON();
    data.qid = models.currentQuestion.id;
    var selector = 'item-' + this.model.get('rank');
    $(this.el).html(this.template(data));
    $(this.el).addClass(selector);
    $(this.el).data('selector', selector);
    return this;
  }
});

window.StatsMostLikedDetailView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#stats-most-liked-detail-template').html()),
  
  events: {
    'click a.reply-btn': 'onReplyClick'
  },
  
  render: function() {
    var data = this.model.toJSON();
    data.qid = models.currentQuestion.id;
    data.raggedText = tools.ragText(data.firstPost.text, 40);
    $(this.el).html(this.template(data));
    $(this.el).addClass('item-' + this.model.get('rank'));
    
    if(this.$('div.rag div').length == 1) {
      this.$('div.rag div').css('padding-top', 6);
    }
    
    var yesNo = (data.firstPost.yesNo == 0) ? 'no' : 'yes'
    $(this.el).addClass(yesNo);
    return this;
  },
  
  onReplyClick: function(e) {
    e.preventDefault();
    commands.showReplyScreen(new Post(this.model.get('firstPost')), true);
  },
  
  adjustRag: function() {
    this.$('debate-this').css('bottom', this.$('div.body').height() - 66);
  }
});

window.StatsMostLikedMenuView = Backbone.View.extend({
  tagName: 'li',
  template: _.template($('#stats-most-liked-menu-template').html()),
  
  render: function() {
    var data = this.model.toJSON();
    data.qid = models.currentQuestion.id;
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
    this.$('div.menu-view li').mouseover($.proxy(function(e) {
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
    view.adjustRag();
    
    view = new StatsMostDebatedMenuView({model:item});
    this.$('div.menu-view ul').append(view.render().el);
  },
  
  setSelection: function(itemSelector) {
    if(this.currentSelector == itemSelector) return;
    
    if(this.$currentSelection) {
      var item = this.model.at(this.currentIndex)
      var yesNo = (item.get('firstPost').yesNo == 0) ? 'no' : 'yes';
      $('p.specified', this.$currentSelection).css('text-decoration', 'none');
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
    $('p.specified', this.$currentSelection).css('text-decoration', 'underline');
    this.$('div.detail-view li.' + this.currentSelector).show();
  }
  
});

window.StatsMostLikedView = Backbone.View.extend({
  
  initialize: function() {
    this.addAll();
    this.$('div.detail-view li').hide();
    this.$('div.menu-view li').mouseover($.proxy(function(e) {
      this.setSelection($(e.currentTarget).data('selector'));
    }, this));
    this.setSelection('item-1');
  },
  
  addAll: function() {
    this.model.each(this.addOne, this);
  },
  
  addOne: function(item, index) {
    item.set({rank:index + 1});
    
    var view = new StatsMostLikedDetailView({model:item});
    this.$('div.detail-view ul').append(view.render().el);
    
    view = new StatsMostLikedMenuView({model:item});
    this.$('div.menu-view ul').append(view.render().el);
  },
  
  setSelection: function(itemSelector) {
    if(this.currentSelector == itemSelector) return;
    
    if(this.$currentSelection) {
      var item = this.model.at(this.currentIndex)
      var yesNo = (item.get('firstPost').yesNo == 0) ? 'no' : 'yes';
      this.$currentSelection.removeClass('selected-' + yesNo)
      $('p.specified', this.$currentSelection).css('text-decoration', 'none');
      this.$('div.detail-view li.' + this.currentSelector).hide();
    }
    
    var index = itemSelector.charAt(itemSelector.length - 1)
    this.currentSelector = itemSelector;
    this.currentIndex = index - 1;
    
    var item = this.model.at(this.currentIndex);
    var yesNo = (item.get('firstPost').yesNo == 0) ? 'no' : 'yes';
    this.$currentSelection = this.$('div.menu-view li.' + this.currentSelector);
    this.$currentSelection.addClass('selected-' + yesNo);
    $('p.specified', this.$currentSelection).css('text-decoration', 'underline');
    this.$('div.detail-view li.' + this.currentSelector).show();
  }
  
});

window.StatsFrequentWordsView = Backbone.View.extend({
  
  events: {
    'click a.back-btn': 'showWordMenu'
  },
  
  initialize: function() {
    this.detailPosts = [];
    this.render();  
  },
  
  render: function() {
    this.dRow = 0;
    this.allButtons = [];
    this.model.each(this.addWordBtn, this);
    
    $.each($('div.word-row'), function(index, item){
      // Adjust the top position of each row
      var $item = $(item);
      $item.css('top', index * 66);
      
      // Adjust the width of each row to be that of its buttons
      var width = 0;
      $.each($('button', item), function(i, btn) {
        width += $(btn).outerWidth();
      });
      $item.width(width+60);
      
    });
    
    this.$('button')
      .click($.proxy(function(e) {
        e.preventDefault();
        this.showWordDetail($(e.currentTarget).data('index'));
      }, this))
      .mouseover($.proxy(function(e) {
        e.preventDefault();
        var index = $(e.currentTarget).data('index');
        for(var i=0; i < this.allButtons.length; i++) {
          if(index != i) {
            this.allButtons[i].css('opacity', 0.5);
          }
        }
      }, this))
      .mouseout($.proxy(function(e) {
        e.preventDefault();
        for(var i=0; i < this.allButtons.length; i++) {
          this.allButtons[i].css('opacity', 1);
        }
      }, this));
      
    this.$('div.word-detail').hide();      
    
    return this;
  },
  
  addWordBtn: function(item, index) {
    // Get a color based on the ratio
    var colors = ['#68b7fd', '#5191d5', '#457ec1', '#3767a9', '#3a546c',
                  '#3f3c4d', '#6c4434', '#8a4d29', '#c8611d', '#e0681c']
    var cIndex = 9 - Math.round(item.get('ratio') * 9);
    
    // Create button
    var $btn = $('<button class="word-btn">' + item.get('word') + '</button>');
    $btn.css('background-color', colors[cIndex]);
    $btn.data('index', index);
    
    // Add it to the appropriate row
    var $row = $(this.$('div.word-row')[this.dRow]);
    $row.append($btn);
    
    // Increment the next row
    this.dRow = (this.dRow == 3) ? 0 : this.dRow + 1;
    
    this.allButtons.push($btn);
  },
  
  showWordMenu: function(e) {
    e.preventDefault();
    
    _.each(this.detailPosts, function(item) {item.remove() });
    this.detailPosts = [];
    
    this.$('div.word-detail').hide();
    this.$('div.word-menu').show();
    
    $(this.el).height(354);
    $('div.content-inner').height(800);
  },
  
  showWordDetail: function(index) {
    
    this.$('div.word-menu').hide();
    this.$('div.word-detail').show();
    
    var model = this.model.at(index);
    
    var posts = model.get('posts');
    for(var i=0; i < posts.length; i++) {
      var view = new ResponseItemView({ 
        model: new Backbone.Model(posts[i]), 
        showResponseButton: true, 
        fromStats: true, 
        highlightedWord: model.get('word') 
      });
      this.detailPosts.push(view);
      this.$('div.responses-list').append(view.render().el);
    }
    
    var colors = ['#68b7fd', '#5191d5', '#457ec1', '#3767a9', '#3a546c',
                  '#3f3c4d', '#6c4434', '#8a4d29', '#c8611d', '#e0681c']
    var cIndex = 9 - Math.round(model.get('ratio') * 9);
    
    var $span = this.$('div.the-word span');
    $span.text(model.get('word')).css('background-color', colors[cIndex]);
    
    this.$('p.the-word').text(model.get('word'));
    
    $(this.el).height(Math.max(354, $('div.responses-list').height()));
    
    commands.refreshStatsHeight();
    
  }
  
});
