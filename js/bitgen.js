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

    constructor(parent, g) {
      super();
      this.org = { x : 0, y : 0 };
      this.figure = null;
      this.createFigure(parent, g);
    }

    createFigure(parent, g) {
      this.figure = new bitarea.Rectangle(parent, g);
    }

    start(point) {
      this.org.x = point.x;
      this.org.y = point.y;
      this.figure.setCoords( { x : point.x, y : point.y, width : 0, height : 0, tilt : bitarea.tilts.DEFAULT });
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

    constructor(parent, g) {
      super(parent, g);
    }

    createFigure(parent, g) {
      this.figure = new bitarea.Square(parent, g);
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

    constructor(parent, noGroup) {
      super(parent, noGroup);
      this.tracker = new Tracker(parent);
    }

    createFigure(parent, g) {
      this.figure = new bitarea.Rhombus(parent, g);
    }

    start(point) {
      super.start(point);
      this.tracker.start(point);
    }

    progress(point) {
      super.progress(point);
      this.tracker.progress(point);
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

  return {
    Rectangle, Square, Rhombus,
    Tracker
  }

})(); /* bitgen */
