   
/**
 * -------------------
 * Views
 * -------------------
 */
window.ReplyPopupView = Backbone.View.extend({
  tagName: 'div',
  className: 'popup reply-popup',
  template: _.template($('#reply-popup-template').html()),
  events: {
    'submit form': 'onSubmit'
  },
  initialize: function() {
    this.currentStep = 0
  },
  render: function() {
    var data = {}
    data.qid = models.currentQuestion.id;
    data.did = models.currentDebate.id;
    $(this.el).html(this.template(data));
    return this;
  },
  onSubmit: function(e) {
    e.preventDefault();
    var $form = this.$('form');
    var $textarea = this.$('textarea');
    $.ajax({
      url: $form.attr('action'), type: $form.attr('method'),
      data: $form.serialize(),
      dataType: 'json',
      complete: $.proxy(function(data) {
        
      }, this),
      error: $.proxy(function(e, xhr) {
        var d = $.parseJSON(e.responseText);
        $textarea.val('');
        window.alert(d.error);
      }, this),
      success: $.proxy(function(data) {
        window.PopupHolder.closePopup();
        models.currentPosts.add(data);
        models.currentDebate.get('posts').push(data);
        models.currentDebate.change();
      }, this),
    });
  }
})

window.ResponseItemView = Backbone.View.extend({
  tagName: 'div',
  className: 'response-item',
  template: _.template($('#responses-item-template').html()),
  events: {
    'click a.reply-btn': 'onReplyClick'
  },
  render: function() {
    $(this.el).html(this.template(this.model.toJSON()));
    return this;
  },
  onReplyClick: function(e) {
    e.preventDefault();
    window.PopupHolder.showPopup(new ReplyPopupView);
  }
});

window.ResponsesView = Backbone.View.extend({
  tagName: 'div',
  className: 'responses',
  template: _.template($('#responses-template').html()),
  
  initialize: function() {
    this.model.bind('add', $.proxy(this.onAdd, this));
  },
  
  render: function() {
    var data = this.model.toJSON();
    data.qid = models.currentQuestion.id;
    data.did = models.currentDebate.id;
    $(this.el).html(this.template(data));
    this.addAll();
    return this;
  },
  
  onAdd: function(post) {
    this.addOne(post);
  },
  
  addAll: function() {
    this.model.each(this.addOne, this);
  },
  
  addOne: function(item, index, append) {
    var view = new ResponseItemView({model:item}); // Create view
    this.$('ul')[(append)?'append':'prepend'](view.render().el); // Add to DOM
  },
  
  onResize: function(e) {
    var hW = $(window).width() / 2; // Half window
    var dLeft = Math.round(hW - $('div.responses').width() / 2);
    $('div.responses').css({ left:dLeft }); // Move the overlay
  }
});

window.DebateDetailView = Backbone.View.extend({
  tagName: 'div',
  template: _.template($('#debate-detail-template').html()),
  
  initialize: function() {
    models.currentDebate.bind('change', $.proxy(this.onAddResponse, this));
  },
  
  render: function() {
    var data = this.model.toJSON();
    data.question = models.currentQuestion.attributes;
    $(this.el).html(this.template(data));
    return this;
  },
  
  onAddResponse: function(post) {
    this.$('span.response-amt').text(this.model.get('posts').length - 1);
  }
  
});

window.GalleryItemView = Backbone.View.extend({
  tagName: 'li',
  className: 'unselected',
  template: _.template($('#gallery-item-template').html()),
  
  render: function() {
    var data = this.model.toJSON();
    data.qid = models.currentQuestion.id;
    $(this.el).html(this.template(data));
    return this;
  },
});

window.GalleryView = Backbone.View.extend({
  
  el: $('div.debates-gallery'),
  
  initialize: function() {
    this.model.bind('reset', this.addAll, this); // Bind to model event
    this.$overlay = this.$('.overlay-container'); // Question and filter overlay
    this.$container = this.$('div.gallery-container'); // Gallery container
    this.$detail = this.$('div.detail');
    this.$ul = this.$('ul'); // Gallery <ul> element
    this.onResize(); // Manual resize on init
  },
  
  addAll: function() {
    this.selectedIndex = -1;
    this.gWidth = 0;
    this.items = [];
    this.model.each(this.addOne, this);
  },
  
  addOne: function(item, index) {
    var view = new GalleryItemView({model:item}); // Create view
    //var c = "#" + Math.floor(Math.random()*16777215).toString(16); // Random color
    $(view.el).css({ left:this.gWidth }); // Set left position
    this.$ul.append(view.render().el); // Add to DOM
    this.gWidth += $(view.el).width(); // Update total width
    this.$ul.width(this.gWidth); // Set <ul> width
    this.gWidth += 10;
    this.items.push(view);
  },
  
  setSelection: function(id, animate) {
    // Remove stuff that might be there
    try { window.Responses.remove() } catch(e) { }
    //$('div.content').height($('div.debates-gallery').height());
    
    // Get the item and index
    var item = this.model.getById(id);
    var index = this.model.indexOf(item);
    if(index == this.selectedIndex) return;
    
    try { this.detailView.remove() } catch(e) { }
    this.$overlay.show();
    // Set current selection
    this.selectedIndex = index;
    this.$selectedItem = $(this.$ul.children()[index]);
    
    // Show stuff that should be shown
    this.dLeft = -parseInt(this.$selectedItem.css('left'));
    this.detailView = new DebateDetailView( { model: models.currentDebate });
    this.detailView.render();
    
    if(animate) {
      this.$ul.stop().animate({'left': this.dLeft}, {
        complete: $.proxy(function(e) { 
          this.$detail.append($(this.detailView.el).show());
        }, this)
      });
    } else {
      this.$ul.css({left: this.dLeft });
      this.$detail.append(this.detailView.render().el);
    }
  },
  
  onResize: function(e) {
    var hW = $(window).width() / 2;
    var hI = (this.$selectedItem) ? this.$selectedItem.width() / 2 : 250;
    this.$container.css({ left:Math.round(hW - hI) });
    this.$overlay.css({ left: Math.round(hW - this.$overlay.width() / 2) });
  }
});

window.HomeView = Backbone.View.extend({
  el: $('body.home-index'),
  
  initialize: function() {
    this.model.bind('change', this.render, this);
  },
});


/**
 * -------------------
 * MODELS
 * -------------------
 */ 
window.Question = Backbone.Model.extend({
  urlRoot: '/api/questions',
});

window.Debate = Backbone.Model.extend({
  urlRoot: '/api/threads',
});

window.Post = Backbone.Model.extend({
  urlRoot: '/api/posts'
})

window.DebateList = Backbone.Collection.extend({
  model: Debate,
  getById: function(id) {
    for(var i = 0; i < this.length; i++) {
      var item = this.at(i);
      if(item.get('id') == id) return item 
    }
    return null;
  }
});

window.PostList = Backbone.Collection.extend({
  model: Post
});

window.GalleryItem = Backbone.Model.extend({
  
});

window.GalleryItemList = Backbone.Collection.extend({
  model: GalleryItem
});

// Models namespace for reference at any time
window.models = {}
models.currentQuestion = new Question
models.currentDebates = new DebateList
models.currentDebate = new Debate
models.currentPosts = new PostList


/**
 * -------------------
 * ROUTER
 * -------------------
 */
var WorkspaceRouter = Backbone.Router.extend({
  
  routes: {
    '':                                     'home',
    '/questions/:qid':                      'questions',
    '/questions/:qid/debates/':             'questions',
    '/questions/:qid/debates/:did':         'debates',
    '/questions/:qid/debates/:did/posts':   'posts',
  },
  
  home: function() {
    window.Home = new HomeView({ 
      model: models.currentQuestion 
    });
    this.questions("current");
  },
  
  questions: function(qid, did, animate, showposts) {
    models.currentQuestion.id = qid;
    models.currentQuestion.fetch({
      success: function(data) {
        models.currentQuestion.id = data.id;
        models.currentDebates = new DebateList;
        models.currentDebates.url = '/api/questions/' + data.id + '/threads';
        
        window.Gallery = new GalleryView({ model:models.currentDebates }); // Create gallery view
        window.resizeable.push(Gallery); // It's resizeable
        
        models.currentDebates.fetch({
          success: function(data) {
            var debateId = (did == null) ? models.currentDebates.at(0).get('id') : did;
            window.router.debates(models.currentQuestion.id, debateId, animate, showposts);
          }
        });
      }
    });
  },
  
  debates: function(qid, did, animate, showposts) {
    if(models.currentQuestion.id != qid) {
      window.router.questions(qid, did, false, showposts);
    } else {
      function showDebate(did, animate, showposts) {
        Gallery.setSelection(did, (animate == null) ? true : animate);
        if(showposts) window.router.posts(qid, did);
      }
      
      if(did != models.currentDebate.id) {
        models.currentDebate.id = did;
        models.currentDebate.fetch({
          success: function(data) {
            showDebate(did, animate, showposts);
          }
        })
      } else {
        showDebate(did, animate, showposts);
      }
    }
  },
  
  posts: function(qid, did) {
    if(models.currentQuestion.id != qid) {
      window.router.debates(qid, did, false, true);
    } else {
      models.currentPosts = new PostList(models.currentDebate.get('posts'));
      window.Responses = new ResponsesView({ model: models.currentPosts });
      $('div.responses-outer').append($(Responses.render().el).show());
      $('div.content').height($('div.responses').height());
      window.resizeable.push(Responses);
      Responses.onResize();
    }
  },
  
});

$(function(){
  window.router = new WorkspaceRouter();
  Backbone.history.start();
});