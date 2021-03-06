/*global $, CSInterface, themeManager, CSEvent, fabric*/
/*eslint no-loop-func: 0*/

(function () {
    'use strict';
    //TODO: Include layers w/ DnD functions
    //TODO: Move all images to view button
    var csInterface = new CSInterface(),
        cepEngine = window.cep.fs,
        $container = $('#content'),
        $autosave = $('#autosave'),

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
            width: 300,
            height: 535,
            backgroundColor: '#2b2b2b',
            rotationCursor: 'url("./icons/PSrotatecursor.cur"), crosshair',
            selectionKey: 'ctrlKey'
        }),
        canW = canvas.getWidth(),
        canH = canvas.getHeight(),
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

        //TODO: Add undo/redo options?
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

        ////// Responsive Canvas //////
        getDimensions = function () {
            var divWidth = $('#content').outerWidth(),
                divHeight = $('#content').outerHeight(),
                flexW,
                flexH;

            switch (true) {
                case (divWidth > 535):
                case (divHeight > 638):
                case (divHeight < 635):
                    flexW = divWidth - 100;
                    flexH = divHeight - 40;
                    break;
                case (canW > divWidth):
                    flexW = divWidth - 100;
                    flexH = (flexW * canH) / canW;
                    break;
                default:
                    flexW = canW;
                    flexH = canH;
            }
            return [flexW, flexH];
        },
        resizeCanvas = function () {
            var dimensions = getDimensions(),
                width = dimensions[0],
                height = dimensions[1],
                zoom = (width / canW) > 1.1 ? 1.1 : (width / canW);

            if (zoom != 1) {
                canvas.setDimensions({
                    width: width,
                    height: height
                }).setZoom(zoom).calcOffset().renderAll();
            }

        },


        ///////// IMAGES /////////

        // Reset image angle
        resetAngle = function () {
            var obj = canvas.getActiveObject();
            canvas.straightenObject(obj);
        },

        // Flip Images
        flipX = function () {
            var selected = canvas.getActiveObjects();
            if (selected) {
                selected.forEach(function (obj) {
                    obj.set('flipX', true);
                    canvas.renderAll();
                });
            } else {
                alert('No images selected');
            }
        },
        flipY = function () {
            var selected = canvas.getActiveObjects();
            if (selected) {
                selected.forEach(function (obj) {
                    obj.set('flipY', true);
                    canvas.renderAll();
                });
            } else {
                alert('No images selected');
            }
        },

        // Check for images & update menus
        readRefs = function () {
            var refs = canvas.getObjects();
            if (refs) {
                csInterface.updateContextMenuItem('saveBoard', true, false);
                csInterface.updatePanelMenuItem('Create New Board', true, false);
            } else {
                csInterface.updateContextMenuItem('saveBoard', false, false);
                csInterface.updatePanelMenuItem('Create New Board', false, false);
            }
        },

        // Open from file
        addRef = function () {
            var fileTypes = ['gif', 'jpg', 'jpeg', 'png', 'bmp'],
                refs = cepEngine.showOpenDialog(true, false, 'Open References', '', fileTypes),
                images = refs.data;

            if (images.length) {
                canvas.remove(introTxt);
                for (var i = 0; i < images.length; i++) {
                    var url = images[i];
                    fabric.Image.fromURL(url, function (img) {
                        img.scaleToWidth(400);
                        canvas.add(img).centerObject(img);
                        img.setCoords();
                        canvas.renderAll();
                    }, imgAttrs);
                }
            } else {
                return false;
            }
            readRefs();
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
                    canvas.setActiveObject(imgInst).renderAll();

                    var fs = require('fs'),
                        path = require('path'),
                        dir = path.join(__dirname, '..', 'referenceWindow', 'refs'),
                        folder = fs.readdirSync(dir),
                        refNum = ++folder.length,
                        imgPath = path.join(__dirname, '..', 'referenceWindow', 'refs', 'pasted-ref_' + refNum + '.png'),
                        refsize = imgInst.getBoundingRect(),
                        nodeData = canvas.toDataURL({
                            top: refsize.top + 5,
                            left: refsize.left + 5,
                            width: refsize.width - 10,
                            height: refsize.height - 10
                        }),
                        nodeImg = nodeData.replace(/^data:image\/(png|jpg);base64,/, '');

                    // Write image file
                    fs.writeFile(imgPath, nodeImg, {
                        encoding: 'base64',
                        flag: 'w+'
                    }, function (err) {
                        if (err) {
                            throw err;
                        }
                    });
                    // Change src so image is viewable upon reopening
                    img.src = imgPath;
                }, imgAttrs);
            }
            readRefs();
        },

        // Deleting
        deleteImage = function () {
            var selected = canvas.getActiveObjects();
            if (selected) {
                if (confirm('Deleted selected image(s)?')) {
                    canvas.remove(...selected);
                }
            }
            canvas.discardActiveObject().renderAll();
            readRefs();
        },
        deleteAll = function () {
            var objs = canvas.getObjects();
            if (confirm('Delete all images?')) {
                canvas.remove(...objs).renderAll();
            }
            readRefs();
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
            readRefs();

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
        bringtoView = function () {
            canvas.forEachObject(function (obj) {
                var vptest = obj.isOnScreen();
                if (vptest === false) {
                    canvas.viewportCenterObject(obj).renderAll();
                } else {
                    return;
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

        //TODO: Add save/open/delete board funcs

        // Autosave board files
        updateBoard = function (json) {
            var fs = require('fs'),
                path = require('path'),
                stream = fs.createWriteStream(path, {
                    flags: 'a'
                });

            stream.write(json);
            console.log('File saving');
        },

        // Save/Open/Delete Boards
        saveboard = function () {
            var fs = require('fs'),
                path = require('path'),
                filename,
                dir = path.join(__dirname, '..', 'referenceWindow', 'boards'),
                jsondata = JSON.stringify(canvas.toJSON(['originX', 'originY', 'borderColor', 'cornerColor', 'padding', 'cornerSize', 'cornerStyle', 'transparentCorners', 'lockUniScaling']));
            //                saveprompt = prompt('Give this board a name: '),
            //                boardFile = path.join(dir, saveprompt + '.json');

            /*            if (saveprompt) {
                            fs.writeFileSync(boardFile, jsondata);
                            $autosave.prop({
                                disabled: false,
                                checked: true
                            });
                        }*/


            $.fancyprompt({
                title: 'Save New Reference Board',
                message: '<label>Board Name: <input type="text" id="boardname" class="topcoat-text-input--large" required/></label>',
                okButton: 'Save',
                noButton: 'Cancel',
                getData: function (result) {
                    if (result) {
                        filename = $('#boardname').val();
                    }
                    return filename;
                },
                callback: function (result) {
                    var file = path.join(dir, filename + '.json');

                    if (result) {
                        fs.writeFileSync(file, jsondata);
                        $autosave.prop({
                            disabled: false,
                            checked: true
                        });
                    }
                }
            });

        },
        openboard = function () {
            var fs = require('fs'),
                path = require('path'),
                dir = path.join(__dirname, '..', 'referenceWindow', 'boards'),
                //                $dropdown = $('#boardfiles'),
                folder = fs.readdirSync(dir),
                refs = [],
                file,
                options = function () {
                    folder.forEach(function (ref) {
                        refs.push(`<option>${ref}</option>`);
                    });

                    return refs;
                };

            options();
            var mssg = `<label class="topcoat-dropdown-label" for="boards">Board List: </label>
                <select class="topcoat-dropdown" id="boards">${refs}</select>`;

            $.fancyprompt({
                title: 'Open Reference Board',
                message: mssg,
                okButton: 'Open',
                noButton: 'Cancel',
                getData: function (result) {
                    if (result) {
                        file = $('select').val();
                    }
                    return file;
                },
                callback: function (result) {
                    var filepath = path.join(__dirname, '..', 'referenceWindow', 'boards', file);

                    if (result) {
                        $.getJSON(filepath, (data) => {
                            canvas.loadFromJSON(JSON.stringify(data), function () {
                                canvas.renderAll();
                            });

                            $autosave.prop({
                                disabled: false,
                                checked: true
                            });
                        });
                    }
                }
            });

        },
        newboard = function () {
            var objs = canvas.getObjects(),
                confirm = confirm('Open a new board (current images will be removed)?');
            if (objs) {
                if (confirm) {
                    canvas.remove(...objs).renderAll();
                }
            }
        },
        deleteboard = function () {
            var fs = require('fs'),
                path = require('path'),
                dir = path.join(__dirname, '..', 'referenceWindow', 'boards'),
                //                $dropdown = $('#boardfiles'),
                folder = fs.readdirSync(dir),
                refs = [],
                file,
                options = function () {
                    folder.forEach(function (ref) {
                        refs.push(`<option>${ref}</option>`);
                    });

                    return refs;
                };

            options();
            var mssg = `<label class="topcoat-dropdown-label" for="boards">Board List: </label>
                <select class="topcoat-dropdown" id="boards">${refs}</select>`;

            $.fancyprompt({
                title: 'Open Reference Board',
                message: mssg,
                okButton: 'Open',
                noButton: 'Cancel',
                getData: function (result) {
                    if (result) {
                        file = $('select').val();
                    }
                    return file;
                },
                callback: function (result) {
                    var filepath = path.join(__dirname, '..', 'referenceWindow', 'boards', file);

                    if (result) {
                        fs.unlinkSync(filepath);
                    }
                }
            });

        },

        ///////// PS INTERACTION /////////
        //TODO: Create seperate flyout menu variable
        menuXML = '<Menu>' +
        //        '<MenuItem Id="undo" Label="Undo" Enabled="true"/>' +
        //        '<MenuItem Id="redo" Label="Redo" Enabled="true"/>' +
        //        '<MenuItem Label="---" />' +
        `<MenuItem Id="addRef" Label="Add Image" Enabled="true"/>
        <MenuItem Id="fwd" Label="Bring Forward" Enabled="true"/>
        <MenuItem Id="back" Label="Send Backward" Enabled="true"/>
        <MenuItem Id="findimgs" Label="Find Off-Screen Images" Enabled="true"/>
        <MenuItem Id="flipX" Label="Flip Horizontally" Enabled="true"/>
        <MenuItem Id="flipY" Label="Flip Vertically" Enabled="true"/>
        <MenuItem Label="---" />
        <MenuItem Id="deleteRef" Label="Delete Selected" Enabled="true"/>
        <MenuItem Id="deleteAll" Label="Delete All" Enabled="true"/>
        <MenuItem Label="---" />
        <MenuItem Id="saveBoard" Label="Create New Board" Enabled="false"/>
        <MenuItem Id="openBoard" Label="Open Board" Enabled="false"/>
        <MenuItem Label="---" />
        <MenuItem Id="helpBox" Label="Help" Enabled="true"/>
        </Menu>`,
        flyMenu = `<Menu>
        <MenuItem Id="addRef" Label="Add Image" Enabled="true"/>
        <MenuItem Id="fwd" Label="Bring Forward" Enabled="true"/>
        <MenuItem Id="back" Label="Send Backward" Enabled="true"/>
        <MenuItem Id="findimgs" Label="Find Off-Screen Images" Enabled="true"/>
        <MenuItem Label="---" />
        <MenuItem Id="deleteRef" Label="Delete Selected" Enabled="true"/>
        <MenuItem Id="deleteAll" Label="Delete All" Enabled="true"/>
        <MenuItem Label="---" />
        <MenuItem Id="saveBoard" Label="Create New Board" Enabled="false"/>
        <MenuItem Id="openBoard" Label="Open Board" Enabled="false"/>
        <MenuItem Id="deleteBoard" Label="Delete Board" Enabled="false"/>
        </Menu>`,
        flyoutCallbacks = function (e) {
            switch (e.data.menuId) {
                case "addRef":
                    addRef();
                    break;
                case "fwd":
                    bringFwd();
                    break;
                case "back":
                    sendback();
                    break;
                case "findimgs":
                    bringtoView();
                    break;
                case "deleteRef":
                    deleteImage();
                    break;
                case "deleteAll":
                    deleteAll();
                    break;
                case "saveBoard":
                    saveboard();
                    break;
                case "openBoard":
                    openboard();
                    break;
                case "deleteBoard":
                    deleteboard();
                    break;
                case "helpbox":
                    csInterface.evalScript('fyi()');
                    break;
            }

        },
        contextCallbacks = function (menuID) {
            switch (menuID) {
                case "addRef":
                    addRef();
                    break;
                case "fwd":
                    bringFwd();
                    break;
                case "back":
                    sendback();
                    break;
                case "findimgs":
                    bringtoView();
                    break;
                case "flipX":
                    flipX();
                    break;
                case "flipY":
                    flipY();
                    break;
                case "deleteRef":
                    deleteImage();
                    break;
                case "deleteAll":
                    deleteAll();
                    break;
                case "saveBoard":
                    saveboard();
                    break;
                case "openBoard":
                    openboard();
                    break;
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
        //        persist(true);

        ///////// MENUS /////////
        csInterface.setPanelFlyoutMenu(flyMenu);
        csInterface.addEventListener("com.adobe.csxs.events.flyoutMenuClicked", flyoutCallbacks);
        csInterface.setContextMenu(menuXML, contextCallbacks);

        // Grab keyEvents
        csInterface.registerKeyEventsInterest(JSON.stringify(keyCodes));

        ///////// CANVAS /////////
        introCanvas();
        $(window).resize(resizeCanvas);

        ///////// BUTTONS /////////
        $("#openref").click(addRef);
        $('#delref').click(deleteImage);
        $("#newbrd").click(saveboard);
        $("#openbrd").click(openboard);
        $("#blankbrd").click(newboard);
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

        // Turn on autosave if Switched on
        if ($autosave.is(':checked')) {
            var jsondata = JSON.stringify(canvas.toJSON(['originX', 'originY', 'borderColor', 'cornerColor', 'padding', 'cornerSize', 'cornerStyle', 'transparentCorners', 'lockUniScaling']));
            setInterval(function () {
                updateBoard(jsondata);
            }, 30000);
        } else {
            clearInterval(updateBoard);
        }

    }

    init();

})();
