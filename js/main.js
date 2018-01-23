/*global $, CSInterface, themeManager, CSEvent, fabric*/
/*eslint no-loop-func: 0*/

(function () {
    'use strict';
    //TODO: Add save/open/delete board funcs
    //TODO: Include layers w/ DnD functions
    //TODO: Move all images to view button
    //TODO:[x] Replace 'Paste' option with bring forward
    //TODO: Add undo/redo options?
    var csInterface = new CSInterface(),
        cepEngine = window.cep.fs,
        $container = $('#content'),

        ///////// CANVAS /////////
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
        canvas = new fabric.Canvas('canvas', {
            width: 325,
            height: 540,
            backgroundColor: null,
            rotationCursor: 'url("./icons/PSrotatecursor.cur"), crosshair',
            selectionKey: 'ctrlKey'
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
            hoverCursor: 'auto',
            selectable: false
        }),

        introCanvas = function () {
            canvas.add(introTxt).centerObject(introTxt);
            canvas.renderAll();
        },

        // Undo/Redo vars
        /*status, //current state
        undos = [],
        redos = [],
        updateStatus = function () {
            // Clear redo array & disable buttons
            redos = [];
            csInterface.updateContextMenuItem('redo', false, false);
            csInterface.updatePanelMenuItem('Redo', false, false);
            if (status) {
                undos.push(status);
                csInterface.updateContextMenuItem('undo', false, false);
                csInterface.updatePanelMenuItem('Undo', false, false);
            }
            status = JSON.stringify(canvas);
        },
        history = function (onstack, offstack, onbttn, offbttn) {
            offstack.push(status);
            status = onstack.pop();
            canvas.loadFromJSON(status, function () {
                canvas.renderAll();

            });
        },*/
        /*findCanvasWidth = function () {
            var currentWidth = $container.outerWidth();
            var canW = 0;
            var canH = 0;
            if (canvas.canW > currentWidth) {
                canW = currentWidth;
                canH = (canW * canvas.canH) / canvas.canW;
            } else {
                canW = canvas.canW;
                canH = canvas.canH;
            }
            return [canW, canH];
        },
*/
        resizeCanvas = function () {
            //Inital window size = 400x600 (WxH)
            //Initial canvas size 325x540
            /*var widthCalc = $container.width() / canvas.width,
                heightCalc = ($container.height() / canvas.height) - 60,
                objects = canvas.getObjects(),
                $refs = $('.refs');
            for (var i in objects) {
                objects[i].scaleX = objects[i].scaleX * widthCalc;
                objects[i].scaleY = objects[i].scaleY * heightCalc;
                objects[i].left = objects[i].left * widthCalc;
                objects[i].top = objects[i].top * heightCalc;
                objects[i].setCoords();
            }

            $refs.css({
                width: (canvas.getWidth() * widthCalc),
                height: (canvas.getHeight() * heightCalc)
            });
            canvas.setWidth(canvas.getWidth() * widthCalc);
            canvas.setHeight(canvas.getHeight() * heightCalc);
            canvas.renderAll();
            canvas.calcOffset();*/
            var winW = $(window).width(),
                winH = $(window).height(),
                canW = winW - 75,
                canH = winH - 75,
                zoom;

            switch (true) {
                case winW < 400:
                    zoom = canH / winH;
                    break;
                case winW > 400:
                    zoom = winH / canH;
                    break;
                case winH < 600:
                    zoom = canW / winW;
                    break;
                case winH > 600:
                    zoom = winW / canW;
                    break;
                default:
                    zoom = 1;
            }

            /*if (winW < 600) {
                zoom = canH / winH;

                if ((zoom * canW) > winW) {
                    zoom = winW / canW;
                }

            } else {
                zoom = winW / canW;

                if ((zoom * canH) > winH) {
                    zoom = winH / canH;
                }
            }*/
            canvas.setWidth(canW).setHeight(canH).setZoom(zoom);
        },

        resetAngle = function () {
            var obj = canvas.getActiveObject();
            canvas.straightenObject(obj);
        },

        ///////// IMAGES /////////
        // Open from file
        openImage = function () {
            var fileTypes = ['gif', 'jpg', 'jpeg', 'png', 'bmp'],
                refs = cepEngine.showOpenDialog(true, false, 'Open References', '', fileTypes),
                images = refs.data;

            if (images.length) {
                canvas.remove(introTxt);
                for (var i = 0; i < images.length; i++) {
                    var url = images[i];
                    fabric.Image.fromURL(url, function (img) {
                        img.scaleToWidth(325);
                        canvas.add(img).centerObject(img);
                        img.setCoords();
                        canvas.renderAll();
                    }, imgAttrs);
                }
            } else {
                return false;
            }
        },

        // Pasting
        pasteImage = function (e) {
            var items = e.originalEvent.clipboardData.items;

            e.preventDefault();
            e.stopPropagation();
            canvas.remove(introTxt);

            //Loop through files
            for (var i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') == -1) {
                    continue;
                }
                var file = items[i],
                    imageData = file.getAsFile(),
                    URLobj = window.URL || window.webkitURL,
                    img = new Image();
                img.src = URLobj.createObjectURL(imageData);
                fabric.Image.fromURL(img.src, function (imgInst) {
                    imgInst.scaleToWidth(325);
                    canvas.add(imgInst).centerObject(imgInst);
                    imgInst.setCoords();
                    canvas.renderAll();
                }, imgAttrs);
            }
        },

        // Deleting
        deleteImage = function () {
            var selected = canvas.getActiveObjects(),
                selGroup = new fabric.ActiveSelection(selected, {
                    canvas: canvas
                });
            if (selGroup) {
                if (confirm('Deleted selected image(s)?')) {
                    selGroup.forEachObject(function (obj) {
                        canvas.remove(obj);
                    });
                }
            } else {
                return false;
            }
            canvas.discardActiveObject().renderAll();
        },
        deleteAll = function () {
            if (confirm('Delete all images?')) {
                canvas.clear();
            }
        },

        // Drag-n-Drog
        dropImage = function (e) {
            var files = e.originalEvent.dataTransfer.files;
            e = e || window.event;

            e.preventDefault();
            e.stopPropagation();
            canvas.remove(introTxt);
            $('.refs').removeClass('highlight');

            // Filereader function
            function loadReader(event) {
                var img = new Image();
                img.src = event.target.result;
                img.onload = function () {
                    var imgInstance = new fabric.Image(img, imgAttrs);
                    imgInstance.scaleToWidth(325);
                    canvas.add(imgInstance).centerObject(imgInstance);
                    imgInstance.setCoords();
                    canvas.renderAll();
                };
            }


            //Loop through files
            for (var i = 0; i < files.length; i++) {
                var file = files[i],
                    reader = new FileReader();
                reader.onload = loadReader;
                reader.readAsDataURL(file);
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

        // Place objects on screen
        putOnScreen = function () {
            canvas.forEachObject(function (obj) {
                if (obj.isOnScreen()) {
                    return;
                } else {
                    canvas.viewportCenterObject(obj).renderAll();
                }
            });
        },

        // Z-index Placement
        //FIXME: Fwd/Bkwd functions
        bringFwd = function () {
            var obj = canvas.getActiveObject();
            canvas.bringForward(obj);
            obj.setCoords();
            canvas.renderAll();
        },
        sendback = function () {
            var obj = canvas.getActiveObject();
            canvas.sendBackwards(obj);
            obj.setCoords();
            canvas.renderAll();
        },

        ///////// PS INTERACTION /////////
        menuXML = '<Menu>' +
        //        '<MenuItem Id="undo" Label="Undo" Enabled="true"/>' +
        //        '<MenuItem Id="redo" Label="Redo" Enabled="true"/>' +
        //        '<MenuItem Label="---" />' +
        '<MenuItem Id="addRef" Label="Add Image" Enabled="true"/>' +
        '<MenuItem Id="fwd" Label="Bring Forward" Enabled="true"/>' +
        '<MenuItem Id="back" Label="Send Backward" Enabled="true"/>' +
        '<MenuItem Id="findimgs" Label="Find Off-Screen Images" Enabled="true"/>' +
        '<MenuItem Id="deleteRef" Label="Delete Selected" Enabled="true"/>' +
        '<MenuItem Id="deleteAll" Label="Delete All" Enabled="true"/>' +
        '<MenuItem Label="---" />' +
        '<MenuItem Id="saveBoard" Label="Save Board" Enabled="false"/>' +
        '<MenuItem Id="openBoard" Label="Open Board" Enabled="false"/>' +
        '<MenuItem Id="deleteBoard" Label="Delete Board" Enabled="false"/>' +
        '<MenuItem Label="---" />' +
        '<MenuItem Id="helpBox" Label="Help" Enabled="true"/>' +
        '</Menu>',
        flyoutCallbacks = function (e) {
            switch (e.data.menuId) {
                case "addRef":
                    openImage();
                    break;
                case "fwd":
                    bringFwd();
                    break;
                case "back":
                    sendback();
                    break;
                case "findimgs":
                    putOnScreen();
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

        },
        contextCallbacks = function (menuID) {
            switch (menuID) {
                case "addRef":
                    openImage();
                    break;
                case "fwd":
                    bringFwd();
                    break;
                case "back":
                    sendback();
                    break;
                case "findimgs":
                    putOnScreen();
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

        },
        keyCodes = [
            {
                "keyCode": 86,
                "ctrlKey": true
            },
            {
                "keyCode": 46
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
            //        Use persist(true); to turn on persistence
        };



    //////////// INIT ////////////

    function init() {
        themeManager.init();
        //persist(true);

        ///////// MENUS /////////
        csInterface.setPanelFlyoutMenu(menuXML);
        csInterface.addEventListener("com.adobe.csxs.events.flyoutMenuClicked", flyoutCallbacks);
        csInterface.setContextMenu(menuXML, contextCallbacks);

        // Grab keyEvents
        csInterface.registerKeyEventsInterest(JSON.stringify(keyCodes));

        ///////// CANVAS /////////
        introCanvas();
        $(window).resize(resizeCanvas);

        ///////// BUTTONS /////////
        $("#openref").click(openImage);
        $('#delref').click(deleteImage);
        $("#infobttn").click(function () {
            csInterface.evalScript('fyi()');
        });
        $('#refresh').click(function () {
            window.location.reload(true);
        });

        ///////// IMAGES /////////
        $('.refs').on('dragover dragenter', dragIn);
        $container.on('dragover dragenter', dragOut);
        $('.refs').on('drop', dropImage);
        $(window).on('paste', pasteImage);
        // Delete w/ delete button
        $(window).keyup(function (e) {
            e.preventDefault();
            if (e.key == "Delete") {
                deleteImage();
            }
        });
        canvas.on('mouse:dblclick', resetAngle);

    }

    init();

})();
