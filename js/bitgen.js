/**
 * Boardgame image tool (BIT)
 * Copyright 2017 Herve Retaureau
 */

var bitgen = (function() {
  'use strict';

  const clsTypes = {
    TRACKER : 'tracker'
  }

  /*
   * FIGURE GENERATOR
   */

  class Figure {

    constructor() {
      if (this.constructor == Figure.constructor) {
        throw new Error('Invalid Figure generator constructor call: abstract class');
      }
      this.figure = null;
    }

    start(point) {
      console.log('start() not defined: ' + point);
    }

    progress(point) {
      console.log('progress() not defined: ' + point);
    }

    end(point) {
      console.log('end() not defined: ' + point);
      return 'error';
    }
    
    cancel() {
      if (this.figure) {
        this.figure.remove();
      }
    }

    getFigure() {
      return this.figure;
    }

  }

  /*
   * RECTANGLE GENERATOR
   */

  class Rectangle extends Figure {

    constructor(parent, noGroup, alt) {
      super();
      this.org = { x : 0, y : 0 };
      this.figure = null;
      this.createFigure(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Rectangle(parent, noGroup);
    }

    start(point) {
      let coords = this.figure.getCoords();
      this.org.x = coords.x = point.x;
      this.org.y = coords.y = point.y;
      this.figure.setCoords(coords);
      this.figure.redraw();
    }

    progress(point) {
      this.figure.redraw(this.computeCoords(point));
    }

    end(point) {
      let coords = this.computeCoords(point);
      if (0 == coords.width || 0 == coords.height) {
        this.cancel();
        return 'error';
      }

      this.figure.setCoords(coords);
      this.figure.redraw();
      return 'done';
    }

    computeCoords(point) {
      let width = point.x - this.org.x;
      let height = point.y - this.org.y;
      return {
        x : (width < 0) ? point.x : this.org.x,
        y : (height < 0) ? point.y : this.org.y,
        width : (width < 0) ? -width : width,
        height : (height < 0) ? -height : height,
        tilt : this.figure.coords.tilt
      };
    }

  } // RECTANGLE GENERATOR

  /*
   * SQUARE GENERATOR
   */

  class Square extends Rectangle {

    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Square(parent, noGroup);
    }

    computeCoords(point) {
      let width = point.x - this.org.x;
      let height = point.y - this.org.y;
      let coords = super.computeCoords(point);
      let delta = coords.width - coords.height;
      if (delta > 0) {
        coords.width = coords.height;
        if (point.x < this.org.x) {
          coords.x = this.org.x - coords.width;
        }
      } else if (delta < 0){
        coords.height = coords.width;
        if (point.y < this.org.y) {
          coords.y = this.org.y - coords.height;
        }
      }
      return coords;
    }

  } // SQUARE GENERATOR

  /*
   * TRACKER
   */

  class Tracker extends Rectangle {

    constructor(parent, noGroup) {
      super(parent, noGroup);
      this.figure.addClass(clsTypes.TRACKER);
    }
    
    progress(point) {
      this.figure.setCoords(this.computeCoords(point));
      this.figure.redraw();
    }

    getCoords() {
      return this.figure.getCoords();
    }

  } //TRACKER

  /*
   * RHOMBUS GENERATOR 
   */

  class Rhombus extends Rectangle {

    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
      this.tracker = new Tracker(parent);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Rhombus(parent, noGroup);
    }

    start(point) {
      super.start(point);
      this.tracker.start(point);
    }

    progress(point) {
      super.progress(point);
      if (this.tracker) {
        this.tracker.progress(point);
      }
    }

    end(point) {
      let rtn = super.end(point);
      if ('continue' !== rtn) { 
        this.tracker.cancel();
        this.tracker = null;
      }
      return rtn;
    }

    cancel() {
      super.cancel();
      if (this.tracker) {
        this.tracker.cancel();
      }
    }

  } // RHOMBUS GENERATOR

  /*
   * CIRCLE (from CENTER) GENERATOR
   */

  class Circle extends Figure {

    constructor(parent, noGroup, alt) {
      super();
      this.org = { x : 0, y : 0 };
      this.figure = null;
      this.createFigure(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Circle(parent, noGroup);
    }

    start(point) {
      let coords = this.figure.getCoords();
      this.org.x = coords.x = point.x;
      this.org.y = coords.y = point.y;
      this.figure.setCoords(coords);
      this.figure.redraw();
    }

    progress(point) {
      this.figure.redraw(this.computeCoords(point));
    }

    end(point) {
      let coords = this.computeCoords(point);
      if (0 >= coords.r) {
        this.cancel();
        return 'error';
      }

      this.figure.setCoords(coords);
      this.figure.redraw();
      return 'done';
    }

    computeCoords(point) {
      let dx = point.x - this.org.x,
          dy = point.y - this.org.y; 
      return {
        x : this.org.x,
        y : this.org.y,
        r : Math.round(Math.sqrt(dx*dx + dy*dy))
      };
    }

  } // CIRCLE (from CENTER) GENERATOR

  /*
   * CIRCLE (from DIAMETER) GENERATOR
   */

  class CircleEx extends Circle {

    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.CircleEx(parent, noGroup);
    }

    computeCoords(point) {
      let dx = point.x - this.org.x,
          dy = point.y - this.org.y; 
      return {
        x : this.org.x + Math.round(dx/2),
        y : this.org.y + Math.round(dy/2),
        r : Math.round(Math.sqrt(dx*dx + dy*dy)/2)
      };
    }

  } // CIRCLE (from DIAMETER) GENERATOR

  /*
   * ELLIPSE GENERATOR
   */

  class Ellipse extends Rectangle {
    
    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
      this.tracker = new Tracker(parent);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Ellipse(parent, noGroup);
    }

    start(point) {
      super.start(point);
      this.tracker.start(point);
    }

    progress(point) {
      super.progress(point);
      if (this.tracker) {
        this.tracker.progress(point);
      }
    }

    end(point) {
      let rtn = super.end(point);
      if ('continue' !== rtn) { 
        this.tracker.cancel();
        this.tracker = null;
      }
      return rtn;
    }

    cancel() {
      super.cancel();
      if (this.tracker) {
        this.tracker.cancel();
      }
    }

  } // ELLIPSE GENERATOR

  /*
   * ISOSCELES TRIANGLE GENERATOR
   */

  class IsoscelesTriangle extends Rectangle {
    
    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
      this.tracker = new Tracker(parent);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.IsoscelesTriangle(parent, noGroup, (alt) ? bitarea.tilts.LEFT : bitarea.tilts.DEFAULT);
    }

    computeCoords(point) {
      let coords = super.computeCoords(point);
      switch(coords.tilt) {
      case bitarea.tilts.TOP:
      case bitarea.tilts.BOTTOM:
        coords.tilt = (point.y < this.org.y) ? bitarea.tilts.BOTTOM : bitarea.tilts.TOP;
        break;
      case bitarea.tilts.LEFT:
      case bitarea.tilts.RIGHT:
        coords.tilt = (point.x < this.org.x) ? bitarea.tilts.RIGHT : bitarea.tilts.LEFT;
        break;
      }
      return coords;
    }

    start(point) {
      super.start(point);
      this.tracker.start(point);
    }

    progress(point) {
      super.progress(point);
      if (this.tracker) {
        this.tracker.progress(point);
      }
    }

    end(point) {
      let rtn = super.end(point);
      if ('continue' !== rtn) { 
        this.tracker.cancel();
        this.tracker = null;
      }
      return rtn;
    }

    cancel() {
      super.cancel();
      if (this.tracker) {
        this.tracker.cancel();
      }
    }

  } // ISOSCELES TRIANGLE GENERATOR

  /*
   * EQUILATERAL TRIANGLE GENERATOR
   */

  class EquilateralTriangle extends IsoscelesTriangle {
    
    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.EquilateralTriangle(parent, noGroup, (alt) ? bitarea.tilts.LEFT : bitarea.tilts.DEFAULT);
    }

    computeCoords(point) {
      let coords = super.computeCoords(point);
      let r = Math.sqrt(3) / 2;
      let delta = 0;
      switch(coords.tilt) {
      case bitarea.tilts.LEFT:
      case bitarea.tilts.RIGHT:
        delta = Math.round(coords.width - r * coords.height);
        if (delta > 0) {
          coords.width = Math.round(r * coords.height);
          if (point.x < this.org.x) {
            coords.x = this.org.x - coords.width;
          }
        } else if (delta < 0) {
          coords.height = Math.round(coords.width / r);
          if (point.y < this.org.y) {
            coords.y = this.org.y - coords.height;
          }
        }
        break;
      case bitarea.tilts.TOP:
      case bitarea.tilts.BOTTOM:
        delta = Math.round(coords.height - r * coords.width);
        if (delta > 0) {
          coords.height = Math.round(r * coords.width);
          if (point.y < this.org.y) {
            coords.y = this.org.y - coords.height;
          }
        } else if (delta < 0) {
          coords.width = Math.round(coords.height / r);
          if (point.x < this.org.x) {
            coords.x = this.org.x - coords.width;
          }
        }
        break;
      default:
      }
      return coords;
    }

  } // EQUILATERAL TRIANGLE GENERATOR

  /*
   * RECTANGLE TRIANGLE GENERATOR
   */

  class RectangleTriangle extends IsoscelesTriangle {
    
    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.RectangleTriangle(parent, noGroup, (alt) ? bitarea.tilts.LEFT : bitarea.tilts.DEFAULT);
    }

    computeCoords(point) {
      let coords = super.computeCoords(point);
      if (point.x <= this.org.x && point.y <= this.org.y) {
        coords.tilt = bitarea.tilts.RIGHT;
      } else if (point.x <= this.org.x && point.y > this.org.y) {
        coords.tilt = bitarea.tilts.BOTTOM;
      } else if (point.x > this.org.x && point.y <= this.org.y) {
        coords.tilt = bitarea.tilts.TOP;
      } else {
        coords.tilt = bitarea.tilts.LEFT;
      }
      return coords;
    }

  } // RECTANGLE TRIANGLE GENERATOR

  /*
   * HEX (from RECTANGLE) GENERATOR
   */

  class Hex extends Rectangle {
    
    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
      this.tracker = new Tracker(parent);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Hex(parent, noGroup);
    }

    computeCoords(point) {
      const r = Math.sqrt(3)/2;
      let coords = super.computeCoords(point);
      let w = coords.width, h = coords.height, dw = 0, dh = 0;
      if (w >= h) {
        if (w > h/r) { w = Math.round(h/r); } else { h = Math.round(w*r); }
      } else {
        if (h > w/r) { h = Math.round(w/r); } else { w = Math.round(h*r); }
      }
      dw = coords.width - w; 
      dh = coords.height - h;
      coords.width = w;
      coords.height = h;
      if (point.x < this.org.x) { coords.x += dw; }
      if (point.y < this.org.y) { coords.y += dh; }
      return coords;
    }

    start(point) {
      super.start(point);
      this.tracker.start(point);
    }

    progress(point) {
      super.progress(point);
      if (this.tracker) {
        this.tracker.progress(point);
      }
    }

    end(point) {
      let rtn = super.end(point);
      if ('continue' !== rtn) { 
        this.tracker.cancel();
        this.tracker = null;
      }
      return rtn;
    }

    cancel() {
      super.cancel();
      if (this.tracker) {
        this.tracker.cancel();
      }
    }

  } // HEX (from RECTANGLE) GENERATOR

  return {
    Rectangle, Square, Rhombus,
    Circle, CircleEx, Ellipse,
    IsoscelesTriangle, EquilateralTriangle, RectangleTriangle,
    Hex,
    Tracker
  }

})(); /* bitgen */
