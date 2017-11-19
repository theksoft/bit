/**
 * Boardgame image tool (BIT)
 * Copyright 2017 Herve Retaureau
 */

var bitarea = (function() {
  'use strict';

  const NSSVG = 'http://www.w3.org/2000/svg';

  const types = {
    CIRCLECTR     : 'circleCtr',
    CIRCLEDTR     : 'circleDtr',
    RECTANGLE     : 'rectangle',
    SQUARE        : 'square',
    RHOMBUS       : 'rhombus',
    TRIANGLEISC   : 'triangleIsc',
    TRIANGLEEQL   : 'triangleEql',
    TRIANGLERCT   : 'triangleRct'
  };

  const clsQualifiers = {
    SQUARE        : 'square',
    RHOMBUS       : 'rhombus',
    ISOSCELES     : 'isosceles',
    EQUILATERAL   : 'equilateral',
    RIGHTANGLE    : 'right-angle',
    EXTENDED      : 'extended'
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

    hasClass(clsName) {
      if(this.dom) {
        return this.dom.classList.contains(clsName);
      }
      return false;
    }

  } // FIGURE

  /*
   * CIRCLE CLASS (from CENTER)
   */

  class Circle extends Figure {

    constructor(parent, noGroup) {
      super(types.CIRCLECTR, parent, noGroup);
      this.coords = { x : 0, y : 0, r : 0 };
    }

    createSVGElt() {
      this.dom = document.createElementNS(NSSVG, 'circle');
      this.domParent.appendChild(this.dom);
    }

    equalCoords(coords) {
      return (this.coords.x === coords.x &&
              this.coords.y === coords.y &&
              this.coords.r === coords.r) ? true : false;
    }

    getCoords() {
      return Object.create(this.coords);
    }

    setCoords(coords) {
      this.coords.x = coords.x;
      this.coords.y = coords.y;
      this.coords.r = coords.r;
    }

    draw(coords) {
      let c = coords || this.coords;
      if (this.dom) {
        this.dom.setAttribute('cx', c.x);
        this.dom.setAttribute('cy', c.y);
        this.dom.setAttribute('r', c.r);
      }
    }

    within(coords) {
      if (this.coords.x - this.coords.r < coords.x) return false;
      if (this.coords.x + this.coords.r > coords.x + coords.width) return false;
      if (this.coords.y - this.coords.r < coords.y) return false;
      if (this.coords.y + this.coords.r > coords.y + coords.height) return false;
      return true;
    }

  } // CIRCLE CLASS (from CENTER)

  /*
   * CIRCLE CLASS (from DIAMETER) 
   */

  class CircleEx extends Circle {

    constructor(parent, noGroup) {
      super(parent, noGroup);
      this.type = types.CIRCLEDTR;
    }

    createSVGElt() {
      super.createSVGElt();
      this.dom.classList.add(clsQualifiers.EXTENDED);
    }

  } // CIRCLE CLASS (from DIAMETER)


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
        throw new Error('This is not a square: ' + coords.width + 'x' + coords.height);
      }
      super.setCoords(coords);
    }

    draw(coords) {
      if(coords && coords.width !== coords.height) {
        throw new Error('This is not a square: ' + coords.width + 'x' + coords.height);
      }
      super.draw(coords);
    }

  } // SQUARE

  /*
   * RHOMBUS CLASS
   */

  class Rhombus extends Rectangle {

    constructor(parent, noGroup) {
      super(parent, noGroup);
      this.type = types.RHOMBUS;
    }

    createSVGElt() {
      this.dom = document.createElementNS(NSSVG, 'polygon');
      this.dom.classList.add(clsQualifiers.RHOMBUS);
      this.domParent.appendChild(this.dom);
    }

    draw(coords) {
      let c = coords || this.coords;
      let lx = c.x, rx = c.x + c.width, cx = c.x + Math.round(c.width/2),  
          ty = c.y, by = c.y + c.height, cy = c.y + Math.round(c.height/2);
      let points = [];
      points.push({ x : lx, y : cy });
      points.push({ x : cx, y : ty });
      points.push({ x : rx, y : cy });
      points.push({ x : cx, y : by });
      let attrVal = points.reduce(function(r, e) {
        return r + e.x + ' ' + e.y + ' ';
      }, '');
      this.dom.setAttribute('points', attrVal);
    }

  } // RHOMBUS

  /*
   * ISOSCELES TRIANGLE
   */
  
  class IsoscelesTriangle extends Rectangle {
    
    constructor(parent, noGroup, tilt) {
      super(parent, noGroup);
      this.type = types.TRIANGLEISC;
      this.coords.tilt = tilt;
    }

    createSVGElt() {
      this.dom = document.createElementNS(NSSVG, 'polygon');
      this.dom.classList.add(clsQualifiers.ISOSCELES);
      this.domParent.appendChild(this.dom);
    }

    draw(coords) {
      let c = coords || this.coords;
      let lx = c.x, rx = c.x + c.width, cx = c.x + Math.round(c.width/2),  
          ty = c.y, by = c.y + c.height, cy = c.y + Math.round(c.height/2);
      let points = [];
      switch(c.tilt) {
      case tilts.BOTTOM:
        points.push({ x : lx, y : by });
        points.push({ x : rx, y : by });
        points.push({ x : cx, y : ty });
        break;
      case tilts.TOP:
        points.push({ x : lx, y : ty });
        points.push({ x : rx, y : ty });
        points.push({ x : cx, y : by });
        break;
      case tilts.LEFT:
        points.push({ x : lx, y : ty });
        points.push({ x : lx, y : by });
        points.push({ x : rx, y : cy });
        break;
      case tilts.RIGHT:
        points.push({ x : lx, y : cy });
        points.push({ x : rx, y : ty });
        points.push({ x : rx, y : by });
        break;
      default:
      }
      let attrVal = points.reduce(function(r, e) {
        return r + e.x + ' ' + e.y + ' ';
      }, '');
      this.dom.setAttribute('points', attrVal);
    }

  } // ISOSCELES TRIANGLE

  /*
   * EQUILATERAL TRIANGLE
   */

  class EquilateralTriangle extends IsoscelesTriangle {
    
    constructor(parent, noGroup, tilt) {
      super(parent, noGroup, tilt);
      this.type = types.TRIANGLEEQL;
    }

    createSVGElt() {
      super.createSVGElt();
      this.dom.classList.remove(clsQualifiers.ISOSCELES);
      this.dom.classList.add(clsQualifiers.EQUILATERAL);
    }

    checkDims(coords) {
      let r = Math.sqrt(3) / 2;
      let dmax = coords.width, dmin = coords.height;
      switch(coords.tilt) {
      case tilts.LEFT:
      case tilts.RIGHT:
        break;
      case tilts.TOP:
      case tilts.BOTTOM:
        dmax = coords.height;
        dmin = coords.width;
        break;
      default:
        r = 0;
      }
      return (Math.abs(Math.round(dmax - r * dmin)) <= 1) ? true : false;
     }

    setCoords(coords) {
      if(!this.checkDims(coords)) {
        throw new Error('This is not a equilateral triangle: ' + coords.width + 'x' + coords.height);
      }
      super.setCoords(coords);
    }

    draw(coords) {
      if(coords && !this.checkDims(coords)) {
        throw new Error('This is not a equilateral triangle: ' + coords.width + 'x' + coords.height);
      }
      super.draw(coords);
    }

  }

  /*
   * RIGHT-ANGLE TRIANGLE
   */

  class RectangleTriangle extends IsoscelesTriangle {

    constructor(parent, noGroup, tilt) {
      super(parent, noGroup, tilt);
      this.type = types.TRIANGLERCT;
    }

    createSVGElt() {
      super.createSVGElt();
      this.dom.classList.remove(clsQualifiers.ISOSCELES);
      this.dom.classList.add(clsQualifiers.RIGHTANGLE);
    }

    draw(coords) {
      let c = coords || this.coords;
      let lx = c.x, rx = c.x + c.width,  
          ty = c.y, by = c.y + c.height;
      let points = [];
      switch(c.tilt) {
      case tilts.BOTTOM:
        points.push({ x : lx, y : by });
        points.push({ x : rx, y : by });
        points.push({ x : rx, y : ty });
        break;
      case tilts.TOP:
        points.push({ x : rx, y : ty });
        points.push({ x : lx, y : ty });
        points.push({ x : lx, y : by });
        break;
      case tilts.LEFT:
        points.push({ x : lx, y : ty });
        points.push({ x : lx, y : by });
        points.push({ x : rx, y : by });
        break;
      case tilts.RIGHT:
        points.push({ x : rx, y : by });
        points.push({ x : rx, y : ty });
        points.push({ x : lx, y : ty });
        break;
      default:
      }
      let attrVal = points.reduce(function(r, e) {
        return r + e.x + ' ' + e.y + ' ';
      }, '');
      this.dom.setAttribute('points', attrVal);
    }

  } // RIGHT-ANGLE TRIANGLE

  return {
    tilts,
    Circle, CircleEx,
    Rectangle, Square, Rhombus,
    IsoscelesTriangle, EquilateralTriangle, RectangleTriangle
  }

})(); /* bitarea */
