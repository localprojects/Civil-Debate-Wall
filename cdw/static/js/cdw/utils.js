define(['jquery', 'config', 'jquery_mobile'
], function($, Config, Mobile) {

    var apiHost = Config.api_host;

    var Utils = {};

    Utils.floatFooter = function() {

        //$.mobile.fixedToolbars.show();
        //$("[data-position='fixed']").fixedtoolbar('destroy');
        //	$("[data-position='fixed']").fixedtoolbar('hide');
        //$('.ui-footer-fixed').css('position','inline');

        $('.ui-footer').show();
        //$('.ui-footer').removeClass(['ui-footer-fixed']);
        //$('.ui-footer').attr('data-position','inline' );
    }

    return Utils;

});

