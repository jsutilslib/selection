/**
   Copyright 2021 Carlos A. (https://github.com/dealfonso)

   Licensed under the Apache License, Version 2.0 (the "License");
   you may not use this file except in compliance with the License.
   You may obtain a copy of the License at

       http://www.apache.org/licenses/LICENSE-2.0

   Unless required by applicable law or agreed to in writing, software
   distributed under the License is distributed on an "AS IS" BASIS,
   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
   See the License for the specific language governing permissions and
   limitations under the License.
*/

(function(exports, document) {
    "use strict";
    if (exports.jsutilslib === undefined) {
        exports.jsutilslib = {};
    }
    function grabbable(el, options = {}) {
        if (options === false) {
            this.each(function() {
                if (this._grabbable !== undefined) {
                    this._grabbable.deactivate();
                    delete this._grabbable;
                }
            });
            return el;
        }
        let defaults = {
            classdragging: "grabbing",
            callbackstart: function() {},
            callbackend: function() {},
            callbackmove: function(dx, dy) {}
        };
        function on_document_mousemove(e, $el) {
            e.preventDefault();
            e.stopImmediatePropagation();
            let grabbable = $el.get(0)._grabbable;
            let dx = e.clientX - grabbable.initial.x0 + $("body").scrollLeft();
            let dy = e.clientY - grabbable.initial.y0 + $("body").scrollTop();
            $el.offset({
                left: grabbable.initial.position.left + grabbable.initial.parent.left + dx,
                top: grabbable.initial.position.top + grabbable.initial.parent.top + dy
            });
            $el.get(0).dispatchEvent(new CustomEvent("grabbable-move", {
                detail: {
                    grabbed: $el
                }
            }));
            if (typeof grabbable.settings.callbackmove === "function") {
                grabbable.settings.callbackmove.bind($el)(dx, dy);
            }
        }
        function on_document_mouseup(e, $el) {
            e.preventDefault();
            e.stopImmediatePropagation();
            $el.get(0).dispatchEvent(new Event("object-dragged"));
            let grabbable = $el.get(0)._grabbable;
            let dx = e.clientX - grabbable.initial.x0 + $("body").scrollLeft();
            let dy = e.clientY - grabbable.initial.y0 + $("body").scrollTop();
            $(document).off("mousemove", grabbable.handlers.document_mousemove);
            $(document).off("mouseup", grabbable.handlers.document_mouseup);
            if (grabbable.settings.classdragging !== null) $el.removeClass(grabbable.settings.classdragging);
            $el.get(0).dispatchEvent(new CustomEvent("grabbable-end", {
                detail: {
                    grabbed: $el
                }
            }));
            if (typeof grabbable.settings.callbackend === "function") {
                grabbable.settings.callbackend.bind($el)(dx, dy);
            }
        }
        function on_mousedown(e, $el) {
            if (e.which !== 1) {
                return;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            let grabbable = $el.get(0)._grabbable;
            if (grabbable.settings.classdragging !== null) $el.addClass(grabbable.settings.classdragging);
            grabbable.initial = {
                x0: e.clientX + $("body").scrollLeft(),
                y0: e.clientY + $("body").scrollTop(),
                position: $el.position(),
                parent: {
                    left: 0,
                    top: 0
                }
            };
            if ([ "absolute", "fixed" ].indexOf($el.css("position")) !== 1) {
                grabbable.initial.parent = $el.parent().offset();
            }
            $(document).on("mousemove", grabbable.handlers.document_mousemove);
            $(document).on("mouseup", grabbable.handlers.document_mouseup);
            $el.get(0).dispatchEvent(new CustomEvent("grabbable-start", {
                detail: {
                    grabbed: $el
                }
            }));
            if (typeof grabbable.settings.callbackstart === "function") {
                grabbable.settings.callbackstart.bind($el)();
            }
        }
        class Grabbable {
            constructor($el, settings) {
                this.settings = $.extend({}, defaults, settings);
                this.handlers = {
                    mousedown: function(e) {
                        on_mousedown(e, $el);
                    },
                    document_mousemove: function(e) {
                        on_document_mousemove(e, $el);
                    },
                    document_mouseup: function(e) {
                        on_document_mouseup(e, $el);
                    }
                };
                this.$el = $el;
            }
            activate() {
                this.$el.on("mousedown", this.handlers.mousedown);
            }
            deactivate() {
                this.$el.off("mousedown", this.handlers.mousedown);
                $("document").off("mousemove", this.handlers.document_mousemove);
                $("document").off("mouseup", this.handlers.document_mouseup);
            }
        }
        el.each(function() {
            let $this = $(this);
            if (this._grabbable !== undefined) {
                this._grabbable.deactivate();
                delete this._grabbable;
            }
            this._grabbable = new Grabbable($this, options);
            this._grabbable.activate();
        });
        return el;
    }
    exports.jsutilslib.grabbable = grabbable;
})(window, document);

(function(exports, document) {
    "use strict";
    if (exports.jsutilslib === undefined) {
        exports.jsutilslib = {};
    }
    function selectable(el, options = {}) {
        if (options === false) {
            this.each(function() {
                if (this._selectable !== undefined) {
                    this._selectable.deactivate();
                    delete this._selectable;
                }
            });
            return el;
        }
        let defaults = {
            creatediv: () => $('<div id="selection" class="selection"></div>'),
            callbackmove: function(dx, dy) {},
            callbackstart: (x, y) => true,
            callbackend: function(x, y, w, h) {},
            autoappend: true,
            minw: 20,
            minh: 20,
            defaultsize: {
                w: 100,
                h: 100
            }
        };
        function on_document_mousemove(e, $el) {
            e.preventDefault();
            e.stopImmediatePropagation();
            let selectable = $el.get(0)._selectable;
            let dx = e.clientX - selectable.initial.x0 + $("body").scrollLeft();
            let dy = e.clientY - selectable.initial.y0 + $("body").scrollTop();
            let x = selectable.initial.x0;
            let y = selectable.initial.y0;
            if (dx < 0) {
                dx = -dx;
                x = selectable.initial.x0 - dx;
            }
            if (dy < 0) {
                dy = -dy;
                y = selectable.initial.y0 - dy;
            }
            selectable.$selection.offset({
                left: x,
                top: y
            }).width(dx).height(dy);
            $el.get(0).dispatchEvent(new CustomEvent("selectable-move", {
                detail: {
                    selection: selectable.$selection
                }
            }));
            if (typeof selectable.settings.callbackmove === "function") {
                selectable.settings.callbackmove.bind($el)(dx, dy);
            }
        }
        function on_document_mouseup(e, $el) {
            e.preventDefault();
            e.stopImmediatePropagation();
            let selectable = $el.get(0)._selectable;
            $(document).off("mousemove", selectable.handlers.document_mousemove);
            $(document).off("mouseup", selectable.handlers.document_mouseup);
            let x0 = selectable.initial.x0;
            let y0 = selectable.initial.y0;
            let dx = e.clientX - x0 + $("body").scrollLeft();
            let dy = e.clientY - y0 + $("body").scrollTop();
            if (dx < 0) {
                dx = -dx;
                x0 = selectable.initial.x0 - dx;
            }
            if (dy < 0) {
                dy = -dy;
                y0 = selectable.initial.y0 - dy;
            }
            if (dx < selectable.settings.minw || dy < selectable.settings.minh) {
                if (selectable.settings.defaultsize !== undefined) {
                    if (selectable.settings.defaultsize.w !== undefined && selectable.settings.defaultsize.h !== undefined) {
                        dx = selectable.settings.defaultsize.w;
                        dy = selectable.settings.defaultsize.h;
                        if (selectable.settings.defaultsize.x !== undefined && selectable.settings.defaultsize.y !== undefined) {
                            x0 = selectable.settings.defaultsize.x;
                            y0 = selectable.settings.defaultsize.y;
                        } else {
                            x0 = x0 - dx / 2;
                            y0 = y0 - dy / 2;
                        }
                    }
                }
            }
            if (dx < selectable.settings.minw || dy < selectable.settings.minh) {
                selectable.$selection.remove();
                selectable.$seleccion = null;
                return;
            }
            selectable.$selection.offset({
                left: x0,
                top: y0
            }).width(dx).height(dy);
            $el.get(0).dispatchEvent(new CustomEvent("selectable-end", {
                detail: {
                    selection: selectable.$selection
                }
            }));
            if (typeof selectable.settings.callbackend === "function") {
                selectable.settings.callbackend.bind(selectable.$selection)(x0, y0, dx, dy);
            }
        }
        function on_mousedown(e, $el) {
            if (e.which !== 1) return;
            e.preventDefault();
            e.stopImmediatePropagation();
            let selectable = $el.get(0)._selectable;
            selectable.initial.x0 = e.clientX + $("body").scrollLeft();
            selectable.initial.y0 = e.clientY + $("body").scrollTop();
            if (typeof selectable.settings.callbackstart === "function") {
                if (selectable.settings.callbackstart.bind($el)(selectable.initial.x0, selectable.initial.y0) === false) return;
            }
            let $selection = selectable.settings.creatediv();
            if (selectable.settings.autoappend) {
                $el.append($selection);
            }
            $selection.offset({
                left: selectable.initial.x0,
                top: selectable.initial.y0
            });
            selectable.$selection = $selection;
            $(document).on("mousemove", selectable.handlers.document_mousemove);
            $(document).on("mouseup", selectable.handlers.document_mouseup);
            $el.get(0).dispatchEvent(new CustomEvent("selectable-start", {
                detail: {
                    selection: selectable.$selection
                }
            }));
        }
        class Selectable {
            constructor($el, settings) {
                this.settings = $.extend({}, defaults, settings);
                this.handlers = {
                    mousedown: function(e) {
                        on_mousedown(e, $el);
                    },
                    document_mousemove: function(e) {
                        on_document_mousemove(e, $el);
                    },
                    document_mouseup: function(e) {
                        on_document_mouseup(e, $el);
                    }
                };
                this.initial = {
                    x0: 0,
                    y0: 0
                };
                this.$el = $el;
                this.$selection = null;
            }
            activate() {
                this.$el.on("mousedown", this.handlers.mousedown);
            }
            deactivate() {
                this.$el.off("mousedown", this.handlers.mousedown);
                $("document").off("mousemove", this.handlers.document_mousemove);
                $("document").off("mouseup", this.handlers.document_mouseup);
            }
        }
        el.each(function() {
            let $this = $(this);
            if (this._selectable !== undefined) {
                this._selectable.deactivate();
                delete this._selectable;
            }
            this._selectable = new Selectable($this, options);
            this._selectable.activate();
        });
        return el;
    }
    exports.jsutilslib.selectable = selectable;
})(window, document);

(function(exports, document) {
    "use strict";
    if (exports.jsutilslib === undefined) {
        exports.jsutilslib = {};
    }
    function sizable(el, options = {}) {
        if (options === false) {
            this.each(function() {
                if (this._sizable !== undefined) {
                    this._sizable.deactivate();
                    delete this._sizable;
                }
            });
            return this;
        }
        let defaults = {
            autoaddsizers: false,
            createsizers: function($el) {
                $el.append($('<div class="resizer-h resizer-left"></div>'));
                $el.append($('<div class="resizer-h resizer-right"></div>'));
                $el.append($('<div class="resizer-v resizer-top"></div>'));
                $el.append($('<div class="resizer-v resizer-bottom"></div>'));
                $el.append($('<div class="resizer-sq resizer-top-left"></div>'));
                $el.append($('<div class="resizer-sq resizer-bottom-left"></div>'));
                $el.append($('<div class="resizer-sq resizer-top-right"></div>'));
                $el.append($('<div class="resizer-sq resizer-bottom-right"></div>'));
            },
            classsizing: "sizing",
            callbackstart: function() {},
            callbackend: function() {},
            callbacksize: function(dx, dy) {}
        };
        function on_document_mousemove(e, $el) {
            e.preventDefault();
            e.stopImmediatePropagation();
            let sizable = $el.get(0)._sizable;
            let diffx = e.clientX - sizable.initial.x0 + $("body").scrollLeft();
            let diffy = e.clientY - sizable.initial.y0 + $("body").scrollTop();
            let position = sizable.initial.position;
            let parent = sizable.initial.parent;
            let offset = {
                top: position.top - parent.top + diffy * sizable.deltas.dy,
                left: position.left - parent.left + diffx * sizable.deltas.dx
            };
            sizable.$sized.offset(offset);
            let width = position.width + diffx * sizable.deltas.dw;
            if (width > 0) {
                sizable.$sized.width(width);
            }
            let height = position.height - diffy * sizable.deltas.dh;
            if (height > 0) {
                sizable.$sized.height(height);
            }
            sizable.$sized.get(0).dispatchEvent(new CustomEvent("sizable-size", {
                detail: {
                    sized: sizable.$sized
                }
            }));
            if (typeof sizable.settings.callbacksize === "function") {
                sizable.settings.callbacksize.bind(sizable.$sized)(diffx, diffy);
            }
        }
        function on_document_mouseup(e, $el) {
            e.preventDefault();
            e.stopImmediatePropagation();
            let sizable = $el.get(0)._sizable;
            $(document).off("mousemove", sizable.handlers.document_mousemove);
            $(document).off("mouseup", sizable.handlers.document_mouseup);
            if (sizable.settings.classsizing !== null) $el.removeClass(sizable.settings.classsizing);
            sizable.$sized.get(0).dispatchEvent(new CustomEvent("sizable-end", {
                detail: {
                    sized: sizable.$sized
                }
            }));
            if (typeof sizable.settings.callbackend === "function") {
                let diffx = e.clientX - sizable.initial.x0 + $("body").scrollLeft();
                let diffy = e.clientY - sizable.initial.y0 + $("body").scrollTop();
                let position = sizable.initial.position;
                let parent = sizable.initial.parent;
                let y = position.top - parent.top + diffy * sizable.deltas.dy;
                let x = position.left - parent.left + diffx * sizable.deltas.dx;
                let width = Math.max(0, position.width + diffx * sizable.deltas.dw);
                let height = Math.max(0, position.height - diffy * sizable.deltas.dh);
                sizable.settings.callbackend.bind(sizable.$sized)(x, y, width, height);
            }
        }
        function on_mousedown(e, $el) {
            if (e.which !== 1) {
                return;
            }
            e.preventDefault();
            e.stopImmediatePropagation();
            let sizable = $el.get(0)._sizable;
            if (sizable.settings.classsizing !== null) $el.addClass(sizable.settings.classsizing);
            sizable.initial.x0 = e.clientX + $("body").scrollLeft();
            sizable.initial.y0 = e.clientY + $("body").scrollTop();
            let position = sizable.$sized.offset();
            position.width = sizable.$sized.width();
            position.height = sizable.$sized.height();
            sizable.initial.position = position;
            if ([ "absolute", "fixed" ].indexOf($el.css("position")) !== 1) {
                let offset = sizable.$sized.parent().offset();
                position.left += offset.left;
                position.top += offset.top;
                sizable.initial.parent.left = offset.left;
                sizable.initial.parent.top = offset.top;
            }
            sizable.$sized.get(0).dispatchEvent(new CustomEvent("sizable-start", {
                detail: {
                    sized: sizable.$sized
                }
            }));
            if (typeof sizable.settings.callbackstart === "function") {
                sizable.settings.callbackstart.bind(sizable.$sized)();
            }
            $(document).on("mousemove", sizable.handlers.document_mousemove);
            $(document).on("mouseup", sizable.handlers.document_mouseup);
        }
        class Sizer {
            constructor($el, $sized, settings, dx, dy, dw, dh) {
                this.settings = $.extend({}, defaults, settings);
                this.handlers = {
                    mousedown: function(e) {
                        on_mousedown(e, $el);
                    },
                    document_mousemove: function(e) {
                        on_document_mousemove(e, $el);
                    },
                    document_mouseup: function(e) {
                        on_document_mouseup(e, $el);
                    }
                };
                this.initial = {
                    position: {
                        left: 0,
                        top: 0,
                        width: 0,
                        height: 0
                    },
                    parent: {
                        left: 0,
                        top: 0
                    },
                    x0: 0,
                    y0: 0
                };
                this.deltas = {
                    dx: dx,
                    dy: dy,
                    dw: dw,
                    dh: dh
                };
                this.$el = $el;
                this.$sized = $sized;
            }
            activate() {
                this.$el.on("mousedown", this.handlers.mousedown);
            }
            deactivate() {
                this.$el.off("mousedown", this.handlers.mousedown);
                $("document").off("mousemove", this.handlers.document_mousemove);
                $("document").off("mouseup", this.handlers.document_mouseup);
            }
        }
        class Sizable {
            constructor($el, settings) {
                this.settings = $.extend({}, defaults, settings);
                this.$el = $el;
                this.sizers = [];
            }
            activate() {
                let $this = this.$el;
                this.sizers.push(...$this.find(".resizer-left").map(function() {
                    this._sizable = new Sizer($(this), $this, options, 1, 0, -1, 0);
                    return this._sizable;
                }), ...$this.find(".resizer-right").map(function() {
                    this._sizable = new Sizer($(this), $this, options, 0, 0, 1, 0);
                    return this._sizable;
                }), ...$this.find(".resizer-top").map(function() {
                    this._sizable = new Sizer($(this), $this, options, 0, 1, 0, 1);
                    return this._sizable;
                }), ...$this.find(".resizer-bottom").map(function() {
                    this._sizable = new Sizer($(this), $this, options, 0, 0, 0, -1);
                    return this._sizable;
                }), ...$this.find(".resizer-top-left").map(function() {
                    this._sizable = new Sizer($(this), $this, options, 1, 1, -1, 1);
                    return this._sizable;
                }), ...$this.find(".resizer-top-right").map(function() {
                    this._sizable = new Sizer($(this), $this, options, 0, 1, 1, 1);
                    return this._sizable;
                }), ...$this.find(".resizer-bottom-left").map(function() {
                    this._sizable = new Sizer($(this), $this, options, 1, 0, -1, -1);
                    return this._sizable;
                }), ...$this.find(".resizer-bottom-right").map(function() {
                    this._sizable = new Sizer($(this), $this, options, 0, 0, 1, -1);
                    return this._sizable;
                }));
                for (let sizer of this.sizers) {
                    sizer.activate();
                }
            }
            deactivate() {
                for (let sizer of this.sizers) {
                    sizer.deactivate();
                    delete sizer._sizable;
                }
            }
        }
        el.each(function() {
            if (this._sizable !== undefined) {
                this._sizable.deactivate();
                delete this._sizable;
            }
            let globaloptions = $.extend({}, defaults, options);
            if (globaloptions.autoaddsizers) {
                globaloptions.createsizers($(this));
            }
            this._sizable = new Sizable($(this), options);
            this._sizable.activate();
        });
    }
    exports.jsutilslib.sizable = sizable;
})(window, document);
