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

  return {
    Rectangle, Square, Rhombus,
    IsoscelesTriangle, EquilateralTriangle,
    Tracker
  }

})(); /* bitgen */
