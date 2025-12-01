// get url parameters

var state = 0;

function getUrlVars() {
    var vars = {};
    var parts = window.location.href.replace(/[?=&]+([^=&]+)=([^&]*)/gi, function(m,key,value) {
        vars[key] = value;
    });

    if(window.location.href.includes("/labelingV?")){
        state = 1; //labeling validation mode
    }
    else{
        state = 0; //regular labeling mode
    }
    return vars;
}

// get classes and current class
var classes = document.getElementsByClassName('class-selection'),
	classNames = document.getElementsByClassName('selected-class'),
	temp = $('.classes');
    curr_class = getUrlVars()["curr_class"];

var allClasses = []
for(var i = 0; i<temp.length; i++)
{
	allClasses.push(temp[i].value);
}

// if current class wasn't set as a parameter in the url, then set current class as the first class
if (curr_class == undefined) {
	curr_class = allClasses[0];
	// curr_class = curr_class[0].value;
	//console.log(curr_class);
}
else {
    curr_class = curr_class;
}

//console.log("classes: ", classes);
//console.log("classNames", classNames);
//console.log("curr_class: ", curr_class);
//console.log("allClasses: ", allClasses);
// set url parameters
function updateURLParameter(url, param, paramVal){
    var newAdditionalURL = "";
    var tempArray = url.split("?");
    var baseURL = tempArray[0];
    var additionalURL = tempArray[1];
    var temp = "";
    if (additionalURL) {
        tempArray = additionalURL.split("&");
        for (var i=0; i<tempArray.length; i++){
            if(tempArray[i].split('=')[0] != param){
                newAdditionalURL += temp + tempArray[i];
                temp = "&";
            }
        }
    }

    var rows_txt = temp + "" + param + "=" + paramVal;
    return baseURL + "?" + newAdditionalURL + rows_txt;
}

// hex to rgba
function hex2rgba(hex, o){
    var c;
    if(/^#([A-Fa-f0-9]{3}){1,2}$/.test(hex)){
        c= hex.substring(1).split('');
        if(c.length== 3){
            c= [c[0], c[0], c[1], c[1], c[2], c[2]];
        }
        c= '0x'+c.join('');
        return 'rgba('+[(c>>16)&255, (c>>8)&255, c&255].join(',')+','+o+')';
    }
    throw new Error('Bad Hex');
}

var ShapeDrawer = (function () {
    function ShapeDrawer(canvas, shapeStrategy) {
        this.canvas = canvas;
        this.shapeStrategy = shapeStrategy;
        this.isDrawing = false;
        this.curr_object = -1;
        this.currentDrawingShape = null;
        this.bindEvents();
    }

    ShapeDrawer.prototype.bindEvents = function () {
        var inst = this;
        inst.canvas.on('mouse:down', function (o) {
            inst.onMouseDown(o);
        });
        inst.canvas.on('mouse:move', function (o) {
            inst.onMouseMove(o);
        });
        inst.canvas.on('mouse:up', function (o) {
            inst.onMouseUp(o);
        });
        inst.canvas.on('object:moving', function (o) {
            inst.disable();
        });
        inst.canvas.on('mouse:hover', function (o) {
            //console.log('mouse:hover')
        });
        inst.canvas.on('mouse:wheel', function (o) {
            inst.onMouseWheel(o);
        });
    };

    
    ShapeDrawer.prototype.onMouseUp = function (o) {
        console.log("[onMouseUp ]Mouse up is disabled");
        return;
        
        // console.log(`[onMouseUp] Called`);
        // console.log(`[onMouseUp] isDrawing: ${this.isDrawing}`);
        // console.log(`[onMouseUp] currentDrawingShape: ${this.currentDrawingShape}`);
        
        // var inst = this;
        
        // // Use currentDrawingShape instead of getActiveObject
        // if(inst.currentDrawingShape != null) {
        //     var activeObj = inst.currentDrawingShape;
        //     console.log(`[onMouseUp] activeObj.id: ${activeObj.id}`);
        //     console.log(`[onMouseUp] activeObj.isTemporaryRect: ${activeObj.isTemporaryRect}`);
        
        //     // If strategy has finalizeShape method call it
        //     if (inst.shapeStrategy.finalizeShape && activeObj.isTemporaryRect) {
        //         // Check if the shape has at least 3 points and is closed (for polygons)
        //         var canFinalize = true;
        //         if (activeObj.points && Array.isArray(activeObj.points)) {
        //             var pointCount = activeObj.points.length;
        //             console.log(`[onMouseUp] Points count: ${pointCount}`);
                    
        //             if (pointCount < 3) {
        //                 canFinalize = false;
        //                 console.log(`[onMouseUp] Not enough points to finalize (need at least 3)`);
        //             } else {
        //                 // Check if last point is near first point (polygon is closed)
        //                 var firstPoint = activeObj.points[0];
        //                 var lastPoint = activeObj.points[pointCount - 1];
        //                 var threshold = 10; // Distance threshold in pixels
                        
        //                 var distance = Math.sqrt(
        //                     Math.pow(lastPoint.x - firstPoint.x, 2) + 
        //                     Math.pow(lastPoint.y - firstPoint.y, 2)
        //                 );
                        
        //                 console.log(`[onMouseUp] Distance between first and last point: ${distance}`);
                        
        //                 if (distance > threshold) {
        //                     canFinalize = false;
        //                     console.log(`[onMouseUp] Polygon not closed (distance: ${distance} > threshold: ${threshold})`);
        //                 } else {
        //                     console.log(`[onMouseUp] Polygon is closed`);
        //                 }
        //             }
        //         }
                
        //         if (canFinalize) {
        //             console.log(`[onMouseUp] Calling finalizeShape`);
        //             activeObj = inst.shapeStrategy.finalizeShape(activeObj, inst.canvas);
        //             // Update the reference after finalization
        //             inst.currentDrawingShape = activeObj;
        //         }
        //     }

        //     // Check if label inputs already exist
        //     if ($(".label-"+activeObj.id).length == 6){
        //         console.log(`[onMouseUp] Label already exists`);
        //     } else {
        //         console.log(`[onMouseUp] Creating label inputs for width and height`);
        //         var w = activeObj.width;
        //         var h = activeObj.height;
                
        //         $('#dynamic_form').append(
        //             '<input class="labels label-'+activeObj.id+' label-w" type="hidden" name="W" value="' + (w/diff_width_ratio) + '">' +
        //             '<input class="labels label-'+activeObj.id+' label-h" type="hidden" name="H" value="' + (h/diff_width_ratio) + '">'
        //         );

        //         activeObj.lockMovementX = true;
        //         activeObj.lockMovementY = true;
        //     }
            
        //     // Clear the current drawing shape reference
        //     inst.currentDrawingShape = null;
        // }
        
        // inst.disable();
        // console.log(`[onMouseUp] isDrawing set to: ${inst.isDrawing}`);
    };


    ShapeDrawer.prototype.onMouseDown = function (o) {
        var inst = this;
        console.log(`[onMouseDown] Is drawing: ${inst.isDrawing}`);
        console.log(`[onMouseDown] Target: ${o.target}`);
        
        // Case 1: Already in polygon drawing mode
        if (inst.isDrawing) {
            console.log(`[onMouseDown] Already drawing, checking for polygon interaction`);
            
            // If we have a shape being drawn and the strategy supports adding points
            if (inst.currentDrawingShape && inst.shapeStrategy.addPoint) {
                console.log(`[onMouseDown] Calling addpoint`);
                var pointer = inst.canvas.getPointer(o.e);
                console.log(`[onMouseDown] Pointer: (${pointer.x}, ${pointer.y})`);
                
                var result = inst.shapeStrategy.addPoint(inst.currentDrawingShape, pointer, inst.canvas);
                console.log(`[onMouseDown] addpoint returned:`, result);
                
                if (result && result.segmentationComplete) {
                    console.log(`[onMouseDown] polygon finalized`);
                    inst.currentDrawingShape = null;  // Clear the reference
                    inst.disable();
                }
                return;
            }
            
            if (o.target && (o.target.excludeFromExport || o.target.polygonId)) {
                console.log(`[onMouseDown] clicked on point marker, ignoring`);
                inst.disable();
                return;
            }
            return;
        }
        
        // Case 2: Not drawing yet
        if (o.target == null) {
            console.log(`[onMouseDown] STARTING NEW POLYGON`);
            
            if(inst.curr_object != -1) {
                for (var i = inst.canvas.getObjects().length - 1; i >= 0; i--) {
                    var obj = inst.canvas.item(i);
                    if (!obj) continue;
                    if (obj.id == inst.curr_object) {
                        obj.set({ fill: 'transparent' });
                    }
                    if (obj.get && obj.get("type") === 'text') {
                        inst.canvas.remove(obj);
                    }
                }
            }

            inst.enable();
            console.log(`[onMouseDown] ENABLED - isDrawing now: ${inst.isDrawing}`);
            
            var pointer = inst.canvas.getPointer(o.e);
            origX = pointer.x;
            origY = pointer.y;
            var id = Math.floor(Math.random() * (1000000000 - 100000)) + 100000;

            var shape = inst.shapeStrategy.createShape(id, pointer, curr_class, allClasses, inst.canvas);
            counter += 1;
            addLabelToForm(id, curr_class, origX, origY, diff_width_ratio);
            
            $('#labels-counter').val(counter);
            inst.curr_object = id;
            inst.canvas.add(shape).setActiveObject(shape);

            inst.currentDrawingShape = shape;
            console.log(`[onMouseDown] stored reference ready for more points.`);
        } else {
            console.log(`[onMouseDown] clicked on existing object: ${o.target.id}`);
            
            if(inst.curr_object != -1) {
                for (var i = inst.canvas.getObjects().length - 1; i >= 0; i--) {
                    var obj = inst.canvas.item(i);
                    if (!obj) continue;
                    if (obj.id == inst.curr_object) {
                        obj.set({ fill: 'transparent' });
                    }
                    if (obj.get && obj.get("type") === 'text') {
                        inst.canvas.remove(obj);
                    }
                }
            }
            
            if (o.target.excludeFromExport || o.target.polygonId) {
                console.log(`[onMouseDown] ignoring clicked on point marker`);
                return;
            }
            
            inst.curr_object = o.target.id;
            o.target.set({ fill: o.target.stroke.replace(')', ', 0.33)').replace('rgb', 'rgba')});
            
            if(state == 1){
                var text = new fabric.Text(String(o.target.class) + " (" + String(o.target.id) +  ")", {
                    id: o.target.id,
                    selectable: false,
                    textAlign: 'center',
                    backgroundColor: "white",
                });
            } else {
                var text = new fabric.Text(String(o.target.class), {
                    id: o.target.id,
                    selectable: false,
                    textAlign: 'center',
                    backgroundColor: "white",
                });
            }

            while (((text.height > o.target.height) || (text.width > o.target.width)) && text.fontSize > 18) {
                text.set("fontSize", text.fontSize-1);
            }
            text.set("width", o.target.width);
            text.set("top", (o.target.top + (o.target.height / 2)) - (text.height / 2));
            text.set("left", (o.target.left + o.target.width / 2) - (text.width / 2));

            text.lockMovementX = true;
            text.lockMovementY = true;
        
            inst.canvas.add(text);
        }
    };

    ShapeDrawer.prototype.onMouseMove = function (o) {
        var inst = this;
        
        if (!inst.isEnable()) { return; }
        
        if(inst.currentDrawingShape != null) {
            var pointer = inst.canvas.getPointer(o.e);
            var activeObj = inst.currentDrawingShape;

            inst.shapeStrategy.updateShape(activeObj, origX, origY, pointer, inst.canvas);
            
            // Add null check before accessing ID
            if (activeObj.id) {
                $(".label-"+activeObj.id+".label-x").val(activeObj.left/diff_width_ratio);
                $(".label-"+activeObj.id+".label-y").val(activeObj.top/diff_width_ratio);
            }
            
            activeObj.setCoords();

            // Shape styling
            activeObj.stroke = classes[allClasses.indexOf(curr_class)].style.backgroundColor;
            activeObj.strokeWidth = 2 / inst.canvas.getZoom();
            activeObj.fill = activeObj.stroke.replace(')', ', 0.33)').replace('rgb', 'rgba');

            inst.canvas.renderAll();
        }
    };

    function addLabelToForm(id, curr_class, origX, origY, diff_width_ratio) {
        $('#dynamic_form').append(
            '<input class="labels label-'+id+' label-id" type="hidden" name="LabelingID" value="' + id + '">' +
            '<input class="labels label-'+id+' label-c" type="hidden" name="CName" value="' + curr_class + '">' +
            '<input class="labels label-'+id+' label-x" type="hidden" name="X" value="' + (origX/diff_width_ratio) + '">' +
            '<input class="labels label-'+id+' label-y" type="hidden" name="Y" value="' + (origY/diff_width_ratio) + '">'
        );
    }

    ShapeDrawer.prototype.isEnable = function () {
        return this.isDrawing;
    };
    
    ShapeDrawer.prototype.enable = function () {
        this.isDrawing = true;
    };
    
    ShapeDrawer.prototype.disable = function () {
        this.isDrawing = false;
    };
    
    ShapeDrawer.prototype.onMouseWheel = function (o) {
        var delta = o.e.deltaY;
        var pointer = canvas.getPointer(o.e);
        var zoom = canvas.getZoom();
        zoom *= 0.999 ** delta;
        if (zoom > 20) zoom = 20;
        if (zoom < 1) zoom = 1;
        
        canvas.zoomToPoint({ x: o.e.offsetX, y: o.e.offsetY }, zoom);
        canvas.forEachObject(function(obj) {
            if (obj.class != 'text') {
                obj.set('strokeWidth', 2 / zoom);
            }
        });
        o.e.preventDefault();
        o.e.stopPropagation();
        var vpt = this.canvas.viewportTransform;
        
        if (zoom < 1) {
            vpt[4] = new_width * zoom;
            vpt[5] = new_height * zoom;
        } else {
            if (vpt[4] >= 0) {
                vpt[4] = 0;
            } else if (vpt[4] < canvas.getWidth() - new_width * zoom) {
                vpt[4] = canvas.getWidth() - new_width * zoom;
            }
            if (vpt[5] >= 0) {
                vpt[5] = 0;
            } else if (vpt[5] < canvas.getHeight() - new_height * zoom) {
                vpt[5] = canvas.getHeight() - new_height * zoom;
            }
        }
    };
    
    return ShapeDrawer;
})();


var SegmentationStrategy = {
    minPoints: 3,
    
    createShape: function(id, pointer, curr_class, allClasses, canvas) {
        console.log(`[createShape] ID: ${id}, Pointer: (${pointer.x}, ${pointer.y})`);
        
        var points = [];
        
        var point = new fabric.Circle({
            id: id + '_point_0',
            polygonId: id,
            radius: 2,
            fill: '#ffffff',
            stroke: '#000000',
            strokeWidth: 2,
            left: pointer.x,
            top: pointer.y,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            originX: 'center',
            originY: 'center',
            hoverCursor: 'pointer',
            excludeFromExport: true
        });
        
        points.push({x: pointer.x, y: pointer.y, marker: point});
        console.log(`[createShape] Initial points array:`, points);
        console.log(`[createShape] Points length: ${points.length}`);
        
        if (canvas) {
            canvas.add(point);
        }
        
        var polygon = new fabric.Polygon([
            {x: pointer.x, y: pointer.y},
            {x: pointer.x, y: pointer.y}
        ], {
            id: id,
            left: pointer.x,
            top: pointer.y,
            originX: 'left',
            originY: 'top',
            fill: 'transparent',
            stroke: '#000000',
            strokeWidth: 2,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            objectCaching: false,
            class: curr_class,
            classId: allClasses.indexOf(curr_class) + 1,
            isTemporaryRect: true,
            segmentationPoints: points,
            pointMarkers: [point]
        });
        
        console.log(`[createShape] Polygon created. Shape.segmentationPoints:`, polygon.segmentationPoints);
        console.log(`[createShape] Polygon.segmentationPoints.length: ${polygon.segmentationPoints.length}`);
        
        return polygon;
    },
    
    updateShape: function(shape, origX, origY, pointer, canvas) {
        if (!shape || !shape.isTemporaryRect) return;
        
        var x = Math.max(0, Math.min(pointer.x, canvas.getWidth()));
        var y = Math.max(0, Math.min(pointer.y, canvas.getHeight()));
        
        var pts = shape.points.slice();
        pts[pts.length - 1] = {x: x, y: y};
        
        shape.set({ points: pts });
        shape.setCoords();
    },
    
    addPoint: function(shape, pointer, canvas) {
        console.log(`[addPoint] Called. Shape ID: ${shape.id}`);
        console.log(`[addPoint] Shape exists: ${!!shape}`);
        console.log(`[addPoint] Shape.isTemporaryRect: ${shape.isTemporaryRect}`);
        
        if (!shape || !shape.isTemporaryRect) {
            console.log(`[addPoint] EARLY RETURN: Shape is null or not temporary`);
            return shape;
        }
        
        var id = shape.id;
        var curr_class = shape.class;
        
        var points = shape.segmentationPoints || [];
        console.log(`[addPoint] Retrieved points from shape. Length: ${points.length}`);
        console.log(`[addPoint] Current points array:`, points);
        
        var x = Math.max(0, Math.min(pointer.x, canvas.getWidth()));
        var y = Math.max(0, Math.min(pointer.y, canvas.getHeight()));
        console.log(`[addPoint] Constrained pointer: (${x}, ${y})`);
        
        // Check if clicking near first point to close polygon
        if (points.length >= this.minPoints) {
            console.log(`[addPoint] Checking for polygon closure. Points: ${points.length}, Min: ${this.minPoints}`);
            var firstPoint = points[0];
            var distance = Math.sqrt(
                Math.pow(x - firstPoint.x, 2) + 
                Math.pow(y - firstPoint.y, 2)
            );
            console.log(`[addPoint] Distance to first point: ${distance}`);
            
            if (distance < 5) {
                console.log(`[addPoint] POLYGON CLOSED! Distance < 10. Finalizing...`);
                return this.finalizeShape(shape, canvas);
            }
        }
        
        // Create point marker
        var pointMarker = new fabric.Circle({
            id: id + '_point_' + points.length,
            polygonId: id,
            radius: 2,
            fill: '#ffffff',
            stroke: '#000000',
            strokeWidth: 2,
            left: x,
            top: y,
            selectable: false,
            hasBorders: false,
            hasControls: false,
            originX: 'center',
            originY: 'center',
            hoverCursor: 'pointer',
            excludeFromExport: true
        });
        
        console.log(`[addPoint] Created point marker. ID: ${pointMarker.id}`);
        
        points.push({x: x, y: y, marker: pointMarker});
        console.log(`[addPoint] AFTER PUSH - Points length: ${points.length}`);
        console.log(`[addPoint] Points array:`, points);
        
        canvas.add(pointMarker);
        
        // Update polygon points
        var pts = shape.points.slice();
        console.log(`[addPoint] Current polygon.points length: ${pts.length}`);
        pts[pts.length - 1] = {x: x, y: y};
        pts.push({x: x, y: y}); // Add new preview point
        
        console.log(`[addPoint] BEFORE SET - New polygon.points length: ${pts.length}`);
        
        shape.set({
            points: pts,
            segmentationPoints: points
        });
        
        console.log(`[addPoint] AFTER SET - shape.segmentationPoints.length: ${shape.segmentationPoints.length}`);
        console.log(`[addPoint] shape.segmentationPoints:`, shape.segmentationPoints);
        
        shape.setCoords();
        canvas.renderAll();
        
        return shape;
    },
    
    finalizeShape: function(shape, canvas) {
        console.log(`[finalizeShape] Called. Shape ID: ${shape.id}`);
        
        if (!shape || !shape.isTemporaryRect) {
            console.log(`[finalizeShape] EARLY RETURN: Shape is null or not temporary`);
            return shape;
        }
        
        var points = shape.segmentationPoints || [];
        console.log(`[finalizeShape] Final points count: ${points.length}`);
        console.log(`[finalizeShape] Final points:`, points);
        
        var pts = shape.points.slice(0, -1);
        console.log(`[finalizeShape] Polygon points (preview removed): ${pts.length}`);
        
        // Calculate bounding box
        var minX = Math.min.apply(Math, pts.map(function(p) { return p.x; }));
        var maxX = Math.max.apply(Math, pts.map(function(p) { return p.x; }));
        var minY = Math.min.apply(Math, pts.map(function(p) { return p.y; }));
        var maxY = Math.max.apply(Math, pts.map(function(p) { return p.y; }));
        
        var width = maxX - minX;
        var height = maxY - minY;
        
        console.log(`[finalizeShape] Bounding box: (${minX}, ${minY}) to (${maxX}, ${maxY}), Size: ${width}x${height}`);
        
        var normalizedPoints = pts.map(function(p) {
            return {x: p.x - minX, y: p.y - minY};
        });
        
        var finalPolygon = new fabric.Polygon(normalizedPoints, {
            id: shape.id,
            left: minX,
            top: minY,
            originX: 'left',
            originY: 'top',
            width: width,
            height: height,
            fill: 'transparent',
            stroke: shape.stroke,
            strokeWidth: 2,
            selectable: true,
            hasBorders: false,
            hasControls: false,
            objectCaching: false,
            class: shape.class,
            classId: shape.classId,
            segmentationComplete: true,
            segmentationPoints: points
        });
        
        console.log(`[finalizeShape] Final polygon created with ${normalizedPoints.length} points`);
        
        points.forEach(function(pt) {
            if (pt.marker) {
                canvas.remove(pt.marker);
            }
        });
        
        canvas.remove(shape);
        canvas.add(finalPolygon);
        canvas.setActiveObject(finalPolygon);
        
        canvas.renderAll();
        return finalPolygon;
    },
    
    cancelDrawing: function(canvas, shape) {
        console.log(`[cancelDrawing] Called`);
        
        if (!shape) {
            console.log(`[cancelDrawing] No shape provided`);
            return;
        }
        
        var points = shape.segmentationPoints || [];
        console.log(`[cancelDrawing] Removing ${points.length} point markers`);
        
        points.forEach(function(pt) {
            if (pt.marker) {
                canvas.remove(pt.marker);
            }
        });
        
        if (canvas.contains(shape)) {
            canvas.remove(shape);
        }
        
        canvas.renderAll();
    }
};

// Rectangle Strategy
var RectangleStrategy = {
    createShape: function(id, pointer, curr_class, allClasses) {
        return new fabric.Rect({
            id: id,
            left: pointer.x,
            top: pointer.y,
            originX: 'left',
            originY: 'top',
            width: 0,
            height: 0,
            angle: 0,
            transparentCorners: false,
            hasBorders: false,
            hasControls: false,
            selectable: true,
            class: curr_class,
            classId: allClasses.indexOf(curr_class) + 1
        });
    },
    
    updateShape: function(shape, origX, origY, pointer, canvas) {
        var left_x = Math.min(origX, Math.max(pointer.x, 0));
        var top_y = Math.min(origY, Math.max(pointer.y, 0));
        var right_x = Math.max(origX, Math.min(pointer.x, canvas.getWidth()-5));
        var bottom_y = Math.max(origY, Math.min(pointer.y, canvas.getHeight()-5));

        shape.set({ 
            left: left_x,
            top: top_y,
            width: Math.abs(left_x - right_x),
            height: Math.abs(top_y - bottom_y)
        });
        shape.setCoords();
    }
};

// create main canvas
var canvas = new fabric.Canvas('canvas', {
        selection: false
    });

//set available shapes
console.log("Initializing segmentation strategy");
var rectangle = new ShapeDrawer(canvas, SegmentationStrategy);

// set cursor when hover over canvas to cross
canvas.hoverCursor = 'crosshair';

// crosshair lines

var verticalLine = new fabric.Line([0, 0, 0, canvas.height], {
    selectable: false,
    evented: false
});

var horizontalLine = new fabric.Line([0, 0, canvas.width, 0], {
    selectable: false,
    evented: false
});

canvas.add(verticalLine);
canvas.add(horizontalLine);

canvas.on('mouse:move', function (options) {
    var pointer = canvas.getPointer(options.e);
    var classColor = classes[allClasses.indexOf(curr_class)].style.backgroundColor;

    verticalLine.set({ 
        x1: pointer.x, 
        x2: pointer.x, 
        y1: 0,
        y2: canvas.height,
        stroke: classColor
    });

    horizontalLine.set({
        x1: 0,
        x2: canvas.width,
        y1: pointer.y,
        y2: pointer.y,
        stroke: classColor
    });
    canvas.renderAll();

});

// get labels counter and list of labels
var counter = parseInt($('#labels-counter').val()),
    list_labels = $('.labels');

// Define the URL where your background image is located
var imageUrl = $("#image_path").val(),
    scaleFactor = $("#image_ratio").val();

// set the height of the canvas to 75% of the window size originally
var origin_height = $("#origin_image_height").val(),
    origin_width = $("#origin_image_width").val(),
    new_height = $(window).height() * .75,
    new_width = new_height / scaleFactor,
    diff_width_ratio = new_width / origin_width;

// set the width of the canvas to 93% of window size for ultrawide aspect ratio
if(new_width > $(window).width()){
    new_width = $(window).width() * .95,
    new_height = new_width * scaleFactor,
    diff_width_ratio = new_width / origin_width;
}

$("#image_width").val(new_width);
$("#image_height").val(new_height);

canvas.setWidth(new_width);
canvas.setHeight(new_height);

// set background
canvas.setBackgroundImage(imageUrl, canvas.renderAll.bind(canvas), {
    width: $("#canvas").width(),
    height: $("#canvas").height()
});
canvas.calcOffset();

//Converting from .tiff to image
if(imageUrl.includes(".tiff") || imageUrl.includes(".tif") || imageUrl.includes(".SCN")){
    Tiff.initialize({TOTAL_MEMORY: 16777216 * 10});
    var xhr = new XMLHttpRequest();
    xhr.responseType = 'arraybuffer';
    xhr.open('GET', imageUrl);
    xhr.onload = function (e) {
        //console.log(xhr.response)
        var tiff = new Tiff({buffer: xhr.response});
        canvas.setBackgroundImage(tiff.toDataURL(), canvas.renderAll.bind(canvas), {
            width: $("#canvas").width(),
            height: $("#canvas").height()
        });
        canvas.calcOffset();
    };
    xhr.send();
}

// TODO: reize rectangles when canvas is resized
function resizeRectangles(diff_width_ratio){
    //console.log(canvas.getObjects());
    for (var i = 0; i < canvas.getObjects().length; i++) {
        canvas.item(i).lockMovementX = false;
        canvas.item(i).lockMovementY = false;
        canvas.item(i).set({
            left: $(".label-"+canvas.item(i).id+".label-x").val() * diff_width_ratio,
            top: $(".label-"+canvas.item(i).id+".label-y").val() * diff_width_ratio,
            width: $(".label-"+canvas.item(i).id+".label-w").val() * diff_width_ratio,
            height: $(".label-"+canvas.item(i).id+".label-h").val() * diff_width_ratio
        })
        // canvas.item(i).set({
        //     left: $(".label-"+canvas.item(i).id+".label-x").val() * diff_height_ratio,
        //     top: $(".label-"+canvas.item(i).id+".label-y").val() * diff_height_ratio,
        //     width: $(".label-"+canvas.item(i).id+".label-w").val() * diff_height_ratio,
        //     height: $(".label-"+canvas.item(i).id+".label-h").val() * diff_height_ratio
        // })
        text.set("top", o.target.top + o.target.height / 2.5);
        text.set("left", o.target.left + o.target.width / 2.2);

        canvas.item(i).lockMovementX = true;
        canvas.item(i).lockMovementY = true;
        
    }
}
classes[allClasses.indexOf(curr_class)].style.backgroundColor;
// draw all rectangles that came from the database
for (var i = 0; i < list_labels.length; i += 6) {
	console.log("list_labels[i+1]: ", list_labels[i + 1].value);
    var rect = new fabric.Rect({
        id: list_labels[i].value,
        stroke: classes[allClasses.indexOf(list_labels[i + 1].value)].style.backgroundColor,
        strokeWidth: 2 / canvas.getZoom(),
        fill: "transparent",
        left: parseInt(list_labels[i + 2].value) * diff_width_ratio,
        top: parseInt(list_labels[i + 3].value) * diff_width_ratio,
        originX: 'left',
        originY: 'top',
        width: parseInt(list_labels[i + 4].value) * diff_width_ratio,
        height: parseInt(list_labels[i + 5].value) * diff_width_ratio,
        angle: 0,
        transparentCorners: false,
        hasBorders: false,
        hasControls: false,
        selectable: true,
		class: list_labels[i + 1].value,
		classId: allClasses.indexOf(list_labels[i + 1].value) + 1
        // class: parseInt(list_labels[i + 1].value)
    });
    // var rect = new fabric.Rect({
    //     id: list_labels[i].value,
    //     stroke: classes[parseInt(list_labels[i + 1].value)].style.backgroundColor,
    //     strokeWidth: 1,
    //     fill: "transparent",
    //     left: parseInt(list_labels[i + 2].value) * diff_height_ratio,
    //     top: parseInt(list_labels[i + 3].value) * diff_width_ratio,
    //     originX: 'left',
    //     originY: 'top',
    //     width: parseInt(list_labels[i + 4].value) * diff_height_ratio,
    //     height: parseInt(list_labels[i + 5].value) * diff_height_ratio,
    //     angle: 0,
    //     transparentCorners: false,
    //     hasBorders: false,
    //     hasControls: false,
    //     selectable: true,
    //     class: parseInt(list_labels[i + 1].value)
    // });
    rect.lockMovementX = true,
    rect.lockMovementY = true;

	// var text = new fabric.Text(list_labels[i + 1].value, {});
	// text.set("top", parseInt(list_labels[i + 3].value) * diff_width_ratio);
	// text.set("left", parseInt(list_labels[i + 2].value) * diff_width_ratio);

	// var group = new fabric.Group([rect, text])
	// canvas.add(group)
    canvas.add(rect);
    canvas.renderAll();

}
canvas.renderAll();

// change review status
function reviewStatus(){
    console.log("reviewStatus");
    //console.log("before edit")
    //console.log($('#rev_image').val());
    if($('#rev_image').val() == 0){
        $('#rev_image').val(1);
        //console.log("after edit:");
        //console.log($('#rev_image').val());
        document.getElementById("Review").style.backgroundColor = "red";
        $("#form-save").trigger('click');
    }
    else{
        $('#rev_image').val(0);
        //console.log("after edit:");
        //console.log($('#rev_image').val());
        document.getElementById("Review").style.backgroundColor = "white";
        $("#form-save").trigger('click');
    }
}
$(".rev-button").click(reviewStatus);

// selection of class action
$(".class-selection").click(function () {
    $(".class-selection:eq("+allClasses.indexOf(curr_class)+")").removeClass("selected-class");
	// curr_class = parseInt($(this).text().split(":")[0]) - 1;
	curr_class = allClasses[parseInt($(this).text().split(":")[0]) - 1];
    $(this).addClass("selected-class");
    // pass current class to other pages when labeling
    $('.pass-class').each(function(event) {
        var url = $(this).attr('href');
        url = updateURLParameter(url, 'curr_class', curr_class)
        $(this).attr("href", url);
    });

    // update current class in form so when saved the class will be presented the same
    $("#curr_class").val(curr_class);

});

// delete a rect
function deleteObjects() {
    var activeObject = canvas.getActiveObject(),
        activeGroup = canvas.getActiveGroup();
    if (activeObject) {
        if (confirm('Are you sure?')) {
			
            $(".label-"+activeObject.id).remove();
            canvas.remove(activeObject);
            for (var i = 0; i < canvas.getObjects().length; i++) {
                if (canvas.item(i).get("type") === 'text')
                {
                    canvas.remove(canvas.item(i));
                }
            }
            counter -= 1;
            $('#labels-counter').val(counter);
        }
    }
    else if (activeGroup) {
        if (confirm('Are you sure?')) {
            var objectsInGroup = activeGroup.getObjects();
            canvas.discardActiveGroup();
            objectsInGroup.forEach(function (object) {
                canvas.remove(object);
                counter -= 1;
                $('#labels-counter').val(counter);
            });
        }
    }
}

// reset labels action
function resetLabels(){
    if (confirm('Do you want to remove all the labels?')) {
        counter = 0;
        $('#labels-counter').val(counter);
        $( ".labels" ).remove();
        canvas.clear();
        canvas.setBackgroundImage(imageUrl, canvas.renderAll.bind(canvas), {
            width: $("#canvas").width(),
            height: $("#canvas").height()
        });
    }
}
$("#reset-labeling").click(resetLabels);

// undo label action
function undoLabel(){
    canvas.setBackgroundImage(imageUrl, canvas.renderAll.bind(canvas), {
        width: $("#canvas").width(),
        height: $("#canvas").height()
    });
    if($(".labels").length != 0){
        $( ".labels" ).last().remove();
        $( ".labels" ).last().remove();
        $( ".labels" ).last().remove();
        $( ".labels" ).last().remove();
        $( ".labels" ).last().remove();
        for (var i = 0; i < canvas.getObjects().length; i++) {
            if (canvas.item(i).id == $( ".labels" ).last().val()) {
                canvas.item(i).remove();
                break;
            }
        }
        $( ".labels" ).last().remove();
        counter -= 1;
        $('#labels-counter').val(counter);
    }
}
$("#undo-labeling").click(undoLabel);

// Reset Zoom
function resetZoom(){
    canvas.setViewportTransform([1,0,0,1,0,0]); 
    canvas.forEachObject(function(obj) {
        if (obj.class != 'text') {
            obj.set('strokeWidth', 2);
        }
    });
}
$("#reset-zoom").click(resetZoom);

// key mapping
$(document).keydown(function (event) {

    var key = (event.keyCode ? event.keyCode : event.which) - 49;
    //console.log(key)
    if(0 <= key && key < Math.min(10, classes.length)){
        $(".class-selection:eq("+allClasses.indexOf(curr_class)+")").removeClass("selected-class");
        curr_class = allClasses[parseInt(classes[key].innerHTML.split(":")[0])-1];
        $(".class-selection:eq("+key+")").addClass("selected-class");
        // pass current class to other pages when labeling
        $('.pass-class').each(function(event) {
            var url = $(this).attr('href');
            url = updateURLParameter(url, 'curr_class', curr_class)
            $(this).attr("href", url);
        });

        // update current class in form so when saved the class will be presented the same
        $("#curr_class").val(curr_class);

    }
    else if (key == 36 || key == 32) { // u or q
        undoLabel()
    }
    else if (key == 33) { // r
        resetLabels()
    }
    else if (key == 18) { //c
        reviewStatus()
    }
    else if (key == 38) { // w
        var idx = allClasses.indexOf(curr_class);
		$(".class-selection:eq("+allClasses.indexOf(curr_class)+")").removeClass("selected-class");
        idx += 1
		if(idx >= classes.length) {
            curr_class = allClasses[0]
			idx = 0
        }
		else
		{
        	curr_class = allClasses[parseInt(classes[idx].innerHTML.split(":")[0])-1];
        }

		$(".class-selection:eq("+idx+")").addClass("selected-class");
        // pass current class to other pages when labeling
        $('.pass-class').each(function(event) {
            var url = $(this).attr('href');
            url = updateURLParameter(url, 'curr_class', curr_class)
            $(this).attr("href", url);
        });
		//console.log("curr_class: ", curr_class);
        // update current class in form so when saved the class will be presented the same
        $("#curr_class").val(curr_class);
        //$("#curr_class").val(curr_class);

    }
    else if (key == 28) { // m
        // navigation
        $('#menu_modal').modal('toggle');
    }
    else if (key == 34) { // s
        // save
        $("#form-save").trigger('click');
    }
    else if (key == -12 || key == 16) { // left or a
        // prev
        $("#auto-prev").trigger('click');
        $("#auto-prevV").trigger('click');
        $(location).attr('href', $("#prev").attr("href"))
    }
    else if (key == -10 || key == 19) { // right or d
        // next
        $("#auto-next").trigger('click');
        $("#auto-nextV").trigger('click');
        $(location).attr('href', $("#next").attr("href"))
    }
    else if (key == 20){ // e
        deleteObjects();
    }
    else if (key == 24){ // i
        // info
        $('#info_modal').modal('toggle');
    }
    else if (key == 41 || key == 42){ // z
        // reset zoom
        resetZoom();
    }

});

//TODO update to fix image rescale with zoom
// when window resize, rescale canvas
$(window).resize(function() {
    origin_height = $("#origin_image_height").val();
    //origin_width = $("#origin_image_width").val();
    // new_width = $(window).width() * .95;
    // new_height = new_width * scaleFactor;
    new_height = $(window).height() * .8;
    new_width = new_height / scaleFactor;
    diff_width_ratio = new_width / origin_width;
    //diff_height_ratio = new_height / origin_height;
    //console.log(new_width);
    //console.log(new_height);
    $("#image_width").val(new_width);
    $("#image_height").val(new_height);
    canvas.setWidth(new_width);
    canvas.setHeight(new_height);
    canvas.setBackgroundImage(imageUrl, canvas.renderAll.bind(canvas), {
        width: $("#canvas").width(),
        height: $("#canvas").height()
    });
    canvas.calcOffset();
    resizeRectangles(diff_width_ratio);
    //resizeRectangles(diff_height_ratio);
});

// delete unwanted objects (simple clicks on canvas creates unwanted objects)
setInterval(function(){
    for (var i = 0; i < canvas.getObjects().length; i++) {
        if($(".label-"+canvas.item(i).id+".label-w").val() < 5 || $(".label-"+canvas.item(i).id+".label-h").val() < 5) {
            if(!canvas.isDrawing){
                $(".label-"+canvas.item(i).id).remove();
                canvas.remove(canvas.item(i));
                counter -= 1;
                $('#labels-counter').val(counter);
            }
        }
    }
}, 1000);
