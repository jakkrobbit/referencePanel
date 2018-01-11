/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50, unused: false */
/*global alert*/

'use strict';
//TODO: edit help box

// Info dialog
function fyi() {
    var mssg = "Thanks for installing PS Reference Panel! There are 2 ways to add images to this panel:\n\n" +
        "Click the image icon to add images already saved to your computer\n" +
        "Or simply paste a reference image from the clipboard\n\n" +
        "After that, you can resize and/or rearrange individual references however you need to. Remove references all or select references using the trash button.";
    alert(mssg);
}

function deleteLayer() {
    var layer = app.activeDocument.activeLayer();
    layer.remove();
}