/*--------------------------------------------------------------------
Copyright (c) 2011 Local Projects. All rights reserved.
License: Affero GNU GPL v3, see LEGAL/LICENSE for more details.
--------------------------------------------------------------------*/

/**
 * PopupHolderView
 */
window.PopupHolderView = Backbone.View.extend({
    el : $('div.popup-outer'),

    initialize : function() {
        this.$inner = this.$('div.popup-inner');
        this.$mask = this.$('div.popup-mask');
    },

    /**
     * Show the supplied popup view
     */
    showPopup : function(view, width, opacity) {
        this.closePopup();
        this.currentPopup = view;
        this.$inner.html(view.render().el);
        this.$inner.css({
            width : width || 500
        });
        this.$mask.css({
            opacity : (opacity == undefined) ? 0.85 : opacity
        });
        this.el.show();
        this.onResize();
    },

    /**
     * Close the current popup
     */
    closePopup : function() {
        try {
            this.currentPopup.remove();
        } catch(e) {
        }
        this.el.hide();
    },

    onResize : function(e) {
        var centered = Math.max(0, $(window).height() / 2 - this.$inner.height() / 2);
        this.$inner.css('top', Math.max(0, Math.round(centered - 100)));
    }
});

/**
 * LoginPopupView
 */
window.LoginPopupView = Backbone.View.extend({
    tagName : 'div',
    className : 'popup login-popup',
    template : _.template($('#login-popup-template').html()),

    events : {
        'submit #login_or_signup_form' : 'onSubmit',
        'submit form.forgot-form' : 'onForgotSubmit',
        'click a.forgot' : 'onForgotClick',
        'click a.back-to-login' : 'hideForgot'
    },

    initialize : function() {
        this.isSignin = false;
    },

    render : function() {
        $(this.el).html(this.template(this.model));
        this.$('input.defaulttext').blur();
        // Set the default text stuff

        // Register after the first blur
        this.$('input.username').blur($.proxy(function(e) {
            this.checkIfUserExists(e);
        }, this));
        this.$('div.forgot-view').hide();
        return this;
    },

    /**
     * Toggle the form's ableness
     */
    toggle : function() {
        this.$('form').toggleClass('disabled');
    },

    /**
     * Set the values for the form.
     */
    setValues : function(signIn, label, action, addClass, removeClass, fieldName, selector) {

        this.isSignin = signIn;
        this.$('form').filter(selector).attr('action', action).addClass(addClass).removeClass(removeClass);
        this.$('p.username input').attr('name', fieldName);
        this.$('#login_or_signup_form button').text(label);
    },

    /**
     * Makes the form a register form
     */
    setRegister : function(label) {
        this.setValues(false, label || 'Register', '/register/email', 'register-form', 'signin-form', 'email', '#login_or_signup_form');
    },

    /**
     * Makes the form a login form
     */
    setSignin : function(label) {
        this.setValues(true, label || 'Register/Sign In', '/auth', 'signin-form', 'register-form', 'username', '#login_or_signup_form');
    },

    /**
     * Show an error
     */
    showError : function(error) {
        var $div = this.$('div.error-msg');
        if (error) {
            $div.text(error);
            $div.show()
        } else {
            $div.hide();
        }
    },

    /**
     * Check if the user exists. If the user exists, set the form
     * to a login form, otherwise, make it a register form.
     */
    checkIfUserExists : function(e) {
        var val = this.$('p.username input').val();
        if (val == '' || val == 'Email Address') {
            return false;
        }
        this.toggle();
        $.ajax({
            url : '/api/users/search',
            type : 'POST',
            data : {
                'email' : this.$('p.username input').val()
            },

            complete : $.proxy(function() {
                this.toggle();
            }, this),

            error : $.proxy(function() {
                this.setSignin();
            }, this),

            success : $.proxy(function(data) {
                if (data.length == 1) {
                    this.setSignin('Sign In');
                } else {
                    $.ajax({
                        url : '/api/users/search',
                        type : 'POST',
                        data : {
                            'username' : this.$('p.username input').val()
                        },

                        complete : $.proxy(function() {
                            this.toggle();
                        }, this),

                        error : $.proxy(function() {
                            this.setSignin();
                        }, this),

                        success : $.proxy(function(data) {
                            if (data.length == 1) {
                                this.setSignin('Sign In');
                            } else {
                                this.setRegister('Register');
                            }
                        }, this)
                    });
                }
            }, this)
        });
    },

    /**
     * If its a login form, do an AJAX login call so that login
     * errors can be shown without a page refresh.
     */
    onSubmit : function(e) {
        this.showError(null);
        if (this.isSignin) {
            e.preventDefault();
            var $form = this.$('form').filter('#login_or_signup_form');

            $.ajax({
                url : $form.attr('action'),
                type : 'POST',
                dataType : 'json',
                data : $form.serialize(),

                error : $.proxy(function(data) {
                    this.showError('Please enter a valid email/username');
                }, this),

                success : $.proxy(function(data) {

                    if (data.success) {
                        window.location.reload(true);
                    } else {
                        this.showError(data.error);
                    }
                }, this)
            })
        }
    },

    onForgotClick : function(e) {
        e.preventDefault();
        this.showForgot();
    },

    hideForgot : function(e) {
        e.preventDefault();
        this.$('div.main-view').show();
        this.$('div.forgot-view').hide();
    },

    showForgot : function() {
        this.$('div.main-view').hide();

        this.$('span.forgot-error').text('');
        this.$('form.forgot-form input.email').val('');
        this.$('div.forgot-view .screen-1').show();
        this.$('div.forgot-view .screen-2').hide();

        this.$('div.forgot-view').show();
        this.$('div.forgot-view input').blur();
    },

    onForgotSubmit : function(e) {
        e.preventDefault();
        var $form = this.$('form.forgot-form');
        var data = $form.serialize();
        $.ajax({
            url : $form.attr('action'),
            type : 'POST',
            dataType : 'json',
            data : data,
            success : $.proxy(function(data) {
                if (data.success) {
                    var e = this.$('form.forgot-form input.email').val();
                    this.$('span.sent-to').text(e);
                    this.$('div.forgot-view .screen-1').hide();
                    this.$('div.forgot-view .screen-2').show();
                } else {
                    this.showError(data.error);
                    this.$('form.forgot-form input.email').val('');
                    this.$('span.forgot-error').text('Sorry, that email is not registered with us.');
                    this.$('span.forgot-error').delay(3000).fadeOut();
                }
            }, this)
        })
    }
});

window.PopupHolder = new PopupHolderView
window.resizeable.push(PopupHolder);

/**
 * Opens the login popup.
 */
tools.openLoginPopup = function(message) {
    window.PopupHolder.showPopup(new LoginPopupView({
        model : {
            "message" : message
        }
    }));
};

/**
 * Shared methods
 */

/**
 * Generates HTML for the nice ragged text treatment.
 */
tools.insertNthChar = function(string, chr, nth) {
    var output = '';
    var i = 0;
    for (i; i < string.length; i++) {
        if (i > 0 && i % nth == 0)
            output += chr;
        output += string.charAt(i);
    }

    return output;
};

tools.ragText = function(text, maxChars) {
    text = $.trim(text);
    var formattedText = ''
    var first = true;
    textArr = text.split(' ');
    if (textArr[0].length > maxChars) {
        text = tools.insertNthChar(text, " ", maxChars - 13);
    }

    while (text.length > 0) {
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
    if (text.length <= maxChars) {
        return (text == " ") ? 0 : text.length;
    }

    var spaceLeft = maxChars;
    for (var i = maxChars; i > 0; i--) {
        if (text.charAt(i) == " ") {
            spaceLeft = maxChars - i;
            break;
        }
    }

    return maxChars - spaceLeft;
};

$(function() {
    /*
     $('a.what-is-this-btn').click(function(e) {
     e.preventDefault();
     if(window.atHomePage) {
     commands.showWhatIsThisScreen();
     } else {
     window.open('/whatisthis', 'whatisthis', 'width=550,height=647,menubar=no,location=no');
     }
     });
     */
    $('div.disable-ui').hide();
    $('body').ajaxStart(function() {
        $('div.disable-ui').show();
    }).ajaxStop(function() {
        $('div.disable-ui').hide();
    });

    // Open the LoginPopup
    $('a.create-account-btn, a.signin-btn').live('click', function(e) {
        e.preventDefault();
        tools.openLoginPopup();
    });

    // Close the popup
    $('.close-popup-btn').live('click', function(e) {
        e.preventDefault();
        window.PopupHolder.closePopup();
    });

    // Always close the popup if the mask if clicked
    $('div.popup-mask').click(function(e) {
        e.preventDefault();
        window.PopupHolder.closePopup();
    });

    // Show and hide any flash messages
    $('div.flashes').slideDown().delay(6000).slideUp();

    // Handle focus on any input fields with defaulttext set
    $("input.defaulttext").live('focus', function(e) {
        var input = $(this);
        if (input.val() == input[0].title) {
            input.addClass("active");
            input.val("");
        }
    });

    // Handle blur on any input fields with defaulttext set
    $("input.defaulttext").live('blur', function(e) {
        var input = $(this);
        if (input.val() == "") {
            input.removeClass("active");
            input.val(input[0].title);
        }
    });

    // Blur the input fields to set their default text
    $('input.defaulttext').blur();
});

// Spin jQuery 'plugin'
(function($) {
    $.fn.spin = function(opts, color) {
        var presets = {
            "tiny" : {
                lines : 8,
                length : 2,
                width : 2,
                radius : 3
            },
            "small" : {
                lines : 8,
                length : 4,
                width : 3,
                radius : 5
            },
            "large" : {
                lines : 10,
                length : 8,
                width : 4,
                radius : 8
            }
        };
        if (Spinner) {
            return this.each(function() {
                var $this = $(this), data = $this.data();

                if (data.spinner) {
                    data.spinner.stop();
                    delete data.spinner;
                }
                if (opts !== false) {
                    if ( typeof opts === "string") {
                        if ( opts in presets) {
                            opts = presets[opts];
                        } else {
                            opts = {};
                        }
                        if (color) {
                            opts.color = color;
                        }
                    }
                    data.spinner = new Spinner($.extend({
                        color : $this.css('color')
                    }, opts)).spin(this);
                }
            });
        } else {
            throw "Spinner class not available.";
        }
    };
})(jQuery);

tools.bodyClass('questions-archive', function() {
    $('.category-selector').bind('change', function(e) {
        var url = '/questions/archive';
        var val = $(this).attr('value');
        if (val.length > 0) {
            url += '/' + val;
        }
        window.location = url;
    })
});

tools.bodyClass('home-index', function() {
    window.atHomePage = true;

    $('img.join-debate-img').live('mouseenter', function() {
        this.src = this.src.replace("_out", "_over");
    }).live('mouseleave', function() {
        this.src = this.src.replace("_over", "_out");
    });
    $('img.stats-button').live('mouseenter', function() {
        this.src = this.src.replace("_out", "_over");
    }).live('mouseleave', function() {
        this.src = this.src.replace("_over", "_out");
    });
});

tools.bodyClass('suggest-index', function() {
    $('textarea').bind('focus', function(e) {
        $(e.currentTarget).val('');
    });
});

tools.bodyClass('whatisthis', function() {
    view = new WhatIsThisView({
        homePage : false
    });
    $('div.wit').append(view.render().el);
});

tools.bodyClass('contact', function() {
    $('select').dropkick();
});

tools.bodyClass('suggest', function() {
    $('select').dropkick();
});

tools.bodyClass('login', function() {
    $('.shim-tall .container').append(new LoginPopupView().render().el);
});

tools.bodyClass('profile-index', function() {
    $('.post-yes, .post-no').each(function(index, item) {
        var $item = $(item);
        var ragged = tools.ragText($item.text(), 80);
        $item.html(ragged);
        if ($('div', $item).length == 1) {
            $('div', $item).css('padding-top', 3);
        }
    })
});
