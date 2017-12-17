/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global $, CSInterface, themeManager*/

(function () {
    'use strict';

    var csInterface = new CSInterface(),
        cepEngine = window.cep,
        openImage = function () {
            var fileTypes = ['gif', 'jpg', 'jpeg', 'png', 'bmp'],
                refs = cepEngine.fs.showOpenDialog(true, false, 'Open References', '', fileTypes),
                images = refs.data;

            for (var i = 0; i < images.length; i++) {
                $('.ref').append("<img class='refpic' src='" + images[i] + "' alt='Reference Image'/>");
                console.log('Selected images:' + images[i]);
            }
        };


    function init() {

        themeManager.init();

        $("#infobttn").click(function () {
            csInterface.evalScript('fyi()');
        });
        $("#openref").click(function () {
            openImage();
        });
    }

    init();

}());
