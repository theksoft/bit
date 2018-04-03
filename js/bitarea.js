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

  /*
   * FIGURE CLASS
   */

  class Figure {

    constructor(type, parent, noGroup) {
      if (this.constructor == Figure.constructor) {
        throw new Error('Invalid Figure constructor call: abstract class');
      }
      this._type = type;
      this._parent = this._domParent = parent;
      this._dom = null;
      this._coords = {};
      this._svgCoords = {};
      this._bonds = [];
      if (!noGroup) {
        this._domParent = document.createElementNS(NSSVG, 'g');
        this._parent.appendChild(this._domParent);
      }
      this.createSVGElt();
      this._properties = {};
    }

    createSVGElt() {
      console.log('createSVGElt() not defined');
    }

    get type() {
      return this._type;
    }

    equalCoords(coords) {
      console.log('equalCoords() not defined');
      return false;
    }

    get coords() {
      return Object.assign({}, this._coords);
    }

    set coords(coords) {
      Object.assign(this._coords, coords);
    }

    copyCoords(coords) {
      return Object.assign({}, coords || this._coords);
    }

    set svgCoords(coords) {
      Object.assign(this._svgCoords, coords);
    }

    get svgCoords() {
      return Object.assign({}, this._svgCoords);
    }

    redraw(coords) {
      let c = coords || this.coords;
      this.draw(c);
      this._bonds.forEach(e => e.draw(e.svgCoords, c));
    }

    is(dom) {
      return (dom === this._dom) ? true : false;
    }

    remove() {
      this.unbindAll();
      this._parent.removeChild((this._parent === this._domParent) ? this._dom : this._domParent);
      this._parent = this._domParent = this._dom = null;
    }

    within(coords) {
      console.log('within() not defined');
      return false;
    }

    get dom() {
      return this._dom;
    }

    get parent() {
      return this._parent;
    }

    get domParent() {
      return this._domParent;
    }

    addClass(clsName) {
      if(this._dom) {
        this._dom.classList.add(clsName);
      }
    }

    removeClass(clsName) {
      if(this._dom) {
        this._dom.classList.remove(clsName);
      }
    }

    hasClass(clsName) {
      if(this._dom) {
        return this._dom.classList.contains(clsName);
      }
      return false;
    }

    bindTo(bond, clsQualifier) {
      this._bonds.push(bond);
      this._dom.classList.add(clsQualifier);
    }

    unbindFrom(bond, clsQualifier) {
      this._bonds.splice(this._bonds.indexOf(bond), 1);
      if (0 === this._bonds.length) {
        this._dom.classList.remove(clsQualifier);
      }
    }

    unbindAll() {
      this._bonds.forEach(e => { e.unbindFrom(this); });
    }

    hasBonds() {
      return (this._bonds.length > 0) ? true : false;
    }

    get bonds() {
      return this._bonds;
    }

    copyBonds() {
      return this._bonds.slice();
    }

    clone(parent, pt) {
      console.log('clone() not defined');
      return null;
    }

    getPoints() {
      console.log('getPoints() not defined');
      return [];
    }

    get center() {
      console.log('get center() not defined');
      return [100, 100];
    }

    get areaProperties() {
      return Object.assign({}, this._properties);
    }

    set areaProperties(p) {
      Object.assign(this._properties, p);
    }

    toRecord(index, areas) {
      let rtn = {};
      rtn.index = index;
      rtn.type = this._type;
      rtn.coords = this.copyCoords();
      rtn.bonds = [];
      this._bonds.forEach(e => rtn.bonds.push(areas.indexOf(e)));
      rtn.properties = Object.assign({}, this._properties);
      return rtn;
    }

    fromRecord(record) {
      this.areaProperties = record.properties;
      this.coords = record.coords;
      this.redraw();
    }

  } // FIGURE

  /*
   * RECTANGLE CLASS
   */

  class Rectangle extends Figure {

    constructor(parent, noGroup) {
      super(types.RECTANGLE, parent, noGroup);
      Object.assign(this._coords, { x : 0, y : 0, width : 0, height : 0, tilt : tilts.DEFAULT });
      Object.assign(this._svgCoords, { x : 0, y : 0, width : 0, height : 0, tilt : tilts.DEFAULT });
    }

    createSVGElt() {
      this._dom = document.createElementNS(NSSVG, 'rect');
      this._domParent.appendChild(this._dom);
    }

    equalCoords(coords) {
      return (this._coords.x === coords.x &&
              this._coords.y === coords.y &&
              this._coords.width === coords.width &&
              this._coords.height === coords.height &&
              this._coords.tilt === coords.tilt) ? true : false;
    }

    draw(coords) {
      let c = coords || this._coords;
      if (this._dom) {
        this.svgCoords = c;
        this._dom.setAttribute('x', c.x);
        this._dom.setAttribute('y', c.y);
        this._dom.setAttribute('width', c.width);
        this._dom.setAttribute('height', c.height);
      }
    }

    within(coords) {
      if (this._coords.x < coords.x) return false;
      if (this._coords.x + this._coords.width > coords.x + coords.width) return false;
      if (this._coords.y < coords.y) return false;
      if (this._coords.y + this._coords.height > coords.y + coords.height) return false;
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

    get center() {
      return [
        this._coords.x + Math.round(this._coords.width/2),
        this._coords.y + Math.round(this._coords.height/2)
      ];
    }

  } // RECTANGLE

  /*
   * SQUARE CLASS
   */

  class Square extends Rectangle {
    
    constructor(parent, noGroup) {
      super(parent, noGroup);
      this._type = types.SQUARE;
    }

    createSVGElt() {
      super.createSVGElt();
      this._dom.classList.add(clsQualifiers.SQUARE);
    }

    get coords() {
      return super.coords;
    }

    set coords(coords) {
      if(coords.width !== coords.height) {
        throw new Error('This is not a square: ' + coords.width + 'x' + coords.height);
      }
      super.coords = coords;
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
      this._type = types.RHOMBUS;
    }

    createSVGElt() {
      this._dom = document.createElementNS(NSSVG, 'polygon');
      this._dom.classList.add(clsQualifiers.RHOMBUS);
      this._domParent.appendChild(this._dom);
    }

    draw(coords) {
      let c = coords || this._coords;
      if (this._dom) {
        let points = this.getPoints(c);
        let attrVal = points.reduce((r, e) => r + e.x + ' ' + e.y + ' ', '');
        this.svgCoords = c;
        this._dom.setAttribute('points', attrVal);
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
      Object.assign(this._coords, { x : 0, y : 0, r : 0 });
      Object.assign(this._svgCoords, { x : 0, y : 0, r : 0 });
    }

    createSVGElt() {
      this._dom = document.createElementNS(NSSVG, 'circle');
      this._domParent.appendChild(this._dom);
    }

    equalCoords(coords) {
      return (this._coords.x === coords.x &&
              this._coords.y === coords.y &&
              this._coords.r === coords.r) ? true : false;
    }

    draw(coords) {
      let c = coords || this._coords;
      if (this._dom) {
        this.svgCoords = c;
        this._dom.setAttribute('cx', c.x);
        this._dom.setAttribute('cy', c.y);
        this._dom.setAttribute('r', c.r);
      }
    }

    within(coords) {
      if (this._coords.x - this._coords.r < coords.x) return false;
      if (this._coords.x + this._coords.r > coords.x + coords.width) return false;
      if (this._coords.y - this._coords.r < coords.y) return false;
      if (this._coords.y + this._coords.r > coords.y + coords.height) return false;
      return true;
    }

    get center() {
      return [this._svgCoords.x, this._svgCoords.y];
    }

  } // CIRCLE CLASS (from CENTER)

  /*
   * CIRCLE CLASS (from DIAMETER) 
   */

  class CircleEx extends Circle {

    constructor(parent, noGroup) {
      super(parent, noGroup);
      this._type = types.CIRCLEDTR;
    }

    createSVGElt() {
      super.createSVGElt();
      this._dom.classList.add(clsQualifiers.EXTENDED);
    }

  } // CIRCLE CLASS (from DIAMETER)

  /*
   * ELLIPSE CLASS
   */

  class Ellipse extends Rectangle {

    constructor(parent, noGroup) {
      super(parent, noGroup);
      this._type = types.ELLIPSE;
    }

    createSVGElt() {
      this._dom = document.createElementNS(NSSVG, 'ellipse');
      this._domParent.appendChild(this._dom);
    }

    draw(coords) {
      let c = coords || this._coords;
      let rx = Math.round(c.width/2),
          ry = Math.round(c.height/2);
      if (this._dom) {
        this.svgCoords = c;
        this._dom.setAttribute('cx', c.x + rx);
        this._dom.setAttribute('cy', c.y + ry);
        this._dom.setAttribute('rx', rx);
        this._dom.setAttribute('ry', ry);
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
      this._type = types.TRIANGLEISC;
      this._coords.tilt = tilt;
    }

    createSVGElt() {
      this._dom = document.createElementNS(NSSVG, 'polygon');
      this._dom.classList.add(clsQualifiers.ISOSCELES);
      this._domParent.appendChild(this._dom);
    }

    draw(coords) {
      let c = coords || this._coords;
      if (this._dom) {
        this.svgCoords = c;
        let points = this.getPoints(c);
        let attrVal = points.reduce((r, e) => r + e.x + ' ' + e.y + ' ', '');
        this._dom.setAttribute('points', attrVal);
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
      this._type = types.TRIANGLEEQL;
    }

    createSVGElt() {
      super.createSVGElt();
      this._dom.classList.remove(clsQualifiers.ISOSCELES);
      this._dom.classList.add(clsQualifiers.EQUILATERAL);
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
      return (Math.abs(Math.round(dmax - r * dmin)) <= 3) ? true : false;
     }

    get coords() {
      return super.coords;
    }

    set coords(coords) {
      if(!this.checkDims(coords)) {
        throw new Error('This is not a equilateral triangle: ' + coords.width + 'x' + coords.height);
      }
      super.coords = coords;
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
      this._type = types.TRIANGLERCT;
    }

    createSVGElt() {
      super.createSVGElt();
      this._dom.classList.remove(clsQualifiers.ISOSCELES);
      this._dom.classList.add(clsQualifiers.RIGHTANGLE);
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
      this._type = types.HEXRCT;
    }

    createSVGElt() {
      this._dom = document.createElementNS(NSSVG, 'polygon');
      this._dom.classList.add(clsQualifiers.HEX);
      this._domParent.appendChild(this._dom);
    }

    getSBPt(s, b, ls, lb) {
      let s1 = s + Math.round(ls/4), s2 = s + Math.round(3*ls/4), s3 = s + ls;
      let b1 = b + Math.round(lb/2), b2 = b + lb;
      return [ s1, b, s2, b, s3, b1, s2, b2, s1, b2, s, b1 ];
    }

    draw(coords) {
      let c = coords || this._coords;
      if (this._dom) {
        this.svgCoords = c;
        let pts = this.getPoints(c);
        let attrVal = pts.reduce((r, e)  => r + e.x + ' ' + e.y + ' ', '');
        this._dom.setAttribute('points', attrVal);
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
      this._type = types.HEXDTR;
    }

    createSVGElt() {
      super.createSVGElt();
      this._dom.classList.add(clsQualifiers.EXTENDED);
    }

  } // HEX (from DIAMETER)

  /*
   * POLYGON
   */

  class Polygon extends Figure {
    
    constructor(parent, noGroup) {
      super(types.POLYGON, parent, noGroup);
      this._coords = [{ x : 0, y : 0}];
      this._type = types.POLYGON;
    }

    createSVGElt() {
      this._dom = document.createElementNS(NSSVG, 'polygon');
      this._domParent.appendChild(this._dom);
    }

    get coords() {
      return this.copyCoords();
    }

    set coords(coords) {
      this._coords.splice(0, this._coords.length);
      this._coords = this.copyCoords(coords);
    }

    copyCoords(coords) {
      let rtn = [];
      coords = coords || this._coords;
      coords.forEach(e => rtn.push({ x : e.x, y : e.y }));
      return rtn;
    }

    draw(coords) {
      if (this._dom) {
        let c = coords || this._coords;
        let attrVal = c.reduce((r, e) => r + e.x + ' ' + e.y + ' ', '');
        this._dom.setAttribute('points', attrVal);
      }
    }

    within(coords) {
      return this._coords.reduce((r, e) => r && (e.x >= coords.x && e.x <= coords.x + coords.width && e.y >= coords.y && e.y <= coords.y + coords.height), true);
    }

    get center() {
      return [this._coords[0].x, this._coords[0].y];
    }

  } // POLYGON

  /*
   * POLYLINE
   */

  class Polyline extends Polygon  {
    
    constructor(parent, noGroup) {
      super(parent, noGroup);
      this._type = types.POLYLINE;
    }

    createSVGElt() {
      this._dom = document.createElementNS(NSSVG, 'polyline');
      this._domParent.appendChild(this._dom);
    }

    add(point)  {
      this._coords.push({ x : point.x, y : point.y });
    }

  }

  /*
   * FIGURE FACTORY FROM RECORD
   */

  function createFromRecord(record, parent) {
    const factory = {
      'rectangle'   : Rectangle,
      'square'      : Square,
      'rhombus'     : Rhombus,
      'circleCtr'   : Circle,
      'circleDtr'   : CircleEx,
      'ellipse'     : Ellipse,
      'triangleIsc' : IsoscelesTriangle,
      'triangleEql' : EquilateralTriangle,
      'triangleRct' : RectangleTriangle,
      'hexRct'      : Hex,
      'hexDtr'      : HexEx,
      'polygon'     : Polygon
    };
    let figure, generator;
    generator = factory[record.type];
    if (!generator) {
      throw new Error('ERROR - Invalid figure type in record: ' + record.type);
    }
    figure = new generator(parent, false, false);
    if (!figure) {
      throw new Error('ERROR - Cannot create area from record : ' + record.type);
    }
    figure.fromRecord(record);
    return figure;
  }

  /*
   * EXPORTS
   */

  return {
    NSSVG, types, tilts,
    Rectangle, Square, Rhombus,
    Circle, CircleEx, Ellipse,
    IsoscelesTriangle, EquilateralTriangle, RectangleTriangle,
    Hex, HexEx,
    Polygon, Polyline,
    createFromRecord
  }

})(); /* BIT Area Definitions */
