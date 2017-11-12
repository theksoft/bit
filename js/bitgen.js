/**
 * Boardgame image tool (BIT)
 * Copyright 2017 Herve Retaureau
 */

var bitgen = (function() {
  'use strict';

  const clsTypes = {
    TRACKER : 'tracker'
  }

  // FIGURE GENERATOR

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

  // RECTANGLE GENERATOR

  class Rectangle extends Figure {

    constructor(parent, g) {
      super();
      this.org = { x : 0, y : 0 };
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

  return {
    Rectangle,
    Tracker
  }

})(); /* bitgen */
