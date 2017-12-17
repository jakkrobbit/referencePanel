/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50, unused: false */
/*global $, CSInterface, CSEvent, window, alert*/

'use strict';

// Info dialog
function fyi() {
    var mssg = "Thanks for installing PS Reference Panel! There are 2 ways to add images to this panel:\n\n" +
        "Click the image icon to add images already saved to your computer\n" +
        "Or simply paste a reference image from the clipboard\n\n" +
        "After that, you can resize and/or rearrange individual references however you need to. Remove references all or select references using the trash button.";
    alert(mssg);
}

// Make App Persistent
function Persistent(inOn) {
    var csInterface = new CSInterface(),
        event;
    if (inOn) {
        event = new CSEvent("com.adobe.PhotoshopPersistent", "APPLICATION");
    } else {
        event = new CSEvent("com.adobe.PhotoshopUnPersistent", "APPLICATION");
    }
    event.extensionId = 'referenceWindow';
    csInterface.dispatchEvent(event);
    /*Use Persistent(true); to turn on persistence*/
}

// Image Uploads
/*function openImage() {
    var fileTypes = ['gif', 'jpg', 'jpeg', 'png', 'bmp'],
        refs = window.cep.fs.showOpenDialog(true, false, 'Open References', '', fileTypes),
        images = refs.data;

    for (var i = 0; i < images.length; i++) {
        $('.ref').append("<img class='refpic' src='" + images[i] + "' alt='Reference Image'/>");
        console.log('Selected images:' + images[i]);
    }

}*/

// Image Divs
function references() {
    var $refs = $('.ref');

    // Make images sortable
    $refs.sortable({
        axis: 'y'
    });
}
