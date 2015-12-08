'use strict';

var iv = (function() {
    var preloadImage, src;
    var overlay, loading, image, controller, leftRotate, rightRotate, zoomBtn;
    var margins = 200, wheelDelta = 0.2;
    var ie = /msie/i.test(navigator.userAgent);

    /* 工具函数 */
    function addClass(element, className) {
        var classNames = element.className.split(' ');
        classNames.indexOf(className) === -1 && classNames.push(className);
        element.className = classNames.join(' ').trim();
    }

    function removeClass(element, className) {
        element.className = element.className.split(' ').filter(function(name) {
            return name != className;
        }).join(' ').trim();
    } 

    function stopPropagation(event) {
        !window.event ? event.stopPropagation() : window.event.cancelBubble = true;
    }

    function preventDefault(event) {
        !window.event ? event.preventDefault() : window.event.returnValue = false;
    }

    /* 渲染组件 */
    function render(src) {
        addClass(document.body, 'ivActive');
        var overlay = document.createElement('div');
        document.body.appendChild(overlay);
        overlay.outerHTML = '<div id="ivOverlay"><div id="ivLoading"><i class="fa fa-spinner fa-spin fa-3x"></i></div><img id="ivImage" style="display: none" /><div id="ivController"></div></div>';
        
        controller = document.getElementById('ivController');
        var controllerHtml = '<a id="ivLeftRotate" href="#"><span class="fa-stack fa-lg"><i class="fa fa-circle-thin fa-stack-2x"></i><i class="fa fa-undo fa-stack-1x"></i></span></i></span></a>';
            controllerHtml += '<a id="ivZoom" href="#"><span class="fa-stack fa-2x"><i class="fa fa-circle-thin fa-stack-2x"></i><i class="fa fa-square-o fa-stack-1x"></i></span></i></span></a>';
            controllerHtml += '<a id="ivRightRotate" href="#"><span class="fa-stack fa-lg"><i class="fa fa-circle-thin fa-stack-2x"></i><i class="fa fa-repeat fa-stack-1x"></i></span></i></span></a>';
        controller.innerHTML = controllerHtml;

        loading = document.getElementById('ivLoading');
        image = document.getElementById('ivImage');
        zoomBtn = document.getElementById('ivZoom');
        leftRotate = document.getElementById('ivLeftRotate');
        rightRotate = document.getElementById('ivRightRotate');
    }

    /* 注册事件 */
    function registerEvent() {
        preloadImage = new Image();
        preloadImage.onload = function() {
            loading.style.display = 'none';
            image.src = src;
            resetPosition();
            image.style.display = 'block';
        }

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

        zoomBtn.onclick = function(event) {
            preventDefault(event);
            stopPropagation(event);
            resetOrZoomIn();
        }

        leftRotate.onclick = function(event) {
            rotateLeft();
            stopPropagation(event);
            preventDefault(event);
        }

        rightRotate.onclick = function(event) {
            rotateRight();
            stopPropagation(event);
            preventDefault(event);
        }
    }


    /* 事件处理函数 */
    function removeOverlay() {
        overlay.remove ? overlay.remove() : overlay.parentNode.removeChild(overlay);
        removeClass(document.body, 'ivActive');
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
        
        // switch (event.deltaMode) {
        //     case 0:
        //         delta = - delta / 85;
        //         break;
        //     case 1:
        //         delta = - delta / 3;
        //         break;
        //     case 2:
        //     default: 
        //         delta = - delta;
        // }
        // scale = 1 + delta / 5;
        scale = 1 + (delta > 0 ? - wheelDelta : wheelDelta);
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
        deg *= 90;
        image.style.msTransform = 'rotate(' + deg + 'deg)';
        image.style.transform = 'rotate(' + deg + 'deg)';
    }


    /* 主函数 */
    function imageViewer(url) {
        src = url;
        render();
        registerEvent();
        loadImage();
    }

    function loadImage() {
        preloadImage.src = src;
    }

    return imageViewer;
})();