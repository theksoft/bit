/**
 * Boardgame image tool (BIT)
 * Copyright 2017 Herve Retaureau
 */

var bitarea = (function() {
  'use strict';

  const NSSVG = 'http://www.w3.org/2000/svg';

  const types = {
    RECTANGLE     : 'rectangle',
    SQUARE        : 'square'
  };

  const tilts = {
    DEFAULT : 0,
    BOTTOM  : 0,
    LEFT    : Math.PI / 2,
    TOP     : Math.PI,
    RIGHT   : -Math.PI / 2
  };

  const clsQualifiers = {
    SQUARE  : 'square'
  };

  /*
   * FIGURE CLASS
   */

  class Figure {

    constructor(type, parent, noGroup) {
      if (this.constructor == Figure.constructor) {
        throw new Error('Invalid Figure constructor call: abstract class');
      }
      this.type = type;
      this.parent = this.domParent = parent;
      this.dom = null;
      if (!noGroup) {
        this.domParent = document.createElementNS(NSSVG, 'g');
        this.parent.appendChild(this.domParent);
      }
      this.createSVGElt();
    }

    createSVGElt() {
      console.log('createSVGElt() not defined');
    }

    getType() {
      return this.type;
    }

    equalCoords(coords) {
      console.log('equalCoords() not defined');
      return false;
    }

    getCoords() {
      console.log('getCoords() not defined');
    }

    setCoords(coords) {
      console.log('setCoords() not defined');
    }

    redraw(coords) {
      let c = coords || this.getCoords();
      this.draw(c);
    }

    is(dom) {
      return (dom === this.dom) ? true : false;
    }

    remove() {
      this.parent.removeChild((this.parent === this.domParent) ? this.dom : this.domParent);
      this.parent = this.domParent = this.dom = null;
    }

    within(coords) {
      console.log('within() not defined');
      return false;
    }

    getDomParent() {
      return this.domParent;
    }

    addClass(clsName) {
      if(this.dom) {
        this.dom.classList.add(clsName);
      }
    }

    removeClass(clsName) {
      if(this.dom) {
        this.dom.classList.remove(clsName);
      }
    }

  } // FIGURE

  /*
   * RECTANGLE CLASS
   */

  class Rectangle extends Figure {

    constructor(parent, noGroup) {
      super(types.RECTANGLE, parent, noGroup);
      this.coords = { x : 0, y : 0, width : 0, height : 0, tilt : tilts.DEFAULT };
    }

    createSVGElt() {
      this.dom = document.createElementNS(NSSVG, 'rect');
      this.domParent.appendChild(this.dom);
    }

    equalCoords(coords) {
      return (this.coords.x === coords.x &&
              this.coords.y === coords.y &&
              this.coords.width === coords.width &&
              this.coords.height === coords.height &&
              this.coords.tilt === coords.tilt) ? true : false;
    }

    getCoords() {
      return Object.create(this.coords);
    }

    setCoords(coords) {
      this.coords.x = coords.x;
      this.coords.y = coords.y;
      this.coords.width = coords.width;
      this.coords.height = coords.height;
      this.coords.tilt = coords.tilt;
    }

    draw(coords) {
      let c = coords || this.coords;
      if (this.dom) {
        this.dom.setAttribute('x', c.x);
        this.dom.setAttribute('y', c.y);
        this.dom.setAttribute('width', c.width);
        this.dom.setAttribute('height', c.height);
      }
    }

    within(coords) {
      if (this.coords.x < coords.x) return false;
      if (this.coords.x + this.coords.width > coords.x + coords.width) return false;
      if (this.coords.y < coords.y) return false;
      if (this.coords.y + this.coords.height > coords.y + coords.height) return false;
      return true;
    }

  } // RECTANGLE

  /*
   * SQUARE CLASS
   */

  class Square extends Rectangle {
    
    constructor(parent, noGroup) {
      super(parent, noGroup);
      this.type = types.SQUARE;
    }

    createSVGElt() {
      super.createSVGElt();
      this.dom.classList.add(clsQualifiers.SQUARE);
    }

    setCoords(coords) {
      if(coords.width !== coords.height) {
        throw new Error('This is not a square: ' + this.width + 'x' + this.height);
      }
      super.setCoords(coords);
    }

    draw(coords) {
      if(coords && coords.width !== coords.height) {
        throw new Error('This is not a square: ' + this.width + 'x' + this.height);
      }
      super.draw(coords);
    }

  } // SQUARE

  return {
    tilts,
    Rectangle, Square
  }

})(); /* bitarea */
