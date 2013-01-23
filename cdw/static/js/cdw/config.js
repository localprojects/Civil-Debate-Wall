/*
 * api_host : the location of your python host. By default "/"
 * NOTE: JSON only works on same domain, whereas JSONP works xdomain. All api calls support JSONP
 */

define({
    api_host : "/",
    replies_per_page : 5,
    scroll_reload_margin : 100,
    // TODO: These should come from back-end or Jinja or something
    fb_app_id : '263562500362985',
    fb_redirect_url : '/fb_login',
    fb_scope : '',
    fb_state : '',
    img_url : ''
});
