'use strict';

var iv = (function() {
    var overlay, image, controller, leftRotate, rightRotate, zoomBtn;
    var margins = 200;
    var ie = /msie/i.test(navigator.userAgent);

    function render(src) {
        var overlay = document.createElement('div');
        document.body.appendChild(overlay);
        overlay.outerHTML = '<div id="ivOverlay"><img id="ivImage" src="' + src + '"/><div id="ivController"></div></div>';

        controller = document.getElementById('ivController');
        var controllerHtml = '<a id="ivLeftRotate" href="#"><i class="fa fa-undo fa-4x"></i></a>';
            controllerHtml += '<a id="ivZoom" href="#"><i class="fa fa-square-o fa-4x"></i></a>';
            controllerHtml += '<a id="ivRightRotate" href="#"><i class="fa fa-repeat fa-4x"></i></a>';
        controller.innerHTML = controllerHtml;
    }

    function registerEvent() {
        window.onresize = function() {
            resetPosition();
        }

        overlay = document.getElementById('ivOverlay');
        overlay.onclick = function() {
            removeOverlay();
        }

        overlay.addEventListener('wheel', function(event) {
            preventDefault(event);
            zoomImage(event);
        });

        image = document.getElementById('ivImage');
        image.onclick = function(event) {
            stopPropagation(event);
        }

        image.ondblclick = function() {
            resetOrZoomIn();
        }

        var dragFlag = false, cursorX, cursorY;
        function handleDrag(event) {
            if (dragFlag) {
                var offsetX = event.clientX - cursorX, offsetY = event.clientY - cursorY;
                cursorX = event.clientX;
                cursorY = event.clientY;
                image.style.left = parseFloat(image.style.left) + offsetX + 'px';
                image.style.top = parseFloat(image.style.top) + offsetY + 'px';
            }
        }

        image.addEventListener('mousedown', function(event) {
            preventDefault(event);
            dragFlag = true;
            cursorX = event.clientX;
            cursorY = event.clientY;
            document.addEventListener('mousemove', handleDrag);
            document.addEventListener('mouseup', function(event) {
                dragFlag = false;
                document.removeEventListener('mousemove', handleDrag);
            });
        });

        zoomBtn = document.getElementById('ivZoom');
        zoomBtn.onclick = function(event) {
            preventDefault(event);
            stopPropagation(event);
            resetOrZoomIn();
        }

        leftRotate = document.getElementById('ivLeftRotate');
        leftRotate.onclick = function(event) {
            rotateLeft();
            stopPropagation(event);
            preventDefault(event);
        }

        rightRotate = document.getElementById('ivRightRotate');
        rightRotate.onclick = function(event) {
            rotateRight();
            stopPropagation(event);
            preventDefault(event);
        }

        function stopPropagation(event) {
            !window.event ? event.stopPropagation() : window.event.cancelBubble = true;
        }

        function preventDefault(event) {
            !window.event ? event.preventDefault() : window.event.returnValue = false;
        }
    }

    function removeOverlay() {
        overlay.remove ? overlay.remove() : overlay.parentNode.removeChild(overlay);
    }

    function getInitPosition() {
        var containerWidth = window.innerWidth - margins, containerHeight = window.innerHeight - margins;
        var imgWidth = image.naturalWidth, imgHeight = image.naturalHeight;
        var width, height, left, top;

        width = Math.min(containerWidth, imgWidth);
        height = width * imgHeight / imgWidth;
        if (height > containerHeight) {
            height = containerHeight;
            width = height * imgWidth / imgHeight;
        }

        return getDefaultPositionBySize(width, height);
    }

    function getDefaultPositionBySize(width, height) {
        var left = (window.innerWidth - width) / 2, top = (window.innerHeight - height) / 2;
        
        return { 
            width: parseInt(width), 
            height: parseInt(height), 
            left: parseInt(left), 
            top: parseInt(top)
        };
    }

    function resetPosition() {
        resizeImage(getInitPosition());
    }

    function resetOrZoomIn() {
        var initPosition = getInitPosition();
        var currentPosition = {
            width: image.width,
            height: image.height,
            left: parseInt(image.style.left),
            top: parseInt(image.style.top)
        }

        if (['width', 'height', 'left', 'top'].every(function(key) {
            return currentPosition[key] == initPosition[key];
        })) {
            resizeImage(getZoomPosition(2));
        } else {
            resetPosition();
        }
    }

    function resizeImage(position) {
        for (var p in position) {
            image.style[p] = position[p] + 'px';
        }
    }

    function zoomImage(event) {
        var delta = event.deltaY, scale, position;
        
        switch (event.deltaMode) {
            case 0:
                delta = - delta / 85;
                break;
            case 1:
                delta = - delta / 3;
                break;
            case 2:
            default: 
                delta = - delta;
        }
        scale = 1 + delta / 5;
        position = getZoomPosition(scale);

        return resizeImage(position);
    }

    function getZoomPosition(scale) {
        var width, height, left, top;

        width = image.width * scale;
        height = width * image.height / image.width;
        left = parseFloat(image.style.left) - (width - image.width) / 2;
        top = parseFloat(image.style.top) - (height - image.height) / 2;

        return { width: width, height: height, left: left, top: top };
    }

    function rotateLeft() {
        rotateImage(false);
    }

    function rotateRight() {
        rotateImage(true);
    }

    function rotateImage(clockwise) {
        var deg = parseInt(image.getAttribute('data-rotate')) || 0;
        deg = clockwise ? (deg + 1) % 4 : (deg + 3) % 4;
        image.setAttribute('data-rotate', deg);
        if (ie) {
            image.style.filter = 'progid:DXImageTransform.Microsoft.BasicImage(rotation=' + deg + ');';
        } else {
            deg *= 90;
            image.style.transform = 'rotate(' + deg + 'deg)';
        }
    }

    function imageViewer(src) {
        render(src);
        registerEvent();
        resetPosition();
    }

    return imageViewer;
})();