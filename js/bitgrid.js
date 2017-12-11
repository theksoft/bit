/**
 * Boardgame image tool (BIT) Grid Area Definition
 * Copyright 2017 Herve Retaureau
 */

var bitgrid = (function() {
  'use strict';

  const types = {
    GRIDRECTANGLE : 'gridRectangle',
    GRIDCIRCLE    : 'gridCircle',
    GRIDHEX       : 'gridHex'
  };

  const clsQualifiers = {
    GRIDSCOPE     : 'scope',
    GRIDBOND      : 'bond'
  }

  const factory = {
    'rectangle'   : bitarea.Rectangle,
    'square'      : bitarea.Square,
    'rhombus'     : bitarea.Rhombus,
    'circleCtr'   : bitarea.Circle,
    'circleDtr'   : bitarea.CircleEx,
    'ellipse'     : bitarea.Ellipse,
    'triangleIsc' : bitarea.IsoscelesTriangle,
    'triangleEql' : bitarea.EquilateralTriangle,
    'triangleRct' : bitarea.RectangleTriangle,
    'hexRct'      : bitarea.Hex,
    'hexDtr'      : bitarea.HexEx
  };

  function getPatternProperties(type, coords) {
    let props = {
      start   : { x       : coords.x, y      : coords.y,            tilt : coords.tilt },
      offset  : { x       : 0,        y      : 0 },
      area    : { width   : 0,        height : 0 },
      raw     : { overlap : 0,        tilt   : bitarea.tilts.DEFAULT },
      column  : { overlap : 0,        offset : 0 }
    };
    switch(type) {
    case bitarea.types.HEXRCT:
    case bitarea.types.HEXDTR:
      props.area.width = coords.width;
      props.area.height = coords.height;
      if (coords.width > coords.height) {
        props.raw.overlap = Math.round(coords.width / 2);
        props.column.offset = Math.round(3*coords.width/4);
        props.column.overlap = -Math.round(coords.height/2);
      } else {
        props.column.offset = Math.round(coords.width/2);
        props.column.overlap = -Math.round(coords.height/4);
      }
      break;
    case bitarea.types.TRIANGLEISC:
    case bitarea.types.TRIANGLEEQL:
      props.area.width = coords.width;
      props.area.height = coords.height;
      if (coords.tilt === bitarea.tilts.TOP || coords.tilt === bitarea.tilts.BOTTOM) {
        props.raw.overlap = -Math.round(coords.width/2);
        props.column.offset = Math.round(coords.width/2);
        props.raw.tilt = (coords.tilt === bitarea.tilts.TOP) ? bitarea.tilts.BOTTOM : bitarea.tilts.TOP;
      } else {
        props.column.offset = coords.width;
        props.column.overlap = -Math.round(coords.height/2);
        props.raw.tilt = (coords.tilt === bitarea.tilts.LEFT) ? bitarea.tilts.RIGHT : bitarea.tilts.LEFT;
      }
      break;
    case bitarea.types.TRIANGLERCT:
      props.area.width = coords.width;
      props.area.height = coords.height;
      props.raw.overlap = -coords.width;
      if (coords.tilt === bitarea.tilts.TOP || coords.tilt === bitarea.tilts.BOTTOM) {
        props.raw.tilt = (coords.tilt === bitarea.tilts.TOP) ? bitarea.tilts.BOTTOM : bitarea.tilts.TOP;
      } else {
        props.raw.tilt = (coords.tilt === bitarea.tilts.LEFT) ? bitarea.tilts.RIGHT : bitarea.tilts.LEFT;
      }
      break;
    case bitarea.types.RHOMBUS:
      props.area.width = coords.width;
      props.area.height = coords.height;
      props.column.offset = Math.round(coords.width/2);
      props.column.overlap = -Math.round(coords.height/2);
      break;
    case bitarea.types.CIRCLEDTR:
    case bitarea.types.CIRCLECTR:
      props.start.x -= coords.r;
      props.start.y -= coords.r;
      props.offset.x = props.offset.y = coords.r;
      props.area.width = props.area.height = coords.r*2;
      break;
    case bitarea.types.RECTANGLE:
    case bitarea.types.SQUARE:
    case bitarea.types.ELLIPSE:
    default:
      props.area.width = coords.width;
      props.area.height = coords.height;
    }
    return props;
  }

  function computeGridProperties(rectCoords, patternProps) {

    var index = (g, p, fdim, fov) => Math.ceil((g-p)/(fdim+fov));
    var start = (p, i, fdim, fov) => p + i*(fdim+fov);
    var extra = (p, fdim, fov) => p - (fdim+fov);
    var count = (g, dim, s, fdim, fov) => Math.floor(((g + dim - (s + fdim)) / (fdim + fov)) + 1);

    let tmp, props = {};
    tmp = index(rectCoords.x, patternProps.start.x, patternProps.area.width, patternProps.raw.overlap);
    props.xs = start(patternProps.start.x, tmp, patternProps.area.width, patternProps.raw.overlap);
    [props.ts1, props.ts2] = (tmp%2 === 0) ? [patternProps.start.tilt, patternProps.raw.tilt] : [patternProps.raw.tilt, patternProps.start.tilt];
    props.xx = props.xs + patternProps.column.offset;
    props.tx1 = props.ts1;
    props.tx2 = props.ts2;
    tmp = extra(props.xx, patternProps.area.width, patternProps.raw.overlap);
    if (tmp >= rectCoords.x) {
      props.xx = tmp;
      props.tx1 = props.ts2;
      props.tx2 = props.ts1;
    }

    tmp = index(rectCoords.y, patternProps.start.y, patternProps.area.height, patternProps.column.overlap);
    props.ys = start(patternProps.start.y, tmp, patternProps.area.height, patternProps.column.overlap);
    props.is = Math.abs(tmp % 2);
    props.ix = Math.abs((tmp + 1) % 2);

    props.nx = count(rectCoords.x, rectCoords.width, props.xs, patternProps.area.width, patternProps.raw.overlap);
    props.nxx = count(rectCoords.x, rectCoords.width, props.xx, patternProps.area.width, patternProps.raw.overlap);
    props.ny = count(rectCoords.y, rectCoords.height, props.ys, patternProps.area.height, patternProps.column.overlap);
    return props;
  }

  function computeGridPropertiesEx(rectCoords, patternProps) {
    let gp, pp;
    pp = Object.create(patternProps);
    pp.raw = Object.create(patternProps.raw);
    if (pp.column.overlap !== 0) {
      throw new Error('column.overlap = ' + pp.column.overlap + ' => Unsupported figure properties for griding!');
    }
    pp.raw.overlap = 0;
    pp.raw.tilt = pp.start.tilt;
    gp = computeGridProperties(rectCoords, pp);
    if (gp.nx !== gp.nxx || gp.xs !== gp.xx) {
      throw new Error('Error when computing figure overlap by full width! => xs: ' + gp.xs + ' xx: ' + gp.xx + 'nx: ' + gp.nx + ' nxx: ' + gp.nxx);
    }
    gp.nx *= 2;
    gp.ts2 = patternProps.raw.tilt;
    pp.raw = null; pp = null;
    return gp;
  }

  var lineAttr = (p1, p2) => [(p1.y - p2.y) / (p1.x - p2.x), (p2.y*p1.x - p1.y*p2.x) / (p1.x - p2.x)];

  function computeLineValue(p1, p2, p) {
    let rtn, a, b;
    rtn = 0;
    if (p1.x === p2.x) {
      rtn = p.x - p1.x;
    } else {
      [a,b] = lineAttr(p1, p2);
      rtn = p.y - (a*p.x + b);
    }
    return rtn;
  }

  function circleIntersectLine(p1, p2, c) {
    let rtn, a, b, A, B, C, delta;
    rtn = 0;
    if (p1.x === p2.x) {
      delta =  c.r * c.r - (p1.x - c.x) * (p1.x - c.x);
    } else {
      [a,b] = lineAttr(p1, p2);
      A = 1 + a*a;
      B = 2 * (a * (b - c.y) - c.x);
      C = (b - c.y) * (b- c.y) + c.x * c.x - c.r * c.r;
      delta = B*B - 4*A*C;
    }
    if (delta >= 0) {
      rtn = (delta > 0) ? 2 : 1;
    }
    return rtn;
  }

  /*
   * FIGURE GRID
   */

  class FigureGrid {

    constructor(parent, pattern, scope) {
      if (this.constructor == FigureGrid.constructor) {
        throw new Error('Invalid Figure grid constructor call: abstract class');
      }
      this.pattern = pattern;
      this.elts = [];
      this.group = document.createElementNS(bitarea.NSSVG, 'g');
      this.parent = parent;
      this.parent.appendChild(this.group);
      this.scope = scope;
    }

    clonePattern(coords) {
      let generator = factory[this.pattern.getType()];
      if (!generator) {
        console.log('ERROR - Unsupported grid figure');
        return null;
      }
      let clone = new generator(this.group, true);
      clone.setCoords(coords);
      clone.redraw();
      return clone;
    }

    remove() {
      this.elts.forEach(e => e.remove());
      this.elts.splice(0, this.elts.length);
      this.parent.removeChild(this.group);
      this.parent = this.group = this.scope = null;
    }

    drawRaw(coords) {
      console.log('draw() not defined');
    }

  }

  /*
   * RECTANGLE GRID 
   */

  class RectangleGrid extends FigureGrid {

    constructor(parent, pattern, scope) {
      super(parent, pattern, scope);
    }

    draw(coords, patternCoords) {
      let elts = [];
      if (0 < coords.width && 0 < coords.height) {
        let pcoords, pprops, gprops, is, ix;
        pcoords = patternCoords || this.pattern.getCoords();
        pprops = getPatternProperties(this.pattern.getType(), pcoords);
        if (pprops.raw.overlap !== -pprops.area.width) {
          gprops = computeGridProperties(coords, pprops);
          pcoords.y = gprops.ys + gprops.is * (pprops.area.height + pprops.column.overlap) + pprops.offset.y;
          for (is = gprops.is; is < gprops.ny; is += 2) {
            this.drawRaw(elts, pcoords, gprops.xs, gprops.nx, pprops.area.width, pprops.raw.overlap, pprops.offset.x, gprops.ts1, gprops.ts2);
            pcoords.y += 2*(pprops.area.height + pprops.column.overlap);
          }
          pcoords.y = gprops.ys + gprops.ix * (pprops.area.height + pprops.column.overlap) + pprops.offset.y;
          for (ix = gprops.ix; ix < gprops.ny; ix += 2) {
            this.drawRaw(elts, pcoords, gprops.xx, gprops.nxx, pprops.area.width, pprops.raw.overlap, pprops.offset.x, gprops.tx1, gprops.tx2);
            pcoords.y += 2*(pprops.area.height + pprops.column.overlap);
          }
        } else {
          gprops = computeGridPropertiesEx(coords, pprops);
          pcoords.y = gprops.ys + pprops.offset.y;
          for (is = 0; is < gprops.ny; is++) {
            this.drawRawEx(elts, pcoords, gprops.xs, gprops.nx, pprops.area.width, pprops.offset.x, gprops.ts1, gprops.ts2);
            pcoords.y += pprops.area.height;
          }
        }
      }
      this.elts.forEach(e => e.remove());
      this.elts.splice(0, this.elts.length);
      elts.forEach(e => this.elts.push(e));
      elts.splice(0, this.elts.length);
    }

    drawRaw(elts, c, start, n, dim, overlap, offset, tilt1, tilt2) {
      c.x = start + offset;
      for (let i = 0; i < n; i++) {
        c.tilt = (i%2 === 0) ? tilt1 : tilt2;
        let elt = this.clonePattern(c);
        if (null !== elt) {
          elts.push(elt);
        }
        c.x += dim + overlap;
      }
    }

    drawRawEx(elts, c, start, n, dim, offset, tilt1, tilt2) {
      c.x = start + offset;
      for (let i = 0; i < n; i++) {
        c.tilt = (i%2 === 0 ) ? tilt1 : tilt2;
        let elt = this.clonePattern(c);
        if (null !== elt) {
          elts.push(elt);
        }
        c.x += (i%2 === 0) ? 0 : dim;
      }
    }

  }

  class Rectangle extends bitarea.Rectangle {
    
    constructor(parent, bond, gridParent) {
      super(parent, false);
      this.bindTo(bond);
      this.type = types.GRIDRECTANGLE;
      this.isGrid = true;
      this.grid = new RectangleGrid(gridParent, bond, this);
    }

    bindTo(bond) {
      super.bindTo(bond, clsQualifiers.GRIDSCOPE);
      bond.bindTo(this, clsQualifiers.GRIDBOND);
    }

    unbindFrom(bond) {
      bond = bond || this.bonds[0];
      if (bond !== this.bonds[0]) {
        throw new Error('Error managing bound element(s)');
      }
      super.unbindFrom(bond, clsQualifiers.GRIDSCOPE)
      bond.unbindFrom(this, clsQualifiers.GRIDBOND);
    }

    unbindAll() {
      this.unbindFrom();
    }

    remove() {
      super.remove();
      this.grid.remove();
      this.grid = null;
    }

    draw(coords, patternCoords) {
      super.draw(coords);
      this.grid.draw(coords, patternCoords);
    }

  } // RECTANGLE GRID

  /*
   * CIRCLE GRID 
   */

  class CircleGrid extends FigureGrid {

    constructor(parent, pattern, scope) {
      super(parent, pattern, scope);
    }

    draw(coords, patternCoords) {
      let elts = [];
      if (0 < coords.r) {
        let rcoords, pcoords, pprops, gprops, is, ix;
        rcoords = Object.create(coords);
        rcoords.width = rcoords.height = 2*rcoords.r;
        rcoords.x -= rcoords.r;
        rcoords.y -= rcoords.r;
        pcoords = patternCoords || this.pattern.getCoords();
        pprops = getPatternProperties(this.pattern.getType(), pcoords);
        if (pprops.raw.overlap !== -pprops.area.width) {
          gprops = computeGridProperties(rcoords, pprops);
          pcoords.y = gprops.ys + gprops.is * (pprops.area.height + pprops.column.overlap) + pprops.offset.y;
          for (is = gprops.is; is < gprops.ny; is += 2) {
            this.drawRaw(coords, elts, pcoords, gprops.xs, gprops.nx, pprops.area.width, pprops.raw.overlap, pprops.offset.x, gprops.ts1, gprops.ts2);
            pcoords.y += 2*(pprops.area.height + pprops.column.overlap);
          }
          pcoords.y = gprops.ys + gprops.ix * (pprops.area.height + pprops.column.overlap) + pprops.offset.y;
          for (ix = gprops.ix; ix < gprops.ny; ix += 2) {
            this.drawRaw(coords, elts, pcoords, gprops.xx, gprops.nxx, pprops.area.width, pprops.raw.overlap, pprops.offset.x, gprops.tx1, gprops.tx2);
            pcoords.y += 2*(pprops.area.height + pprops.column.overlap);
          }
        } else {
          gprops = computeGridPropertiesEx(rcoords, pprops);
          pcoords.y = gprops.ys + pprops.offset.y;
          for (is = 0; is < gprops.ny; is++) {
            this.drawRawEx(coords, elts, pcoords, gprops.xs, gprops.nx, pprops.area.width, pprops.offset.x, gprops.ts1, gprops.ts2);
            pcoords.y += pprops.area.height;
          }
        }
      }
      this.elts.forEach(e => e.remove());
      this.elts.splice(0, this.elts.length);
      elts.forEach(e => this.elts.push(e));
      elts.splice(0, this.elts.length);
    }

    drawRaw(coords, elts, c, start, n, dim, overlap, offset, tilt1, tilt2) {
      c.x = start + offset;
      for (let i = 0; i < n; i++) {
        c.tilt = (i%2 === 0) ? tilt1 : tilt2;
        if (this.isContained(coords, c)) {
          let elt = this.clonePattern(c);
          if (null !== elt) {
            elts.push(elt);
          }
        }
        c.x += dim + overlap;
      }
    }

    drawRawEx(coords, elts, c, start, n, dim, offset, tilt1, tilt2) {
      c.x = start + offset;
      for (let i = 0; i < n; i++) {
        c.tilt = (i%2 === 0 ) ? tilt1 : tilt2;
        if (this.isContained(coords, c)) {
          let elt = this.clonePattern(c);
          if (null !== elt) {
            elts.push(elt);
          }
        }
        c.x += (i%2 === 0) ? 0 : dim;
      }
    }

    isContained(gc, pc) {
      let rtn, type;
      type = this.pattern.getType();
      if (type === bitarea.types.CIRCLEDTR || type === bitarea.types.CIRCLECTR) {
        rtn = this.isPointWithin(gc, pc.x, pc.y, pc.r) ? true : false;
      } else {
        let pts = this.pattern.getPoints(pc);
        rtn = pts.reduce((a, e) => a && this.isPointWithin(gc, e.x, e.y), pts.length === 0 ? false : true);
      }
      return rtn;
    }

    isPointWithin(coords, x, y, off) {
      let d, dx, dy;
      off = off || 0;
      dx = x - coords.x;
      dy = y - coords.y;
      d = Math.sqrt(dx*dx + dy*dy) + off;
      return (d <= coords.r) ? true : false;
    }

  }

  class Circle extends bitarea.CircleEx {
    
    constructor(parent, bond, gridParent) {
      super(parent, false);
      this.bindTo(bond);
      this.type = types.GRIDCIRCLE;
      this.isGrid = true;
      this.grid = new CircleGrid(gridParent, bond, this);
    }

    bindTo(bond) {
      super.bindTo(bond, clsQualifiers.GRIDSCOPE);
      bond.bindTo(this, clsQualifiers.GRIDBOND);
    }

    unbindFrom(bond) {
      bond = bond || this.bonds[0];
      if (bond !== this.bonds[0]) {
        throw new Error('Error managing bound element(s)');
      }
      super.unbindFrom(bond, clsQualifiers.GRIDSCOPE)
      bond.unbindFrom(this, clsQualifiers.GRIDBOND);
    }

    unbindAll() {
      this.unbindFrom();
    }

    remove() {
      super.remove();
      this.grid.remove();
      this.grid = null;
    }

    draw(coords, patternCoords) {
      super.draw(coords);
      this.grid.draw(coords, patternCoords);
    }

  } // CIRCLE GRID

  /*
   * HEX GRID 
   */

  class HexGrid extends FigureGrid {

    constructor(parent, pattern, scope) {
      super(parent, pattern, scope);
    }

    draw(coords, patternCoords) {
      let elts = [];
      if (0 < coords.width && 0 < coords.height) {
        let pcoords, pprops, gprops, is, ix;
        pcoords = patternCoords || this.pattern.getCoords();
        pprops = getPatternProperties(this.pattern.getType(), pcoords);
        if (pprops.raw.overlap !== -pprops.area.width) {
          gprops = computeGridProperties(coords, pprops);
          pcoords.y = gprops.ys + gprops.is * (pprops.area.height + pprops.column.overlap) + pprops.offset.y;
          for (is = gprops.is; is < gprops.ny; is += 2) {
            this.drawRaw(coords, elts, pcoords, gprops.xs, gprops.nx, pprops.area.width, pprops.raw.overlap, pprops.offset.x, gprops.ts1, gprops.ts2);
            pcoords.y += 2*(pprops.area.height + pprops.column.overlap);
          }
          pcoords.y = gprops.ys + gprops.ix * (pprops.area.height + pprops.column.overlap) + pprops.offset.y;
          for (ix = gprops.ix; ix < gprops.ny; ix += 2) {
            this.drawRaw(coords, elts, pcoords, gprops.xx, gprops.nxx, pprops.area.width, pprops.raw.overlap, pprops.offset.x, gprops.tx1, gprops.tx2);
            pcoords.y += 2*(pprops.area.height + pprops.column.overlap);
          }
        } else {
          gprops = computeGridPropertiesEx(coords, pprops);
          pcoords.y = gprops.ys + pprops.offset.y;
          for (is = 0; is < gprops.ny; is++) {
            this.drawRawEx(coords, elts, pcoords, gprops.xs, gprops.nx, pprops.area.width, pprops.offset.x, gprops.ts1, gprops.ts2);
            pcoords.y += pprops.area.height;
          }
        }
      }
      this.elts.forEach(e => e.remove());
      this.elts.splice(0, this.elts.length);
      elts.forEach(e => this.elts.push(e));
      elts.splice(0, this.elts.length);
    }

    drawRaw(coords, elts, c, start, n, dim, overlap, offset, tilt1, tilt2) {
      c.x = start + offset;
      for (let i = 0; i < n; i++) {
        c.tilt = (i%2 === 0) ? tilt1 : tilt2;
        if (this.isContained(coords, c)) {
          let elt = this.clonePattern(c);
          if (null !== elt) {
            elts.push(elt);
          }
        }
        c.x += dim + overlap;
      }
    }

    drawRawEx(coords, elts, c, start, n, dim, offset, tilt1, tilt2) {
      c.x = start + offset;
      for (let i = 0; i < n; i++) {
        c.tilt = (i%2 === 0 ) ? tilt1 : tilt2;
        if (this.isContained(coords, c)) {
          let elt = this.clonePattern(c);
          if (null !== elt) {
            elts.push(elt);
          }
        }
        c.x += (i%2 === 0) ? 0 : dim;
      }
    }

    isContained(gc, pc) {
      let rtn, type;
      type = this.pattern.getType();
      if (type === bitarea.types.CIRCLEDTR || type === bitarea.types.CIRCLECTR) {
        rtn = this.isPointWithin(gc, pc.x, pc.y, pc.r) ? true : false;
      } else {
        let pts = this.pattern.getPoints(pc);
        rtn = pts.reduce((a, e) => a && this.isPointWithin(gc, e.x, e.y), pts.length === 0 ? false : true);
      }
      return rtn;
    }

    isPointWithin(coords, x, y, off) {
      let rtn, points, v0, v1, v2, v3, v4, v5, p;
      rtn = false;
      off = off || 0;
      p = { x : x, y : y, r : off };
      points = this.scope.getPoints(coords);
      v0 = computeLineValue(points[0], points[1], p);
      v1 = computeLineValue(points[1], points[2], p);
      v2 = computeLineValue(points[2], points[3], p);
      v3 = computeLineValue(points[3], points[4], p);
      v4 = computeLineValue(points[4], points[5], p);
      v5 = computeLineValue(points[5], points[0], p);
      if (coords.width > coords.height){
        rtn = (v0 >= 0 && v1 >= 0 && v2 <= 0 && v3 <= 0 && v4 <= 0 && v5 >= 0) ? true : false;
      } else {
        rtn = (v0 >= 0 && v1 <= 0 && v2 <= 0 && v3 <= 0 && v4 >= 0 && v5 >= 0) ? true : false;
      }
      if (off > 0) {
        v0 = circleIntersectLine(points[0], points[1], p);
        v1 = circleIntersectLine(points[1], points[2], p);
        v2 = circleIntersectLine(points[2], points[3], p);
        v3 = circleIntersectLine(points[3], points[4], p);
        v4 = circleIntersectLine(points[4], points[5], p);
        v5 = circleIntersectLine(points[5], points[0], p);
        rtn = rtn && v0 < 2 && v1 < 2 && v2 < 2 && v3 < 2 && v4 < 2 && v5 < 2;
      }
      return rtn;
    }

  }

  class Hex extends bitarea.HexEx {
    
    constructor(parent, bond, gridParent) {
      super(parent, false);
      this.bindTo(bond);
      this.type = types.GRIDHEX;
      this.isGrid = true;
      this.grid = new HexGrid(gridParent, bond, this);
    }

    bindTo(bond) {
      super.bindTo(bond, clsQualifiers.GRIDSCOPE);
      bond.bindTo(this, clsQualifiers.GRIDBOND);
    }

    unbindFrom(bond) {
      bond = bond || this.bonds[0];
      if (bond !== this.bonds[0]) {
        throw new Error('Error managing bound element(s)');
      }
      super.unbindFrom(bond, clsQualifiers.GRIDSCOPE)
      bond.unbindFrom(this, clsQualifiers.GRIDBOND);
    }

    unbindAll() {
      this.unbindFrom();
    }

    remove() {
      super.remove();
      this.grid.remove();
      this.grid = null;
    }

    draw(coords, patternCoords) {
      super.draw(coords);
      this.grid.draw(coords, patternCoords);
    }

  } // HEX GRID

  return {
    Rectangle, Circle, Hex
  };

})(); /* BIT Grid Area Definition */
