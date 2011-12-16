/**
 * Shared methods
 */

/**
 * Generates HTML for the nice ragged text treatment.
 */
tools.insertNthChar = function(string,chr,nth) {
  var output = '';
  var i = 0;
  for(i; i<string.length; i++) {
    if (i>0 && i%nth == 0)
      output += chr;
    output += string.charAt(i);
  }

  return output;
};

tools.ragText = function(text, maxChars) {
  var formattedText = ''
  var first = true;
  textArr = text.split(' ');
  if(textArr[0].length > maxChars) {
    text = tools.insertNthChar(text, " ", maxChars - 13);
  }
  
  while(text.length > 0) {
    var q1 = (first) ? '“' : '';
    lineBreak = this.getNextLine(text, maxChars);
    formattedText += '<div>' + q1 + $.trim(text.substr(0, lineBreak));
    text = text.substring(lineBreak, text.length);
    var q2 = (text.length == 0) ? '”' : '';
    formattedText += q2 + "</div>";
    first = false;
  }
  return formattedText;
};

/**
 * Get's the next line in the ragged text treatment. Set the
 * maxChars variable to an appropriate amount if the width,
 * padding, or margins of the panel change at all.
 */
tools.getNextLine = function(text, maxChars) {
  if(text.length <= maxChars) {
    return (text == " ") ? 0 : text.length;
  }
  
  var spaceLeft = maxChars;
  for(var i = maxChars; i > 0; i--) {
    if(text.charAt(i) == " ") {
      spaceLeft = maxChars - i;
      break;
    }
  }
  
  return maxChars - spaceLeft;
};
  
window.SpinnerView = Backbone.View.extend({
  tagName: 'div',
  className : 'popup spinner-popup',
  template: _.template($('#spinner-popup-template').html()),
  
  render: function() {
    $(this.el).html(this.template());
    return this;
  }
});


window.BrowseMenuItemView = Backbone.View.extend({
  tagName: 'div',
  className: 'browse-menu-item',
  template: _.template($('#browse-menu-item-template').html()),
  
  render: function() {
    var data = this.model.toJSON();
    data.qid = models.currentQuestion.id;
    data.answer = (data.firstPost.yesNo == 0) ? 'NO' : 'YES'
    data.username = (data.firstPost.author.username.length > 10) 
      ? data.firstPost.author.username.substr(0, 8) + "..." 
      : data.firstPost.author.username
    $(this.el).html(this.template(data));
    $(this.el).addClass((data.firstPost.yesNo == 0) ? 'no' : 'yes');
    $(this.el).click(function(e) {
      e.preventDefault();
      window.location.href='/questions/' + data.qid + '/debates/' + data.id;
    })
    return this
  }
  
});

window.BrowseMenuView = Backbone.View.extend({
  tagName: 'div',
  className: 'browse-menu',
  template: _.template($('#browse-menu-template').html()),
  
  events: {
    'click a.more-btn': 'onMoreClick',
    'click a.close-btn': 'onCloseClick',
    'click li a': 'onSortButtonClick'
  },
  
  initialize: function() {
    this.model.bind('reset', $.proxy(this.addAll, this));
  },
  
  render: function() {
    $(this.el).html(this.template());
    $(this.el).height(650);
    this.reset('recent');
    var qH = $('div.question').height();
    this.$('div.sort-menu').css('top', 78 + qH);
    $(this.el).css('padding-top', qH);
    
    $('div.responses-outer').click(function(e) {
      if($(e.target).hasClass('responses-outer')) {
        window.location.href = 
          '/#/questions/' + models.currentQuestion.id + '/debates/' + models.currentDebate.id;
      }
    });
    
    return this;
  },
  
  onSortButtonClick: function(e) {
    e.preventDefault();
    if(this.sort == $(e.currentTarget).attr('title')) return;
    this.reset($(e.currentTarget).attr('title'))
  },
  
  onCloseClick: function(e) {
    e.preventDefault();
    window.location.href = 
      '/#/questions/' + models.currentQuestion.id + 
      '/debates/' + models.currentDebate.id
  },
  
  onMoreClick: function(e) {
    e.preventDefault();
    this.nextPage();
  },
  
  reset: function(sort) {
    _.each(this.allItems, 
      function(view) { 
        view.remove(); 
      });
      
    this.$('li a').removeClass('selected');
    this.$('li a[title=' + sort + ']').addClass('selected');
    
    this.allItems = []
    this.page = -1;
    this.limit = 36;
    this.sort = sort;
    this.nextPage();
    
    $('body').scrollTop(0);
  },
  
  nextPage: function() {
    this.page += 1;
    this.setModelUrl(this.page, this.limit, this.sort);
    
    this.$('img.spinner').show();
    this.$('a.more-btn').hide();
    this.$('.more').show();
    
    this.model.fetch({
      
      success: $.proxy(function(data) {
        this.$('img.spinner').hide();
        var bottom = 62;
        
        if(data.length >= this.limit) {
          this.$('a.more-btn').show();
        } else {
          this.$('.more').hide();
          bottom = 27;
        }
        
        $(this.el).height(
          Math.max(650, 
            this.$('.menu-items').height() + 
            this.$('.sort-menu').height() + 
            this.$('.move').height() + 
            bottom));
            
        $('div.content-inner').height(
          $('div.responses-outer').height() + 120);
      }, this)
      
    });
  },
  
  setModelUrl: function(page, amt, sort) {
    this.model.url = '/api/questions/' + models.currentQuestion.id + 
                     '/threads?page=' + page + '&amt=' + amt + '&sort=' + sort;
  },
  
  addAll: function() {
    this.model.each(this.addOne, this);
  },
  
  addOne: function(item, index) {
    var view = new BrowseMenuItemView({model:item});
    this.$('div.menu-items').append(view.render().el);
    this.allItems.push(view);
  },
  
  getPage: function(page, amt, sort) {
    this.setModelUrl(page, amt, sort);
    this.model.fetch({
      success: function(data) {
        //console.log(data);
      }
    });
  }
  
});

/**
 * JoinDebateView
 */
window.JoinDebateView = Backbone.View.extend({
  tagName: 'div',
  className: 'join-debate',
  template: _.template($('#join-debate-template').html()),
  
  events: {
  	"click button.next": "nextStep",
  	"click button.prev": "prevStep",
  	"click button.yes": "setYes",
  	"click button.no": "setNo",
  	"click a.close-btn": "onCloseClick",
  	"click button.add": "setAdd",
  	"click button.reply": "setReply",
  	'keyup textarea': 'onKeyUpReply',
  	'keydown textarea': 'onKeyUpReply',
    'blur textarea': 'onKeyUpReply',
    'submit form': 'onSubmit',
    'click button.share-btn': 'shareClick'
  },
  
  initialize: function() {
  	this.currentStep = 0;
  },
  
  render: function() {
    var data = this.model.toJSON();
  	data.raggedQuestion = tools.ragText(
  	  models.currentQuestion.get('text'), 54);
  	$(this.el).html(this.template(data));
  	this.gotoStep(1);
  	this.$ta = this.$('textarea');
    this.charsLeft();
  	return this
  },
  
  onCloseClick: function(e) {
    e.preventDefault();
    this.remove();
  },
  
  setYes: function(e) {
    this.$('form input[name=yesno]').attr('value', 1);
    this.$('form span.yes').removeClass('unselected');
    this.$('form span.no').addClass('unselected');
  },
  
  setNo: function(e) {
    this.$('form input[name=yesno]').attr('value', 0);
    this.$('form span.yes').addClass('unselected');
    this.$('form span.no').removeClass('unselected');
  },
  
  configureForm: function(action, callback) {
    this.$('form').attr('action', action);
    this.onComplete = callback;
  },
  
  setAdd: function(e) {
    this.mode = 'add';
    this.configureForm( 
      '/api/questions/' + models.currentQuestion.id + '/threads',
      function(data) {
        models.currentDebates.add(data);
        window.location.href= 
          '/#/questions/' + models.currentQuestion.id + '/debates/' + data.id;
        this.remove();
      }
    );
  },
  
  setReply: function(e) {
    commands.showReplyScreen(new Post(this.model.get('firstPost')));
    this.remove();
    /*
    this.mode = 'reply';
    this.configureForm( 
      '/api/threads/' + models.currentDebate.id + '/posts',
      function(data) {
        window.location.href= 
          '/#/questions/' + models.currentQuestion.id + 
          '/debates/' + models.currentDebate.id + '/posts';
        this.remove();
      }
    );
    */
  },
  
  /**
   * Go to the next step in the join debate flow
   */
  nextStep: function(e) {
    if(e) e.preventDefault();
  	this.gotoStep(this.currentStep + 1);
  },
  
  /**
   * Go to the previous step in the join debate flow
   */
  prevStep: function(e) {
    if(e) e.preventDefault();
  	this.gotoStep(this.currentStep - 1);
  },
  
  /**
   * Go to the specified step in the join debate flow
   */
  gotoStep: function(step) {
  	if(this.currentStep == step) return;
  	this.$('div.step-' + this.currentStep).hide();
  	this.currentStep = step;
  	this.$('div.step-' + this.currentStep).css({'display':'block'});
  	
  	if(this.currentStep == 2 || this.currentStep == 3) {
  	  this.$('.step-count').text(this.currentStep-1);
  	  this.$('.step-counter').show();
  	} else {
  	  this.$('.step-counter').hide();
  	}
  },
  
  onKeyUpReply: function(e) {
    if(this.$ta.val().length > 140) {
      this.$ta.val(this.$ta.val().slice(0, 140));
    }
    this.charsLeft();    
  },
  
  charsLeft: function() {
    this.$('div.chars-left span').text(140 - this.$ta.val().length)
  },
  
  finish: function(data) {
    this.$('div.question-header h3').hide();
    this.$('div.question-header div.question').hide();
    this.data = data;
    if(this.mode == 'add') {
      var did = this.data.id;
    } else {
      var did = models.currentDebate.id;
    }
    this.$('a.view-opinion').text('Skip This and Go back to Debate');
    this.$('a.view-opinion').attr(
      'href', '/questions/' + models.currentQuestion.id +
        '/debates/' + did);
    var item = (data.firstPost != undefined) ? data.firstPost : data;
    this.$('div.summary').addClass((item.yesNo == 0) ? "no" : "yes");
    this.$('p.answer-bar').text((item.yesNo == 0) ? "No!" : "Yes!");
    this.$('div.summary div.rag').html(tools.ragText(item.text, 50));
    
    if(this.$('div.rag div').length == 1) {
      this.$('div.rag div').css('padding-top', 6);
    }
    this.nextStep();
  },
  /**
   * Post the reply using AJAX so the user does not have to
   * refresh the page.
   */
  onSubmit: function(e) {
    e.preventDefault();
    var $form = this.$('form');
    var data = $form.serialize();
    
    $.ajax({
      url: $form.attr('action'), 
      type: 'POST',
      data: data,
      dataType: 'json',
      
      error: $.proxy(function(e, xhr) {
        $('div.disable-ui').hide();
        var d = $.parseJSON(e.responseText);
        this.$('p.error-msg').text(d.error.text[0]);
        this.$('p.error-msg').show();
        this.$('p.error-msg').delay(3000).fadeOut();
      }, this),
      
      success: $.proxy(function(data) {
        //console.log(data)
        this.finish(data);
      }, this)
    });
  },
  
  shareClick: function(e) {
    e.preventDefault();
    var provider = $(e.currentTarget).attr('title');
    //console.log(this.mode);
    //console.log(this.data);
    var did = (this.mode == 'add') ? this.data.id : models.currentDebate.id
    var url = "/share/" + provider + "/" + did;
    window.open(url);
  }
  
});

/**
 * ReplyView
 */
window.ReplyView = Backbone.View.extend({
  tagName: 'div',
  className: 'reply',
  template: _.template($('#reply-template').html()),
  
  events: {
    'click .close-btn': 'close',
    'click .skip-btn': 'close',
    'submit form': 'onSubmit',
    'click button.yes': 'onSetYes',
    'click button.no': 'onSetNo',
    'keyup textarea': 'onKeyUpReply',
    'keydown textarea': 'onKeyUpReply',
    'blur textarea': 'onKeyUpReply',
    'click button.share-btn': 'shareClick'
  },
  
  initialize: function() {
    this.currentStep = 0
    
  },
  
  close: function(e) {
    e.preventDefault();
    $('div.responses').show();
    commands.refreshResponsesHeight();
    this.remove();
  },
  
  render: function() {
    var data = this.model.toJSON();
    data.qid = models.currentQuestion.id;
    data.did = models.currentDebate.id;
    data.raggedText = tools.ragText(data.text, 52);
    
    $(this.el).html(this.template(data));
    
    this.$ta = this.$('textarea');
    this.charsLeft();
    
    this.$('div.response-to').addClass((data.yesNo == 1) ? 'yes' : 'no');
    this.$('div.response-to p.answer-bar').text((data.yesNo == 1) ? 'Yes!' : 'No!');
    this.$('div.screen').hide();
    this.$('div.screen-1').show();
    
    if(this.$('div.rag div').length == 1) {
      this.$('div.rag div').css('padding-top', 6);
    }
    
    return this;
  },
  
  onKeyUpReply: function(e) {
    this.$ta.val(this.$ta.val().slice(0, 140));
    this.charsLeft();    
  },
  
  charsLeft: function() {
    this.$('div.chars-left span').text(140 - this.$ta.val().length)
  },
  
  onSetYes: function(e) {
    e.preventDefault();
    this.answer = 1;
    this.$('button.no').addClass('unselected');
    this.$('button.yes').removeClass('unselected');
  },
  
  onSetNo: function(e) {
    e.preventDefault();
    this.answer = 0;
    this.$('button.yes').addClass('unselected');
    this.$('button.no').removeClass('unselected');
  },
  
  shareClick: function(e) {
    e.preventDefault();
    var provider = $(e.currentTarget).attr('title');
    var url = "/share/" + provider + "/" + models.currentDebate.id;
    window.open(url);
  },
  
  /**
   * Post the reply using AJAX so the user does not have to
   * refresh the page.
   */
  onSubmit: function(e) {
    e.preventDefault();
    
    var $form = this.$('form');
    this.$('form input[name=origin]').attr('value', 'web');
    this.$('form input[name=yesno]').attr('value', this.answer);
    var data = $form.serialize();
    //console.log(data);
    $.ajax({
      url: $form.attr('action'), 
      type: 'POST',
      data: data,
      dataType: 'json',
      
      error: $.proxy(function(e, xhr) {
        $('div.disable-ui').hide();
        var d = $.parseJSON(e.responseText);
        this.$('p.error-msg').text(d.errors.text[0]);
        this.$('p.error-msg').show();
        this.$('p.error-msg').delay(3000).fadeOut();
      }, this),
      
      success: $.proxy(function(data) {
        models.currentPosts.add(data);
        models.currentDebate.get('posts').push(data);
        models.currentDebate.change();
        
        this.$('div.summary').addClass((data.yesNo == 0) ? "no" : "yes");
        this.$('p.answer-bar').text((data.yesNo==0)?'No!' : 'Yes!');
        
        this.$('div.summary div.body').addClass((data.yesNo == 0) ? "no" : "yes");
        this.$('div.summary div.rag').html(tools.ragText(data.text, 50));
        
        if(this.$('div.summary div.rag div').length == 1) {
          this.$('div.summary div.rag div').css('padding-top', 6);
        }
        this.showShareScreen();
      }, this)
    });
  },
  
  showShareScreen: function() {
    this.$('div.screen-1').hide();
    this.$('div.screen-2').show();
  },
  
  onResize: function(e) {
    
  }
  
});

/**
 * ResponseItemView
 */
window.ResponseItemView = Backbone.View.extend({
  tagName: 'div',
  className: 'response-item',
  template: _.template($('#responses-item-template').html()),
  
  initialize: function(data) {
    this.showResponseButton = data.showResponseButton;
  },
  
  events: {
    'click a.reply-btn': 'onReplyClick',
    'click a.flag': 'flag'
  },
  
  render: function() {
    var data = this.model.toJSON();
    data.answer = (data.yesNo == 1) ? 'YES' : 'NO'
    data.raggedText = tools.ragText(data.text, 50);
    $(this.el).html(this.template(data));
    $(this.el).addClass((data.yesNo == 1) ? 'yes' : 'no');
    
    if(this.$('div.rag div').length == 1) {
      this.$('div.rag div').css('padding-top', 6);
    }
    
    if(this.showResponseButton == false) {
      this.$('a.debate-this').hide();
    }
    return this;
  },
  
  /**
   * Handle the click of a reply button
   */
  onReplyClick: function(e) {
    e.preventDefault();
    commands.showReplyScreen(this.model);
  },
  
  flag: function(e) {
    e.preventDefault();
    if(!this.$('a.flag').hasClass('clicked')) {
      var callback = $.proxy(function(e) {
        this.$('a.flag').toggleClass('clicked');
      }, this);
      commands.flagPost(this.model.get('id'), callback);
    }
  }
});

/**
 * ResponsesView
 */
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
    if(this.model.length <= 5) {
      $(this.el).height(650-45);
    }
    var qH = $('div.question').height();
    this.$('div.top-bar').css('top', 78 + qH);
    $(this.el).css('padding-top', qH + 45);
    $('div.responses-outer').click(function(e) {
      if($(e.target).hasClass('responses-outer')) {
        window.location.href = 
          '/#/questions/' + models.currentQuestion.id + '/debates/' + models.currentDebate.id;
      }
    });
    return this;
  },
  
  onAdd: function(post) {
    this.addOne(post);
  },
  
  /**
   * Add all responses
   */
  addAll: function() {
    this.model.each(this.addOne, this);
  },
  
  /**
   * Add a responses
   */
  addOne: function(item, index, append) {
    var view = new ResponseItemView({model:item});
    var func = (append)?'append':'prepend';
    this.$('.responses-list')[func](view.render().el);
  },
  
  onResize: function(e) {
    
  }
  
});

/**
 * DebateDetailView
 */
window.DebateDetailView = Backbone.View.extend({
  tagName: 'div',
  template: _.template($('#debate-detail-template').html()),
  
  events: {
  	'click a.join-debate-btn': 'onJoinClick',
  	'click a.respond-btn': 'onRespondClick',
  	'click a.join-prevent': 'showLogin',
  	'click a.stats-btn': 'showStats',
  	'click a.like': 'like',
  	'click a.flag': 'flag'
  },
  
  initialize: function() {
    models.currentDebate.bind('change', $.proxy(this.onAddResponse, this));
    this.render();
  },
  
  render: function() {
    var data = this.model.toJSON();
    //data.firstPost = data.posts[0];
    data.question = models.currentQuestion.attributes;
    data.raggedText = tools.ragText(data.firstPost.text, 50);
    data.yesNoClass = (data.firstPost.yesNo) ? 'yes' : 'no';
    data.hasReplies = (data.posts.length > 0); 
    $(this.el).html(this.template(data));
    if(this.$('div.rag div').length == 1) {
      this.$('div.rag div').css('padding-top', 4);
    }
    this.onAddResponse();
    return this;
  },
  
  showStats: function(e) {
    e.preventDefault();
    commands.loadStats(models.currentQuestion.id);
  },
  
  /**
   * Show the login popup if someone tries to join the debate and they
   * are not logged in.
   */
  showLogin: function(e) {
    e.preventDefault();
    tools.openLoginPopup(
      'Before you can start a debate, you need to log in or sign up first.');
  },
  
  onRespondClick: function(e) {
    e.preventDefault();
    if(this.model.get('postCount') > 1) { 
      commands.showJoinDebateScreen();
    } else {
      commands.showReplyScreen(new Post(this.model.get('firstPost')));
    }
  },
  
  /**
   * Show the join debate view
   */
  onJoinClick: function(e) {
  	e.preventDefault();
  	commands.showJoinDebateScreen();
  },
  
  
  /**
   * Bump up the response amount if a user posts a reply
   */
  onAddResponse: function(post) {
    var posts = this.model.get('posts');
    if(posts.length > 0) {
      var excerpt = _.last(posts).text.substr(0, 22);
      var count = this.model.get('posts').length - 1;
      this.$('span.response-amt').text('"' + excerpt + '..." +' + count);
    }
  },
  
  flag: function(e) {
    e.preventDefault();
    if(!this.$('a.flag').hasClass('clicked')) {
      var callback = $.proxy(function(e) {
        this.$('a.flag').toggleClass('clicked');
      }, this);
      commands.flagPost(this.model.get('firstPost').id, callback);
    }
  },
  
  like: function(e) {
    e.preventDefault();
    if(!this.$('a.like').hasClass('join-prevent')) {
      commands.likePost(
        this.model.get('firstPost').id,
        $.proxy(function(data) {
          this.$('a.like').toggleClass('disabled');
          this.$('a.like strong').text(data.likes);
        }, this));
        
    }
  },
  
  adjustMenu: function() {
    var dLeft = this.$('a.like').outerWidth() + 10;
    this.$('a.responses').css('left', dLeft).width(470 - dLeft - 63);
  }
  
});

/**
 * GalleryItemView
 */
window.GalleryItemView = Backbone.View.extend({
  tagName: 'li',
  className: 'unselected',
  template: _.template($('#gallery-item-template').html()),
  
  render: function() {
    var data = this.model.toJSON();
    data.qid = models.currentQuestion.id;
    $(this.el).html(this.template(data)).addClass(
      (data.yesNo == 0) ? 'no' : 'yes'
    );
    return this;
  }
  
});

/**
 * GalleryView
 */
window.GalleryView = Backbone.View.extend({
  
  el: $('div.debates-gallery'),
  
  events: {
    'click a.browse-all': 'onBrowseAllClick'
  },
  
  initialize: function() {
    this.animate = false;
    this.model.bind('reset', this.addAll, this);
    this.model.bind('add', this.addOne, this);
    //this.$overlay = this.$('.overlay-container');
    this.$container = this.$('div.gallery-container');
    this.$detail = this.$('div.detail');
    this.$ul = this.$('ul.debates');
    this.render();
  },
  
  render: function() {
    this.$('div.question-text').text(
      models.currentQuestion.get('text'));
    return this;
  },
  
  onBrowseAllClick: function(e) {
    e.preventDefault();
    window.location.href = 
      '/#/questions/' + models.currentQuestion.id + '/debates';
  },
  
  addAll: function() {
    this.selectedIndex = -1;
    this.gWidth = 0;
    this.items = [];
    this.model.each(this.addOne, this);
  },
  
  /**
   * Add a gallery item
   */
  addOne: function(item, index) {
    var view = new GalleryItemView({model:item});
    $(view.el).css({ left:this.gWidth });
    this.$ul.append(view.render().el);
    this.gWidth += $(view.el).width();
    this.$ul.width(this.gWidth);
    this.gWidth += 10;
    if(index == 0 || index == this.model.length -1) {
      var $link = view.$('a');
      $link.attr('href', $link.attr('href').substr(1));
    }
    this.items.push(view);
  },
  
  /**
   * Set the current selection of the debate gallery
   */
  setSelection: function(id) {
    
    // Remove stuff that might be there
    try { window.Responses.remove() } catch(e) { }
    try { window.Reply.remove() } catch(e) { }
    
    // Get the item and index
    var item = this.model.getById(id);
    var index = this.model.indexOf(item);
    if(index == this.selectedIndex) return;
    
    try { this.detailView.remove() } catch(e) { }
    //this.$overlay.show();
    
    if(this.$selectedItem != undefined) {
      this.$selectedItem.removeClass('selected').addClass('unselected');
    }
    // Set current selection
    this.selectedIndex = index;
    this.$selectedItem = $(this.$ul.children()[index]);
    
    // Show stuff that should be shown
    this.dLeft = -parseInt(this.$selectedItem.css('left'));
    this.detailView = new DebateDetailView( { model: models.currentDebate });
    
    this.$('div.arrows').hide();
    if(this.animate) {
      this.$ul.stop().animate({'left': this.dLeft}, {
        complete: $.proxy(function(e) {
          this.$('div.arrows').show();
          this.$detail.append($(this.detailView.el).show());
          this.detailView.adjustMenu();
          this.$selectedItem.removeClass('unselected').addClass('selected');
        }, this)
      });
    } else {
      this.$ul.css({left: this.dLeft });
      this.$detail.append(this.detailView.el);
      this.detailView.adjustMenu();
      this.$('div.arrows').show();
      this.$selectedItem.removeClass('unselected').addClass('selected');
      this.animate = true;
    }
    this.onResize(); // Manual resize on init
  },
  
  onResize: function(e, pos) {
    //var hW = $(window).width() / 2;
    //var hI = (this.$selectedItem) ? this.$selectedItem.width() / 2 : 250;
    //this.$container.css({ left:Math.round(hW - hI) });
    //this.$overlay.css({ left: Math.round(hW - this.$overlay.width() / 2) });
    
    pos = (pos == undefined) ? this.el.css('position') : pos;
    this.el.css({"position":pos});
    
    this.$('div.gallery-container').css({visibility:'visible'});
  }
  
});

/**
 * HomeView
 */
window.HomeView = Backbone.View.extend({
  el: $('body.home-index'),
  
  initialize: function() {
    this.model.bind('change', this.render, this);
  }
});


/**
 * Question model
 */ 
window.Question = Backbone.Model.extend({
  urlRoot: '/api/questions'
});

/**
 * Debate model
 */ 
window.Debate = Backbone.Model.extend({
  urlRoot: '/api/threads'
});

/**
 * Post model
 */ 
window.Post = Backbone.Model.extend({
  urlRoot: '/api/posts'
});

/**
 * DebateList model
 */
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

window.Stats = Backbone.Model.extend({
  urlRoot: '/api/stats/questions'
});

/**
 * PostList model
 */
window.PostList = Backbone.Collection.extend({
  model: Post
});

/**
 * GalleryItem model
 */
window.GalleryItem = Backbone.Model.extend({
  
});

/**
 * GalleryItemList model
 */
window.GalleryItemList = Backbone.Collection.extend({
  model: GalleryItem
});


// Creating a namespace for the models
if(window.models === undefined) {
  window.models = {}
}
models.currentQuestion = new Question
models.currentDebates = new DebateList
models.currentDebate = new Debate
models.currentPosts = new PostList
models.currentStats = new Stats
models.browsingDebates = new DebateList

// Shared commands to use throughout app
window.commands = {}

commands.loadQuestion = function(qid, callback) {
  if(models.currentQuestion.id != qid) {
    commands.showSpinner();
    models.currentQuestion.id = qid;
    models.currentQuestion.fetch({ success: function(data) {
      commands.hideSpinner();
      callback();
    }});
  } else {
    callback();
  }
};

commands.loadDebates = function(qid, callback) {
  
  var url = '/api/questions/' + qid + '/threads?id_offset=' + debateOffset;
  if(models.currentDebates.url != url) {
    commands.showSpinner();
    models.currentDebates.url = url;
    models.currentDebates.fetch({ success: function(data) {
      commands.hideSpinner();
      callback();
    }});
  } else {
    callback();
  }
};

commands.loadDebate = function(did, callback) {
  if(models.currentDebate.id != did) {
    commands.showSpinner();
    models.currentDebate.id = did;
    models.currentDebate.fetch({ success: function(data) {
      commands.hideSpinner();
      posts = models.currentDebate.get('posts').reverse()
      posts.pop();
      models.currentPosts = new PostList(posts);
      callback();
    }});
  } else {
    callback();
  }
};

commands.loadPosts = function(did, callback) {
  if(did != models.currentDebate.id) {
    commands.showSpinner();
    models.currentPosts.url = '/api/debates/' + did + '/posts';
    models.currentPosts.fetch({ success:function(data) {
      commands.hideSpinner();
      callback();
    }});
  } else {
    callback();
  }
};

commands.loadStats = function(qid, callback) {
  commands.showSpinner();
  models.currentStats.id = qid
  models.currentStats.fetch({ success: function(data) {
    commands.hideSpinner()
    commands.showStatsScreen();
    $('div.content-inner').height($('div.stats-outer').height() + 78);
    $('body').scrollTop(0);
  }});
};

commands.closeModals = function() {
  $('div.question').css('background-color', 'rgba(255,255,255,0.60)')
  try{ window.BrowseMenu.remove(); } catch(e){}
  try{ window.Stats.remove(); } catch(e){}
};

commands.showBrowseMenu = function() {
  //console.log('showBrowseMenu');
  window.BrowseMenu = new BrowseMenuView({ 
    model:models.browsingDebates });
  $('div.responses-outer')
    .append($(BrowseMenu.render().el).show());
  Gallery.onResize(null, 'fixed');
  $('div.question').css('background-color', 'rgba(255,255,255,1)');
};

commands.showDebate = function(did, animate) {
  Gallery.onResize(null, 'relative');
  Gallery.setSelection(did, animate || true);
  commands.refreshResponsesHeight();
};

commands.showDebateResponses = function() {
  Gallery.onResize(null, 'fixed');
  window.Responses = new ResponsesView({ model: models.currentPosts });
  $('div.responses-outer').append($(Responses.render().el).show());
  $('div.content-inner').height($('div.responses-outer').height() + 120);
  Responses.onResize();
  $('div.responses').show();
  commands.refreshResponsesHeight();
  $('div.question').css('background-color', 'rgba(255,255,255,1)');
};

commands.refreshResponsesHeight = function() {
  $('div.content-inner').height(
    Math.max(750, $('div.responses-outer').height() + 120));
};

commands.createGallery = function() {
  if(window.Gallery) return;
  window.Gallery = new GalleryView({ model:models.currentDebates });
  resizeable.push(Gallery);
};

commands.showReplyScreen = function(model) {
  window.Reply = new ReplyView({'model':model});
  $('div.join-outer').append($(Reply.render().el).show());
  Gallery.onResize(null, 'fixed');
  $('div.responses').hide();
  $('body').scrollTop(0);
};

commands.showJoinDebateScreen = function() {
  window.JoinDebate = new JoinDebateView({ model: models.currentDebate });
  $('div.join-outer').append($(JoinDebate.render().el).show());
  Gallery.onResize(null, 'fixed');
  $('body').scrollTop(0);
};

commands.showSpinner = function() {
  window.PopupHolder.showPopup(new SpinnerView, null, 0);
};

commands.hideSpinner = function() {
  window.PopupHolder.closePopup();
};

commands.showStatsScreen = function() {
  window.Stats = new StatsScreenView({ model:models.currentStats });
  Gallery.onResize(null, 'fixed');
};
/*
commands.showWhatIsThis = function() {
  window.WhatIsThis = new WhatIsThisView();
  $('div.gallery-container').append(WhatIsThis.render().el);
}
*/
commands.flagPost = function(postId, callback) {
  $.ajax({
    url: '/api/posts/' + postId + '/flag', 
    type: 'POST',
    dataType: 'json',
    success: callback
  });
};

commands.likePost = function(postId, callback) {
  $.ajax({
    url: '/api/posts/' + postId + '/like', 
    type: 'POST',
    dataType: 'json',
    success: callback
  });
};

/**
 * WorkspaceRouter
 */
var WorkspaceRouter = Backbone.Router.extend({
  
  routes: {
    '':                                     'home',
    '/questions/:qid':                      'questions',
    '/questions/:qid/debates':              'browse',
    '/questions/:qid/debates/:did':         'debates',
    '/questions/:qid/debates/:did/posts':   'posts'
    //'/whatisthis':                          'whatisthis'
  },
  
  home: function() {
    commands.closeModals();
    router.questions(questionId || "current");
  },
  
  questions: function(qid, callback) {
    commands.closeModals();
    commands.loadQuestion(qid, function(data) {
      commands.createGallery();
      commands.loadDebates(
        models.currentQuestion.id, function(data) {
        if(callback) {
          callback();
        } else {
          var mid = Math.floor(models.currentDebates.length / 2);
          router.debates(models.currentQuestion.id, 
            models.currentDebates.at(mid).get('id'));
        }
      });
    });
  },
  
  browse: function(qid, callback) {
    commands.closeModals();
    router.questions(qid, function(data) {
      commands.showBrowseMenu();
    });
  },
  
  debates: function(qid, did, callback) {
    try{ window.WhatIsThis.remove() } catch(e) {}
    commands.closeModals();
    router.questions(qid, function(data) {
      commands.loadDebate(did, function(data) {
        commands.showDebate(models.currentDebate.id);
        if(callback) callback();
      });
    });
  },
  
  posts: function(qid, did) {
    commands.closeModals();
    router.debates(qid, did, function(data) {
      commands.showDebateResponses();
    });
  }
  /*
  whatisthis: function() {
    if(models.currentQuestion.id == undefined) {
      router.home();
    }
    commands.showWhatIsThis();
  }
  */
});

$(function(){
  window.Home = new HomeView({ model: models.currentQuestion });
  window.router = new WorkspaceRouter();
  Backbone.history.start();
});

