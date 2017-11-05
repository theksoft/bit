/**
 * Boardgame image tool (BIT)
 * Copyright 2017 Herve Retaureau
 */

var bitarea = (function() {
  'use strict';

  const NSSVG = 'http://www.w3.org/2000/svg';

  const types = {
    RECTANGLE     : 'rectangle'
  };

  const tilts = {
    DEFAULT : 0,
    BOTTOM  : 0,
    LEFT    : Math.PI / 2,
    TOP     : Math.PI,
    RIGHT   : -Math.PI / 2
  };

  /*
   * FIGURE CLASS
   */

  class Figure {

    constructor(type, parent, g) {
      if (this.constructor == Figure.constructor) {
        throw new Error('Invalid Figure constructor call: abstract class');
      }
      this.type = type;
      this.parent = parent;
      this.g = g;
      this.dom = null;
      this.gOwner = false;
      if (!g) {
        this.g = document.createElementNS(NSSVG, 'g');
        this.parent.appendChild(this.g);
        this.gOwner = true;
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
      if (this.gOwner) {
        this.parent.removeChild(this.g);
      }
      this.parent = this.g = this.dom = null;
    }

    within(coords) {
      console.log('within() not defined');
      return false;
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

    constructor(parent, g) {
      super(types.RECTANGLE, parent, g);
      this.coords = { x : 0, y : 0, width : 0, height : 0, tilt : tilts.DEFAULT };
    }

    createSVGElt() {
      this.dom = document.createElementNS(NSSVG, 'rect');
      this.g.appendChild(this.dom);
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

  return {
    tilts,
    Rectangle
  }

})(); /* bitarea */
