/**
 * Boardgame image tool (BIT) Area Definition
 * Copyright 2017 Herve Retaureau
 */

var bitarea = (function() {
  'use strict';

  const NSSVG = 'http://www.w3.org/2000/svg';

  const types = {
    CIRCLECTR     : 'circleCtr',
    CIRCLEDTR     : 'circleDtr',
    ELLIPSE       : 'ellipse',
    RECTANGLE     : 'rectangle',
    SQUARE        : 'square',
    RHOMBUS       : 'rhombus',
    TRIANGLEISC   : 'triangleIsc',
    TRIANGLEEQL   : 'triangleEql',
    TRIANGLERCT   : 'triangleRct',
    HEXRCT        : 'hexRct',
    HEXDTR        : 'hexDtr',
    POLYLINE      : 'polyline',
    POLYGON       : 'polygon'
  };

  const clsQualifiers = {
    SQUARE        : 'square',
    RHOMBUS       : 'rhombus',
    ISOSCELES     : 'isosceles',
    EQUILATERAL   : 'equilateral',
    RIGHTANGLE    : 'right-angle',
    HEX           : 'hex',
    EXTENDED      : 'extended',
    BOND          : 'bond'
  };

  const tilts = {
    DEFAULT : 0,
    BOTTOM  : 0,
    LEFT    : Math.PI / 2,
    TOP     : Math.PI,
    RIGHT   : -Math.PI / 2
  };

  const properties = {
    HREF  : 'href',
    ALT   : 'alt',
    TITLE : 'title'
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
      this.bonds = [];
      if (!noGroup) {
        this.domParent = document.createElementNS(NSSVG, 'g');
        this.parent.appendChild(this.domParent);
      }
      this.createSVGElt();
      this.properties = {};
      this.properties[properties.HREF] = 
      this.properties[properties.ALT] = 
      this.properties[properties.TITLE] = '';
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

    copyCoords(coords) {
      console.log('copyCoords() not defined');
      return null;
    }

    setSVGCoords(coords) {
      console.log('setSVGCoords() not defined');
    }

    getSVGCoords() {
      console.log('getSVGCoords() not defined');
      return this.getCoords();
    }

    redraw(coords) {
      let c = coords || this.getCoords();
      this.draw(c);
      this.bonds.forEach(e => e.draw(e.getSVGCoords(), c));
    }

    is(dom) {
      return (dom === this.dom) ? true : false;
    }

    remove() {
      this.unbindAll();
      this.parent.removeChild((this.parent === this.domParent) ? this.dom : this.domParent);
      this.parent = this.domParent = this.dom = null;
    }

    within(coords) {
      console.log('within() not defined');
      return false;
    }

    getDom() {
      return this.dom;
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

    bindTo(bond, clsQualifier) {
      this.bonds.push(bond);
      this.dom.classList.add(clsQualifier);
    }

    unbindFrom(bond, clsQualifier) {
      this.bonds.splice(this.bonds.indexOf(bond), 1);
      if (0 === this.bonds.length) {
        this.dom.classList.remove(clsQualifier);
      }
    }

    unbindAll() {
      this.bonds.forEach(e => { e.unbindFrom(this); });
    }

    hasBonds() {
      return (this.bonds.length > 0) ? true : false;
    }

    getBonds() {
      return this.bonds.slice();
    }

    clone(parent, pt) {
      console.log('clone() not defined');
      return null;
    }

    getPoints() {
      console.log('getPoints() not defined');
      return [];
    }

    getCenter() {
      console.log('getCenter() not defined');
      return [100, 100];
    }

    getAreaProperties() {
      return Object.create(this.properties);
    }

    setAreaProperties(p) {
      Object.assign(this.properties, p);
    }

  } // FIGURE

  /*
   * RECTANGLE CLASS
   */

  class Rectangle extends Figure {

    constructor(parent, noGroup) {
      super(types.RECTANGLE, parent, noGroup);
      this.coords = { x : 0, y : 0, width : 0, height : 0, tilt : tilts.DEFAULT };
      this.svgCoords = { x : 0, y : 0, width : 0, height : 0, tilt : tilts.DEFAULT };
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

    copyCoords(coords) {
      let c = {};
      coords = coords || this.coords;
      c.x = coords.x;
      c.y = coords.y;
      c.width = coords.width;
      c.height = coords.height;
      c.tilt = coords.tilt;
      return c;
    }

    draw(coords) {
      let c = coords || this.coords;
      if (this.dom) {
        this.setSVGCoords(c);
        this.dom.setAttribute('x', c.x);
        this.dom.setAttribute('y', c.y);
        this.dom.setAttribute('width', c.width);
        this.dom.setAttribute('height', c.height);
      }
    }

    setSVGCoords(coords) {
      this.svgCoords.x = coords.x;
      this.svgCoords.y = coords.y;
      this.svgCoords.width = coords.width;
      this.svgCoords.height = coords.height;
      this.svgCoords.tilt = coords.tilt;
    }

    getSVGCoords() {
      return this.svgCoords;
    }

    within(coords) {
      if (this.coords.x < coords.x) return false;
      if (this.coords.x + this.coords.width > coords.x + coords.width) return false;
      if (this.coords.y < coords.y) return false;
      if (this.coords.y + this.coords.height > coords.y + coords.height) return false;
      return true;
    }

    getPoints(c) {
      return [
        { x : c.x, y : c.y },
        { x : c.x, y : c.y + c.height },
        { x : c.x + c.width, y : c.y + c.height },
        { x : c.x + c.width, y : c.y }
      ];
    }

    getCenter() {
      return [
        this.coords.x + Math.round(this.coords.width/2),
        this.coords.y + Math.round(this.coords.height/2)
      ];
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
      if (this.dom) {
        let points = this.getPoints(c);
        let attrVal = points.reduce((r, e) => r + e.x + ' ' + e.y + ' ', '');
        this.setSVGCoords(c);
        this.dom.setAttribute('points', attrVal);
      }
    }

    getPoints(c) {
      let lx = c.x, rx = c.x + c.width, cx = c.x + Math.round(c.width/2),  
          ty = c.y, by = c.y + c.height, cy = c.y + Math.round(c.height/2);
      return [
        { x : lx, y : cy },
        { x : cx, y : ty },
        { x : rx, y : cy },
        { x : cx, y : by }
      ];
    }

  } // RHOMBUS

  /*
   * CIRCLE CLASS (from CENTER)
   */

  class Circle extends Figure {

    constructor(parent, noGroup) {
      super(types.CIRCLECTR, parent, noGroup);
      this.coords = { x : 0, y : 0, r : 0 };
      this.svgCoords = { x : 0, y : 0, r : 0 };
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

    copyCoords(coords) {
      let c = {};
      coords = coords || this.coords;
      c.x = coords.x;
      c.y = coords.y;
      c.r = coords.r;
      return c;
    }

    setSVGCoords(coords) {
      this.svgCoords.x = coords.x;
      this.svgCoords.y = coords.y;
      this.svgCoords.r = coords.r;
    }

    getSVGCoords() {
      return this.svgCoords;
    }

    draw(coords) {
      let c = coords || this.coords;
      if (this.dom) {
        this.setSVGCoords(c);
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

    getCenter() {
      return [this.svgCoords.x, this.svgCoords.y];
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
   * ELLIPSE CLASS
   */

  class Ellipse extends Rectangle {

    constructor(parent, noGroup) {
      super(parent, noGroup);
      this.type = types.ELLIPSE;
    }

    createSVGElt() {
      this.dom = document.createElementNS(NSSVG, 'ellipse');
      this.domParent.appendChild(this.dom);
    }

    draw(coords) {
      let c = coords || this.coords;
      let rx = Math.round(c.width/2),
          ry = Math.round(c.height/2);
      if (this.dom) {
        this.setSVGCoords(c);
        this.dom.setAttribute('cx', c.x + rx);
        this.dom.setAttribute('cy', c.y + ry);
        this.dom.setAttribute('rx', rx);
        this.dom.setAttribute('ry', ry);
      }
    }

    getPoints(c) {
      let lx = c.x, rx = c.x + c.width, cx = c.x + Math.round(c.width/2),  
          ty = c.y, by = c.y + c.height, cy = c.y + Math.round(c.height/2);
      return [
        { x : lx, y : cy },
        { x : cx, y : ty },
        { x : rx, y : cy },
        { x : cx, y : by }
      ];
    }

  } // ELLIPSE

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
      if (this.dom) {
        this.setSVGCoords(c);
        let points = this.getPoints(c);
        let attrVal = points.reduce((r, e) => r + e.x + ' ' + e.y + ' ', '');
        this.dom.setAttribute('points', attrVal);
      }
    }

    getPoints(c) {
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
      return points;
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

    getPoints(c) {
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
      return points;
    }

  } // RIGHT-ANGLE TRIANGLE

  /*
   * HEX (from RECTANGLE) 
   */

  class Hex extends Rectangle {
    
    constructor(parent, noGroup) {
      super(parent, noGroup);
      this.type = types.HEXRCT;
    }

    createSVGElt() {
      this.dom = document.createElementNS(NSSVG, 'polygon');
      this.dom.classList.add(clsQualifiers.HEX);
      this.domParent.appendChild(this.dom);
    }

    getSBPt(s, b, ls, lb) {
      let s1 = s + Math.round(ls/4), s2 = s + Math.round(3*ls/4), s3 = s + ls;
      let b1 = b + Math.round(lb/2), b2 = b + lb;
      return [ s1, b, s2, b, s3, b1, s2, b2, s1, b2, s, b1 ];
    }

    draw(coords) {
      let c = coords || this.coords;
      if (this.dom) {
        this.setSVGCoords(c);
        let pts = this.getPoints(c);
        let attrVal = pts.reduce((r, e)  => r + e.x + ' ' + e.y + ' ', '');
        this.dom.setAttribute('points', attrVal);
      }
    }

    getPoints(c) {
      let pts = [{x:0 , y:0}, {x:0 , y:0}, {x:0 , y:0}, {x:0 , y:0}, {x:0 , y:0}, {x:0 , y:0}];
      if (c.width > c.height) {
        [ pts[0].x, pts[0].y,
          pts[1].x, pts[1].y,
          pts[2].x, pts[2].y,
          pts[3].x, pts[3].y,
          pts[4].x, pts[4].y,
          pts[5].x, pts[5].y ] = this.getSBPt(c.x, c.y, c.width, c.height);
      } else {
        [ pts[0].y, pts[0].x,
          pts[1].y, pts[1].x,
          pts[2].y, pts[2].x,
          pts[3].y, pts[3].x,
          pts[4].y, pts[4].x,
          pts[5].y, pts[5].x ] = this.getSBPt(c.y, c.x, c.height, c.width);
      }
      return pts;
    }

  } // HEX (from RECTANGLE)

  /*
   * HEX (from DIAMETER) 
   */

  class HexEx extends Hex {
    
    constructor(parent, noGroup) {
      super(parent, noGroup);
      this.type = types.HEXDTR;
    }

    createSVGElt() {
      super.createSVGElt();
      this.dom.classList.add(clsQualifiers.EXTENDED);
    }

  } // HEX (from DIAMETER)

  /*
   * POLYGON
   */

  class Polygon extends Figure {
    
    constructor(parent, noGroup) {
      super(types.POLYGON, parent, noGroup);
      this.coords = [{ x : 0, y : 0}];
      this.type = types.POLYGON;
    }

    createSVGElt() {
      this.dom = document.createElementNS(NSSVG, 'polygon');
      this.domParent.appendChild(this.dom);
    }

    getCoords() {
      return this.copyCoords(this.coords);
    }

    setCoords(coords) {
      this.coords.splice(0, this.coords.length);
      this.coords = this.copyCoords(coords);
    }

    copyCoords(coords) {
      let rtn = [];
      coords.forEach(e => rtn.push({ x : e.x, y : e.y }));
      return rtn;
    }

    draw(coords) {
      if (this.dom) {
        let c = coords || this.coords;
        let attrVal = c.reduce((r, e) => r + e.x + ' ' + e.y + ' ', '');
        this.dom.setAttribute('points', attrVal);
      }
    }

    within(coords) {
      return this.coords.reduce((r, e) => r && (e.x >= coords.x && e.x <= coords.x + coords.width && e.y >= coords.y && e.y <= coords.y + coords.height), true);
    }

    getCenter() {
      return [this.coords[0].x, this.coords[0].y];
    }

  } // POLYGON

  /*
   * POLYLINE
   */

  class Polyline extends Polygon  {
    
    constructor(parent, noGroup) {
      super(parent, noGroup);
      this.type = types.POLYLINE;
    }

    createSVGElt() {
      this.dom = document.createElementNS(NSSVG, 'polyline');
      this.domParent.appendChild(this.dom);
    }

    add(point)  {
      this.coords.push({ x : point.x, y : point.y });
    }

  }

  return {
    NSSVG, types, tilts, properties,
    Rectangle, Square, Rhombus,
    Circle, CircleEx, Ellipse,
    IsoscelesTriangle, EquilateralTriangle, RectangleTriangle,
    Hex, HexEx,
    Polygon, Polyline
  }

})(); /* BIT Area Definitions */
