/*jslint vars: true, plusplus: true, devel: true, nomen: true, regexp: true, indent: 4, maxerr: 50 */
/*global $, CSInterface, themeManager, CSEvent, fabric*/
/*eslint no-loop-func: 0*/

(function () {
    'use strict';
    //TODO: Add save/open/delete board funcs

    var csInterface = new CSInterface(),
        cepEngine = window.cep.fs,

        //Canvas variables
        txtStyles = {
            padding: 6,
            originX: 'center',
            originY: 'center',
            fill: '#d6d6d6',
            fontFamily: 'sans-serif',
            fontSize: '16',
            textAlign: 'center',
            borderColor: '#d6d6d6',
            cornerColor: '#d6d6d6',
            cornerSize: 6,
            cornerStyle: 'circle',
            transparentCorners: false,
            lockUniScaling: true
        },
        imgAttrs = {
            left: 100,
            top: 200,
            originX: 'center',
            originY: 'center',
            borderColor: '#d6d6d6',
            cornerColor: '#d6d6d6',
            padding: 5,
            cornerSize: 8,
            cornerStyle: 'circle',
            transparentCorners: false,
            lockUniScaling: true
        },
        $container = $('#content'),
        canvas = new fabric.Canvas('canvas', {
            width: 325,
            height: 540,
            rotationCursor: 'url("./icons/rotatecursor.cur"), crosshair'
        }),
        intro1 = new fabric.Text('How to add\nreference images:', txtStyles).set({
            top: 50,
            left: 160
        }),
        intro2 = new fabric.Text('Drag & drop images', txtStyles).set({
            top: 100,
            left: 160
        }),
        intro3 = new fabric.Text('Paste images\nfrom the clipboard', txtStyles).set({
            top: 150,
            left: 160
        }),
        intro4 = new fabric.Text('Or use the button\nbelow to add images', txtStyles).set({
            top: 200,
            left: 160
        }),
        introTxt = new fabric.Group([intro1, intro2, intro3, intro4], {
            borderColor: '#d6d6d6',
            cornerColor: '#d6d6d6',
            cornerSize: 6,
            cornerStyle: 'circle',
            hoverCursor: 'auto',
            selectable: false,
            transparentCorners: false,
            lockUniScaling: true
        }),

        //Starting canvas
        introCanvas = function () {
            canvas.add(introTxt).centerObject(introTxt);
            introTxt.setCoords();
            canvas.renderAll();
        },

        //Opening images
        openImage = function () {
            var fileTypes = ['gif', 'jpg', 'jpeg', 'png', 'bmp'],
                refs = cepEngine.showOpenDialog(true, false, 'Open References', '', fileTypes),
                images = refs.data;

            if (images.length) {
                canvas.remove(introTxt);
                for (var i = 0; i < images.length; i++) {
                    var url = images[i];
                    fabric.Image.fromURL(url, function (img) {
                        img.scaleToWidth(350);
                        canvas.add(img).centerObject(img);
                        img.setCoords();
                        canvas.renderAll();
                    }, imgAttrs);
                }
            } else {
                return false;
            }
        },

        //Pasting images
        pasteImage = function (e) {
            var items = e.originalEvent.clipboardData.items;
            // 1885434740 = charIDToTypeID( "past" ) = paste  

            e.preventDefault();
            e.stopPropagation();
            canvas.remove(introTxt);

            //Loop through files
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') == -1) {
                    var file = items[i],
                        //type = items[i].type,
                        imageData = file.getAsFile(),
                        URLobj = window.URL || window.webkitURL,
                        img = new Image();
                    img.src = URLobj.createObjectURL(imageData);
                    fabric.Image.fromURL(img.src, function (imgInst) {
                        imgInst.scaleToWidth(350);
                        canvas.add(imgInst).centerObject(imgInst);
                        imgInst.setCoords();
                        canvas.renderAll();
                    }, imgAttrs);
                }
            }
        },

        //Drag-Drog images
        dropImage = function (e) {
            var files = e.originalEvent.dataTransfer.files || e.originalEvent.dataTransfer.items;
            e = e || window.event;
            e.preventDefault();
            //            e.stopPropagation();
            $('.refs').removeClass('highlight');
            canvas.remove(introTxt);

            // Filereader function
            function loadReader(event) {
                var img = new Image();
                img.src = event.target.result;
                img.onload = function () {
                    var imgInstance = new fabric.Image(img, imgAttrs);
                    imgInstance.scaleToWidth(350);
                    canvas.add(imgInstance).centerObject(imgInstance);
                    imgInstance.setCoords();
                    canvas.renderAll();
                };
                csInterface.evalScript('deleteLayer()');
            }
            
            // Layer Drop function
            function readLayer(event) {
                var img = new Image(),
                    layerData = event.dataTransfer.getData("custom.data");
                img.src = "data:image/png;base64," + layerData;
                img.onload = function () {
                    var imgInstance = new fabric.Image(img, imgAttrs);
                    imgInstance.scaleToWidth(350);
                    canvas.add(imgInstance).centerObject(imgInstance);
                    imgInstance.setCoords();
                    canvas.renderAll();
                };
            }
            
            //Loop through files
            for (var i = 0; i < files.length; i++) {
                var file = files[i],
                    reader = new FileReader();
                
                if (file.type.indexOf('image')) {
                    reader.onload = readLayer;
                } else {
                    reader.onload = loadReader;
                }
                reader.readAsDataURL(file);
            }

        },

        //Deleting images
        deleteImage = function () {
            var selected = canvas.getActiveObject(),
                selectedGroup = canvas.getActiveObjects();
            if (selected) {
                if (confirm('Deleted selected image?')) {
                    canvas.remove(selected);
                }
            } else if (selectedGroup) {
                if (confirm('Deleted selected images?')) {
                    canvas.remove(selectedGroup);
                }
            } else {
                return false;
            }
        },
        deleteAll = function () {
            if (confirm('Delete all images?')) {
                canvas.clear();
            }
        },
        dragIn = function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            $('.refs').addClass('highlight');
            return false;
        },
        dragOut = function (e) {
            if (e.preventDefault) {
                e.preventDefault();
            }
            $('.refs').removeClass('highlight');
            return false;
        },
        //FIXME: flyout & context menus
        setFlyoutMenu = function (e) {
            var flyoutTxt = '<Menu><MenuItem Id="addRef" Label="Add Reference Image" Enabled="true"/><MenuItem Id="pasteRef" Label="Paste Reference Image" Enabled="true"/><MenuItem Id="deleteRef" Label="Delete Selected" Enabled="true"/><MenuItem Id="deleteAll" Label="Delete All" Enabled="true"/><MenuItem Label="---" /><MenuItem Id="saveBoard" Label="Save Board" Enabled="false"/><MenuItem Id="openBoard" Label="Open Board" Enabled="false"/><MenuItem Id="deleteBoard" Label="Delete Board" Enabled="false"/><MenuItem Label="---" /><MenuItem Id="helpBox" Label="Help" Enabled="true"/></Menu>',
                flyoutXML = $.parseXML(flyoutTxt);

            function menuCallbacks() {
                switch (e.data.menuId) {
                    case "addRef":
                        openImage();
                        break;
                    case "pasteRef":
                        pasteImage();
                        break;
                    case "deleteRef":
                        deleteImage();
                        break;
                    case "deleteAll":
                        deleteAll();
                        break;
                        /*case "saveBoard":
                        break;
                    case "openBoard":
                        break;
                    case "deleteBoard":
                        break;*/
                    case "helpbox":
                        csInterface.evalScript('fyi()');
                        break;
                }

            }
            csInterface.setPanelFlyoutMenu(flyoutXML);
            csInterface.addEventListener("com.adobe.csxs.events.flyoutMenuClicked", menuCallbacks);

        },
        setContextMenu = function (e) {
            var contextMenu = {
                "menu": [
                    {
                        "id": "addRef",
                        "label": "Add Reference Image",
                        "enabled": true,
                        "checkable": false,
                        "checked": false
                              },
                    {
                        "id": "pasteRef",
                        "label": "Paste Reference Image",
                        "enabled": true,
                        "checkable": false,
                        "checked": false

                              },
                    {
                        "id": "deleteRef",
                        "label": "Delete Selected",
                        "enabled": true,
                        "checkable": false,
                        "checked": false

                              },
                    {
                        "id": "deleteAll",
                        "label": "Delete All",
                        "enabled": true,
                        "checkable": false,
                        "checked": false

                              },
                    {
                        "label": "---"
                              },
                    {
                        "id": "saveBoard",
                        "label": "Save Board",
                        "enabled": false,
                        "checkable": false,
                        "checked": false

                              },
                    {
                        "id": "openBoard",
                        "label": "Open Board",
                        "enabled": false,
                        "checkable": false,
                        "checked": false

                              },
                    {
                        "id": "deleteBoard",
                        "label": "Delete Board",
                        "enabled": false,
                        "checkable": false,
                        "checked": false

                              }
                          ]
            };

            function menuCallbacks() {
                switch (e.data.menuId) {
                    case "addRef":
                        openImage();
                        break;
                    case "pasteRef":
                        pasteImage();
                        break;
                    case "deleteRef":
                        deleteImage();
                        break;
                    case "deleteAll":
                        deleteAll();
                        break;
                        /*case "saveBoard":
                        break;
                    case "openBoard":
                        break;
                    case "deleteBoard":
                        break;*/
                    case "helpbox":
                        csInterface.evalScript('fyi()');
                        break;
                }

            }

            csInterface.setContextMenuByJSON(contextMenu, menuCallbacks);
        },
        keyCodes = [
            {
                "keyCode": 86,
                "ctrlKey": true
                }
            ],

        persist = function (inOn) {
            var event;
            if (inOn) {
                event = new CSEvent("com.adobe.PhotoshopPersistent", "APPLICATION");
            } else {
                event = new CSEvent("com.adobe.PhotoshopUnPersistent", "APPLICATION");
            }
            event.extensionId = 'referenceWindow';
            csInterface.dispatchEvent(event);
            /*Use persist(true); to turn on persistence*/
        };



    //////////// INIT ////////////

    function init() {
        themeManager.init();
        introCanvas();
        //persist(true);

        $('#refresh').click(function () {
            window.location.reload(true);
        });
        $("#infobttn").click(function () {
            csInterface.evalScript('fyi()');
        });

        //Image handling
        $("#openref").click(openImage);
        $('#delref').click(deleteImage);

        $container.on('drop', dropImage);
        $container.on('dragover dragenter', dragOut);
        $('.refs').on('dragover dragenter', dragIn);
        //        $(window).on('paste', pasteImage);
        setFlyoutMenu();
        setContextMenu();
        //        csInterface.registerKeyEventsInterest(JSON.stringify(keyCodes));
        $(window).keydown(function (e) {
            console.log(e.keyCode);
            if (e.keyCode == 86 && e.ctrlKey) {
                pasteImage();
            }
        });
    }

    init();

})();
