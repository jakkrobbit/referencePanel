(function ($) {
    'use strict';
    $.fancyprompt = function (opts) {
        opts = $.extend(true, {
            title: 'Are you sure?',
            message: '',
            okButton: 'OK',
            noButton: 'Cancel',
            callback: $.noop
        }, opts || {});

        $.fancybox.open({
            type: 'html',
            src: '<div class="topcoat-dialog">' +
                '<h3>' + opts.title + '</h3>' +
                '<p>' + opts.message + '</p>' +
                '<div>' +
                '<div class="bttnbox">' +
                '<button data-value="1" data-fancybox-close class="topcoat-button--large--cta">' + opts.okButton + '</button>' +
                '<button data-value="0" data-fancybox-close class="topcoat-button--large">' + opts.noButton + '</button>' +
                '</div>' +
                '</div>' +
                '</div>',
            opts: {
                animationDuration: 350,
                animationEffect: 'material',
                modal: true,
                baseTpl: '<div class="fancybox-container fc-container topcoat-dialog" role="dialog" tabindex="-1">' +
                    '<div class="fancybox-bg"></div>' +
                    '<div class="fancybox-inner">' +
                    '<div class="fancybox-stage"></div>' +
                    '</div>' +
                    '</div>',
                afterClose: function (instance, current, e) {
                    var button = e ? e.target || e.currentTarget || e.originalEvent.target : null;
                    var value = button ? $(button).data('value') : 0;

                    opts.callback(value);
                }
            }
        });
    };
})(jQuery);
