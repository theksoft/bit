/**
 * Boardgame image tool (BiT) Grid Area Definition
 * https://github.com/theksoft/bit
 *
 * Copyright 2017 Herve Retaureau
 * Released under the MIT license
 */

var bitgrid = (function() {
  'use strict';

  const scopes = {
    INNER           : 'inner',
    OUTER           : 'outer'
  };

  const aligns = {
    STANDARD        : 'std',
    ALT_HORIZONTAL  : 'hAlt',
    ALT_VERTICAL    : 'vAlt'
  };

  const orders = {
    TOPLEFT         : 'TL',
    LEFTTOP         : 'LT',
    LEFTBOTTOM      : 'LB',
    BOTTOMLEFT      : 'BL',
    BOTTOMRIGHT     : 'BR',
    RIGHTBOTTOM     : 'RB',
    RIGHTTOP        : 'RT',
    TOPRIGHT        : 'TR'
  };

  const types = {
    GRIDRECTANGLE   : 'gridRectangle',
    GRIDCIRCLE      : 'gridCircle',
    GRIDHEX         : 'gridHex'
  };

  const clsQualifiers = {
    GRIDSCOPE       : 'scope',
    GRIDBOND        : 'bond'
  }

  const factory = {
    'rectangle'     : bitarea.Rectangle,
    'square'        : bitarea.Square,
    'rhombus'       : bitarea.Rhombus,
    'circleCtr'     : bitarea.Circle,
    'circleDtr'     : bitarea.CircleEx,
    'ellipse'       : bitarea.Ellipse,
    'triangleIsc'   : bitarea.IsoscelesTriangle,
    'triangleEql'   : bitarea.EquilateralTriangle,
    'triangleRct'   : bitarea.RectangleTriangle,
    'hexRct'        : bitarea.Hex,
    'hexDtr'        : bitarea.HexEx
  };

  /*
   * PATTERN PROPERTIES 
   */

  function getPatternProperties(type, coords, align) {
    let props = {
      start   : { x       : coords.x, y      : coords.y,              tilt                : coords.tilt },
      offset  : { x       : 0,        y      : 0 },
      area    : { width   : 0,        height : 0 },
      raw     : { overlap : 0,        tilt   : bitarea.tilts.DEFAULT, switchTiltOnNewRaw  : false },
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
        props.column.offset = (aligns.STANDARD === align) ? Math.round(coords.width/2) : 0;
        props.raw.tilt = (coords.tilt === bitarea.tilts.TOP) ? bitarea.tilts.BOTTOM : bitarea.tilts.TOP;
      } else {
        props.column.offset = coords.width;
        props.column.overlap = -Math.round(coords.height/2);
        props.raw.tilt = (coords.tilt === bitarea.tilts.LEFT) ? bitarea.tilts.RIGHT : bitarea.tilts.LEFT;
        if (aligns.STANDARD !== align) {
          props.column.offset = 0;
          props.raw.switchTiltOnNewRaw = true;
        }
      }
      break;
    case bitarea.types.TRIANGLERCT:
      props.area.width = coords.width;
      props.area.height = coords.height;
      props.raw.overlap = -coords.width;
      if (coords.tilt === bitarea.tilts.TOP || coords.tilt === bitarea.tilts.BOTTOM) {
        props.raw.tilt = (coords.tilt === bitarea.tilts.TOP) ? bitarea.tilts.BOTTOM : bitarea.tilts.TOP;
        if (aligns.STANDARD !== align) {
          props.raw.extraTilts = [bitarea.tilts.LEFT, bitarea.tilts.RIGHT];
        }
      } else {
        props.raw.tilt = (coords.tilt === bitarea.tilts.LEFT) ? bitarea.tilts.RIGHT : bitarea.tilts.LEFT;
        if (aligns.STANDARD !== align) {
          props.raw.extraTilts = [bitarea.tilts.TOP, bitarea.tilts.BOTTOM];
        }
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
      if (aligns.ALT_HORIZONTAL === align) {
        props.column.offset = coords.r;
        props.column.overlap = -Math.round(coords.r * (2 - Math.sqrt(3)));
      } else if (aligns.ALT_VERTICAL === align) {
        props.raw.overlap = Math.round(2* coords.r * (Math.sqrt(3) - 1));
        props.column.overlap = -coords.r;
        props.column.offset = Math.round(coords.r * Math.sqrt(3));
      }
      break;
    case bitarea.types.RECTANGLE:
    case bitarea.types.SQUARE:
      props.area.width = coords.width;
      props.area.height = coords.height;
      if (aligns.ALT_HORIZONTAL === align) {
        props.column.offset = Math.round(coords.width/2);
      } else if (aligns.ALT_VERTICAL === align) {
        props.raw.overlap = coords.width;
        props.column.overlap = -Math.round(coords.height/2);
        props.column.offset = coords.width;
      }
      break;
    case bitarea.types.ELLIPSE:
      props.area.width = coords.width;
      props.area.height = coords.height;
      if (aligns.ALT_HORIZONTAL === align) {
        props.column.offset = Math.round(coords.width/2);
        props.column.overlap = -Math.round(coords.height * (1 - Math.sqrt(3)/2));
      } else if (aligns.ALT_VERTICAL === align) {
        props.raw.overlap = Math.round(coords.width * (Math.sqrt(3) - 1));
        props.column.overlap = -Math.round(coords.height/2);
        props.column.offset = Math.round(coords.width * Math.sqrt(3)/2);
      }
      break;
    default:
      props.area.width = coords.width;
      props.area.height = coords.height;
    }
    return props;
  }

  /*
   * GRID PROPERTIES (INNER) 
   */

  function computeInnerGridProperties(rectCoords, patternProps, space) {

    var index = (g, p, step) => Math.ceil((g-p)/step);
    var start = (p, i, step) => p + i*step;
    var extra = (p, step) => p - step;
    var count = (g, dim, s, fdim, step) => Math.floor(((g + dim - (s + fdim)) / step) + 1);

    let tmp, stepx, stepy, exs, props = {};
    stepx = patternProps.area.width + patternProps.raw.overlap + (0 >= patternProps.raw.overlap ? space : 2*space);
    tmp = index(rectCoords.x, patternProps.start.x, stepx);
    props.xs = start(patternProps.start.x, tmp, stepx);
    [props.ts1, props.ts2] = (tmp%2 === 0) ? [patternProps.start.tilt, patternProps.raw.tilt] : [patternProps.raw.tilt, patternProps.start.tilt];
    exs = 0;
    if(0 !== patternProps.column.offset) {
      if (0 < patternProps.raw.overlap || patternProps.start.tilt !== patternProps.raw.tilt) {
        exs = space;
      } else {
        exs = Math.round(space/2);
      }
    }
    props.xx = props.xs + patternProps.column.offset + exs
    props.tx1 = props.ts1;
    props.tx2 = props.ts2;
    tmp = extra(props.xx, stepx);
    if (tmp >= rectCoords.x) {
      props.xx = tmp;
      props.tx1 = props.ts2;
      props.tx2 = props.ts1;
    }
    props.spx = stepx;

    stepy = patternProps.area.height + patternProps.column.overlap + (0 >= patternProps.raw.overlap ? space : Math.round(space/2));
    tmp = index(rectCoords.y, patternProps.start.y, stepy);
    props.ys = start(patternProps.start.y, tmp, stepy);
    props.is = Math.abs(tmp % 2);
    props.ix = Math.abs((tmp + 1) % 2);
    if (patternProps.raw.switchTiltOnNewRaw) {
      props.ts1 = props.ts2 = patternProps.start.tilt;
      props.tx1 = props.tx2 = patternProps.raw.tilt;
    }
    props.spy = stepy;

    props.nx = count(rectCoords.x, rectCoords.width, props.xs, patternProps.area.width, stepx);
    props.nxx = count(rectCoords.x, rectCoords.width, props.xx, patternProps.area.width, stepx);
    props.ny = count(rectCoords.y, rectCoords.height, props.ys, patternProps.area.height, stepy);
    return props;
  }

  /*
   * GRID PROPERTIES (OUTER) 
   */

  function computeOuterGridProperties(rectCoords, patternProps, space, maxWidth, maxHeight) {

    var index = (g, p, fdim, step) => Math.ceil((g-(p+fdim))/step);
    var start = (p, i, step) => p + i*step;
    var extra = (p, step) => p - step;
    var count = (g, dim, s, fdim, step) => Math.floor(((g + dim - s) / step) + 1);
    var last = (s, n, step) => s + (n-1)*step;

    let tmp, stepx, stepy, exs, props = {};
    stepx = patternProps.area.width + patternProps.raw.overlap + (0 >= patternProps.raw.overlap ? space : 2*space);
    tmp = index(rectCoords.x, patternProps.start.x, patternProps.area.width, stepx);
    props.xs = start(patternProps.start.x, tmp, stepx);
    if (props.xs < 0) {
      props.xs += stepx;
      tmp++;
    }
    [props.ts1, props.ts2] = (tmp%2 === 0) ? [patternProps.start.tilt, patternProps.raw.tilt] : [patternProps.raw.tilt, patternProps.start.tilt];
    exs = 0;
    if(0 !== patternProps.column.offset) {
      if (0 < patternProps.raw.overlap || patternProps.start.tilt !== patternProps.raw.tilt) {
        exs = space;
      } else {
        exs = Math.round(space/2);
      }
    }
    props.xx = props.xs + patternProps.column.offset + exs
    props.tx1 = props.ts1;
    props.tx2 = props.ts2;
    tmp = extra(props.xx, stepx);
    if (tmp > 0 && tmp + patternProps.area.width >= rectCoords.x) {
      props.xx = tmp;
      props.tx1 = props.ts2;
      props.tx2 = props.ts1;
    }
    props.spx = stepx;

    stepy = patternProps.area.height + patternProps.column.overlap + (0 >= patternProps.raw.overlap ? space : Math.round(space/2));
    tmp = index(rectCoords.y, patternProps.start.y, patternProps.area.height, stepy);
    props.ys = start(patternProps.start.y, tmp, stepy);
    if (props.ys < 0) {
      props.ys += stepy;
      tmp++;
    }
    props.is = Math.abs(tmp % 2);
    props.ix = Math.abs((tmp + 1) % 2);
    if (patternProps.raw.switchTiltOnNewRaw) {
      props.ts1 = props.ts2 = patternProps.start.tilt;
      props.tx1 = props.tx2 = patternProps.raw.tilt;
    }
    props.spy = stepy;

    props.nx = count(rectCoords.x, rectCoords.width, props.xs, patternProps.area.width, stepx);
    props.nxx = count(rectCoords.x, rectCoords.width, props.xx, patternProps.area.width, stepx);
    props.ny = count(rectCoords.y, rectCoords.height, props.ys, patternProps.area.height, stepy);

    tmp = last(props.xs, props.nx, stepx);
    if (tmp >= rectCoords.x + rectCoords.width || tmp + patternProps.area.width > maxWidth ) props.nx--;
    tmp = last(props.xx, props.nxx, stepx);
    if (tmp >= rectCoords.x + rectCoords.width || tmp + patternProps.area.width > maxWidth ) props.nxx--;
    tmp = last(props.ys, props.ny, stepy);
    if (tmp >= rectCoords.y + rectCoords.height || tmp + patternProps.area.height > maxHeight ) props.ny--;
    return props;
  }

  /*
   * GRID PROPERTIES (FULL OVERLAP) 
   */

  function computeGridPropertiesEx(rectCoords, patternProps, space, fCompute, maxWidth, maxHeight) {
    let gp, pp, snc;
    fCompute = fCompute || computeInnerGridProperties;
    pp = Object.assign({}, patternProps);
    pp.raw = Object.assign({}, patternProps.raw);
    pp.area = Object.assign({}, patternProps.area);
    if (pp.column.overlap !== 0) {
      throw new Error('column.overlap = ' + pp.column.overlap + ' => Unsupported figure properties for griding!');
    }
    pp.raw.overlap = 0;
    pp.area.width += space;
    gp = fCompute(rectCoords, pp, space, maxWidth, maxHeight);
    if (gp.nx !== gp.nxx || gp.xs !== gp.xx) {
      throw new Error('Error when computing figure overlap by full width! => xs: ' + gp.xs + ' xx: ' + gp.xx + 'nx: ' + gp.nx + ' nxx: ' + gp.nxx);
    }
    gp.nx *= 2;
    snc = (patternProps.start.tilt === gp.ts1);
    gp.ts1 = gp.tx1 = patternProps.start.tilt;
    gp.ts2 = gp.tx2 = patternProps.raw.tilt;
    if (patternProps.raw.extraTilts) {
      if (snc) {
        gp.tx1 = patternProps.raw.extraTilts[0];
        gp.tx2 = patternProps.raw.extraTilts[1];
      } else {
        gp.ts1 = patternProps.raw.extraTilts[0];
        gp.ts2 = patternProps.raw.extraTilts[1];
      }
    }
    gp.spc = space;
    pp.area = pp.raw = null; pp = null;
    return gp;
  }

  /*
   * GEOMETRIC COMPUTATION 
   */

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

    constructor(parent, pattern, scope, drawScope, drawAlign, gridSpace, gridOrder) {
      if (this.constructor == FigureGrid.constructor) {
        throw new Error('Invalid Figure grid constructor call: abstract class');
      }
      this._pattern = pattern;
      this._areas = [];
      this._group = document.createElementNS(bitarea.NSSVG, 'g');
      this._parent = parent;
      this._parent.appendChild(this._group);
      this._scope = scope;
      this._drawScope = drawScope;
      this._drawAlign = drawAlign;
      this._gridSpace = gridSpace;
      this._gridOrder = gridOrder;
    }

    get areas() {
      return this._areas.slice();
    }

    clonePattern(coords) {
      let generator = factory[this._pattern.type];
      if (!generator) {
        console.log('ERROR - Unsupported grid figure');
        return null;
      }
      let clone = new generator(this._group, true);
      clone.coords = coords;
      clone.redraw();
      return clone;
    }

    remove() {
      this._areas.forEach(e => e.remove());
      this._areas.splice(0, this._areas.length);
      this._parent.removeChild(this._group);
      this._parent = this._group = this._scope = null;
    }

    draw(coords, patternCoords) {
      let areas = [];
      if (this.areValidCoords(coords)) {
        let rcoords, pcoords, pprops, gprops, space, is, ix, bOuter, mw, mh, computeGridProperties;
        space = this._gridSpace;
        rcoords = this.getBoundingRectCoords(coords);
        pcoords = this._pattern.copyCoords(patternCoords);
        pprops = getPatternProperties(this._pattern.type, pcoords, this._drawAlign);
        mw = this._parent.getAttribute('width');
        mh = this._parent.getAttribute('height');
        bOuter = (this._drawScope !== 'inner');
        computeGridProperties = bOuter ? computeOuterGridProperties : computeInnerGridProperties;
        if (pprops.raw.overlap !== -pprops.area.width) {
          gprops = computeGridProperties(rcoords, pprops, space, mw, mh);
          pcoords.y = gprops.ys + gprops.is * gprops.spy + pprops.offset.y;
          for (is = gprops.is; is < gprops.ny; is += 2) {
            this.drawRaw(coords, areas, pcoords, gprops.xs, gprops.nx, gprops.spx, pprops.offset.x, gprops.ts1, gprops.ts2, !bOuter);
            pcoords.y += 2*gprops.spy;
          }
          pcoords.y = gprops.ys + gprops.ix * gprops.spy + pprops.offset.y;
          for (ix = gprops.ix; ix < gprops.ny; ix += 2) {
            this.drawRaw(coords, areas, pcoords, gprops.xx, gprops.nxx, gprops.spx, pprops.offset.x, gprops.tx1, gprops.tx2, !bOuter);
            pcoords.y += 2*gprops.spy;
          }
        } else {
          gprops = computeGridPropertiesEx(rcoords, pprops, space, computeGridProperties, mw, mh);
          pcoords.y = gprops.ys + gprops.is * gprops.spy + pprops.offset.y;
          for (is = gprops.is; is < gprops.ny; is += 2) {
            this.drawRawEx(coords, areas, pcoords, gprops.xs, gprops.nx, gprops.spx, pprops.offset.x, gprops.spc, gprops.ts1, gprops.ts2, gprops.tx1, gprops.tx2, !bOuter);
            pcoords.y += 2*gprops.spy;
          }
          pcoords.y = gprops.ys + gprops.ix * gprops.spy + pprops.offset.y;
          for (ix = gprops.ix; ix < gprops.ny; ix += 2) {
            this.drawRawEx(coords, areas, pcoords, gprops.xs, gprops.nx, gprops.spx, pprops.offset.x, gprops.spc, gprops.tx1, gprops.tx2, gprops.ts1, gprops.ts2, !bOuter);
            pcoords.y += 2*gprops.spy;
          }
        }
      }
      this._areas.forEach(e => e.remove());
      this._areas.splice(0, this._areas.length);
      areas.forEach(e => this._areas.push(e));
      areas.splice(0, areas.length);
      this.reorder();
    }

    areValidCoords(coords) {
      console.log('areValidCoords() not defined');
      return false;
    }

    getBoundingRectCoords(coords) {
      return coords;
    }

    drawRaw(coords, areas, c, start, n, step, offset, tilt1, tilt2, bInner) {
      console.log('drawRaw() not defined');
    }

    drawRawEx(coords, areas, c, start, n, step, offset, tilt1, tilt2, bInner) {
      console.log('drawRawEx() not defined');
    }

    get gridScope() {
      return this._drawScope;
    }

    set gridScope(v) {
      this._drawScope = v;
      this.draw(this._scope.coords, this._pattern.coords);
    }

    get gridAlign() {
      return this._drawAlign;
    }

    set gridAlign(v) {
      this._drawAlign = v;
      this.draw(this._scope.coords, this._pattern.coords);
    }

    get gridSpace() {
      return this._gridSpace;
    }

    set gridSpace(v) {
      this._gridSpace = v;
      this.draw(this._scope.coords, this._pattern.coords);
    }

    get gridOrder() {
      return this._gridOrder;
    }

    set gridOrder(v) {
      this._gridOrder = v;
      this.reorder();
    }

    reorder() {
      var dx = (a,b) => a.coords.x - b.coords.x;
      var dy = (a,b) => a.coords.y - b.coords.y;
      let m, s, fm, fs;

      switch(this._gridOrder) {
      case orders.TOPLEFT:      m = dy; s = dx; fm = fs = 1; break;
      case orders.LEFTTOP:      m = dx; s = dy; fm = fs = 1; break;
      case orders.LEFTBOTTOM:   m = dx; s = dy; fm = 1; fs = -1; break;
      case orders.BOTTOMLEFT:   m = dy; s = dx; fm = -1; fs = 1; break;
      case orders.BOTTOMRIGHT:  m = dy; s = dx; fm = fs = -1; break;
      case orders.RIGHTBOTTOM:  m = dx; s = dy; fm = fs = -1; break;
      case orders.RIGHTTOP:     m = dx; s = dy; fm = -1; fs = 1; break;
      case orders.TOPRIGHT:     m = dy; s = dx; fm = 1; fs = -1; break;
      default:                  m = dy; s = dx; fm = fs = 1;
      }

      this._areas.sort((a,b) => {
        let rtn;
        rtn = m(a,b)*fm;
        if (Math.abs(rtn) < 2) rtn = 0; // Round errors esp. with odd space numbers
        if (0 === rtn) {
          rtn = s(a,b)*fs;
          if (Math.abs(rtn) < 2) rtn = 0;
        }
        return rtn;
      });
    }

    freezeTo(areas, newParent, specialize) {
      let generator, props;
      generator = factory[this._pattern.type];
      if (!generator) {
        console.log('ERROR - Unsupported managing grid figure');
        return;
      }
      this._areas.forEach((e,i) => {
        let c, props;
        c = e.coords;
        props = this._scope.areaProperties;
        specialize(props, (i+1).toString());
        if (!this._pattern.equalCoords(c)) {
          let clone = new generator(newParent, false);
          clone.coords = c;
          clone.redraw();
          clone.areaProperties = props;
          areas.push(clone);
        } else {
          this._pattern.areaProperties = props;  // within the grid
        }
      });
    }

    isPatternInGrid() {
      return this._areas.reduce((a,e) => a || this._pattern.equalCoords(e.coords), false);
    }

    toRecord(rtn) {
      rtn.isGrid = true;
      rtn.drawScope = this._drawScope;
      rtn.drawAlign = this._drawAlign;
      rtn.gridSpace = this._gridSpace;
      rtn.gridOrder = this._gridOrder;
      return rtn;
    }

  }

  /*
   * RECTANGLE GRID 
   */

  class RectangleGrid extends FigureGrid {

    constructor(parent, pattern, scope, drawScope, drawAlign, gridSpace, gridOrder) {
      super(parent, pattern, scope, drawScope, drawAlign, gridSpace, gridOrder);
    }

    areValidCoords(coords) {
      return (0 < coords.width && 0 < coords.height);
    }

    drawRaw(coords, areas, c, start, n, step, offset, tilt1, tilt2) {
      c.x = start + offset;
      for (let i = 0; i < n; i++) {
        c.tilt = (i%2 === 0) ? tilt1 : tilt2;
        let elt = this.clonePattern(c);
        if (null !== elt) {
          areas.push(elt);
        }
        c.x += step;
      }
    }

    drawRawEx(coords, areas, c, start, n, step, offset, spc, tilt1, tilt2, tilt3, tilt4) {
      let tilts = [tilt1, tilt2, tilt3, tilt4];
      c.x = start + offset;
      for (let i = 0; i < n; i++) {
        c.tilt = tilts[i%4];
        let elt = this.clonePattern(c);
        if (null !== elt) {
          areas.push(elt);
        }
        c.x += (i%2 === 0) ? spc : step - spc;
      }
    }

  }

  class Rectangle extends bitarea.Rectangle {
    
    constructor(parent, bond, gridParent, drawScope, drawAlign, gridSpace, gridOrder) {
      super(parent, false);
      this.bindTo(bond);
      this._type = types.GRIDRECTANGLE;
      this.isGrid = true;
      this._grid = new RectangleGrid(gridParent, bond, this, drawScope, drawAlign, gridSpace, gridOrder);
    }

    bindTo(bond) {
      super.bindTo(bond, clsQualifiers.GRIDSCOPE);
      bond.bindTo(this, clsQualifiers.GRIDBOND);
    }

    unbindFrom(bond) {
      bond = bond || this._bonds[0];
      if (bond !== this._bonds[0]) {
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
      this._grid.remove();
      this._grid = null;
    }

    draw(coords, patternCoords) {
      super.draw(coords);
      this._grid.draw(coords, patternCoords);
    }

    get gridScope() {
      return this._grid.gridScope;
    }

    set gridScope(v) {
      this._grid.gridScope = v;
    }

    get gridAlign() {
      return this._grid.gridAlign;
    }

    set gridAlign(v) {
      this._grid.gridAlign = v;
    }

    get gridSpace() {
      return this._grid.gridSpace;
    }

    set gridSpace(v) {
      this._grid.gridSpace = v;
    }

    get gridOrder() {
      return this._grid.gridOrder;
    }

    set gridOrder(v) {
      this._grid.gridOrder = v;
    }

    freezeTo(areas, specialize) {
      this._grid.freezeTo(areas, this._parent, specialize);
    }

    get areas() {
      return this._grid.areas;
    }

    isPatternInGrid() {
      return this._grid.isPatternInGrid();
    }

    toRecord(index, areas) {
      return this._grid.toRecord(super.toRecord(index, areas));
    }

  } // RECTANGLE GRID

  /*
   * CIRCLE GRID 
   */

  class CircleGrid extends FigureGrid {

    constructor(parent, pattern, scope, drawScope, drawAlign, gridSpace, gridOrder) {
      super(parent, pattern, scope, drawScope, drawAlign, gridSpace, gridOrder);
    }

    areValidCoords(coords) {
      return (0 < coords.r);
    }

    getBoundingRectCoords(coords) {
      let rtn = this._scope.copyCoords(coords);
      rtn.width = rtn.height = 2*rtn.r;
      rtn.x -= rtn.r;
      rtn.y -= rtn.r;
      return rtn;
    }

    drawRaw(coords, areas, c, start, n, step, offset, tilt1, tilt2, bInner) {
      c.x = start + offset;
      for (let i = 0; i < n; i++) {
        c.tilt = (i%2 === 0) ? tilt1 : tilt2;
        if ((bInner && this.isContained(coords, c)) || (!bInner && this.intersect(coords, c))) {
          let elt = this.clonePattern(c);
          if (null !== elt) {
            areas.push(elt);
          }
        }
        c.x += step;
      }
    }

    drawRawEx(coords, areas, c, start, n, step, offset, spc, tilt1, tilt2, tilt3, tilt4, bInner) {
      let tilts = [tilt1, tilt2, tilt3, tilt4];
      c.x = start + offset;
      for (let i = 0; i < n; i++) {
        c.tilt = tilts[i%4];
        if ((bInner && this.isContained(coords, c)) || (!bInner && this.intersect(coords, c))) {
          let elt = this.clonePattern(c);
          if (null !== elt) {
            areas.push(elt);
          }
        }
        c.x += (i%2 === 0) ? spc : step - spc;
      }
    }

    isContained(gc, pc) {
      let rtn, type;
      type = this._pattern.type;
      if (type === bitarea.types.CIRCLEDTR || type === bitarea.types.CIRCLECTR) {
        rtn = this.isPointWithin(gc, pc.x, pc.y, pc.r) ? true : false;
      } else {
        let pts = this._pattern.getPoints(pc);
        rtn = pts.reduce((a, e) => a && this.isPointWithin(gc, e.x, e.y), pts.length === 0 ? false : true);
      }
      return rtn;
    }

    intersect(gc, pc) {
      let rtn, type;
      type = this._pattern.type;
      if (type === bitarea.types.CIRCLEDTR || type === bitarea.types.CIRCLECTR) {
        rtn = this.isPointWithin(gc, pc.x, pc.y, -pc.r) ? true : false;
      } else {
        let pts = this._pattern.getPoints(pc);
        rtn = pts.reduce((a, e) => a || this.isPointWithin(gc, e.x, e.y), false);
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
    
    constructor(parent, bond, gridParent, drawScope, drawAlign, gridSpace, gridOrder) {
      super(parent, false);
      this.bindTo(bond);
      this._type = types.GRIDCIRCLE;
      this.isGrid = true;
      this._grid = new CircleGrid(gridParent, bond, this, drawScope, drawAlign, gridSpace, gridOrder);
    }

    bindTo(bond) {
      super.bindTo(bond, clsQualifiers.GRIDSCOPE);
      bond.bindTo(this, clsQualifiers.GRIDBOND);
    }

    unbindFrom(bond) {
      bond = bond || this._bonds[0];
      if (bond !== this._bonds[0]) {
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
      this._grid.remove();
      this._grid = null;
    }

    draw(coords, patternCoords) {
      super.draw(coords);
      this._grid.draw(coords, patternCoords);
    }

    get gridScope() {
      return this._grid.gridScope;
    }

    set gridScope(v) {
      this._grid.gridScope = v;
    }

    get gridAlign() {
      return this._grid.gridAlign;
    }

    set gridAlign(v) {
      this._grid.gridAlign = v;
    }

    get gridSpace() {
      return this._grid.gridSpace;
    }

    set gridSpace(v) {
      this._grid.gridSpace = v;
    }

    get gridOrder() {
      return this._grid.gridOrder;
    }

    set gridOrder(v) {
      this._grid.gridOrder = v;
    }

    freezeTo(areas, specialize) {
      this._grid.freezeTo(areas, this._parent, specialize);
    }

    get areas() {
      return this._grid.areas;
    }

    isPatternInGrid() {
      return this._grid.isPatternInGrid();
    }

    toRecord(index, areas) {
      return this._grid.toRecord(super.toRecord(index, areas));
    }

  } // CIRCLE GRID

  /*
   * HEX GRID 
   */

  class HexGrid extends FigureGrid {

    constructor(parent, pattern, scope, drawScope, drawAlign, gridSpace, gridOrder) {
      super(parent, pattern, scope, drawScope, drawAlign, gridSpace, gridOrder);
    }

    areValidCoords(coords) {
      return (0 < coords.width && 0 < coords.height);
    }

    drawRaw(coords, areas, c, start, n, step, offset, tilt1, tilt2, bInner) {
      c.x = start + offset;
      for (let i = 0; i < n; i++) {
        c.tilt = (i%2 === 0) ? tilt1 : tilt2;
        if ((bInner && this.isContained(coords, c)) || (!bInner && this.intersect(coords, c))) {
          let elt = this.clonePattern(c);
          if (null !== elt) {
            areas.push(elt);
          }
        }
        c.x += step;
      }
    }

    drawRawEx(coords, areas, c, start, n, step, offset, spc, tilt1, tilt2, tilt3, tilt4, bInner) {
      let tilts = [tilt1, tilt2, tilt3, tilt4];
      c.x = start + offset;
      for (let i = 0; i < n; i++) {
        c.tilt = tilts[i%4];
        if ((bInner && this.isContained(coords, c)) || (!bInner && this.intersect(coords, c))) {
          let elt = this.clonePattern(c);
          if (null !== elt) {
            areas.push(elt);
          }
        }
        c.x += (i%2 === 0) ? spc : step - spc;
      }
    }

    isContained(gc, pc) {
      let rtn, type;
      type = this._pattern.type;
      if (type === bitarea.types.CIRCLEDTR || type === bitarea.types.CIRCLECTR) {
        rtn = this.isPointWithin(gc, pc.x, pc.y, pc.r) ? true : false;
      } else {
        let pts = this._pattern.getPoints(pc);
        rtn = pts.reduce((a, e) => a && this.isPointWithin(gc, e.x, e.y), pts.length === 0 ? false : true);
      }
      return rtn;
    }

    intersect(gc, pc) {
      let rtn, type;
      type = this._pattern.type;
      if (type === bitarea.types.CIRCLEDTR || type === bitarea.types.CIRCLECTR) {
        rtn = this.isPointWithin(gc, pc.x, pc.y, -pc.r) ? true : false;
      } else {
        let pts = this._pattern.getPoints(pc);
        rtn = pts.reduce((a, e) => a || this.isPointWithin(gc, e.x, e.y), false);
      }
      return rtn;
    }

    isPointWithin(coords, x, y, off) {
      const fw = [1, 1, -1, -1, -1, 1], fh = [1, -1, -1, -1, 1, 1];
      let f, rtn, points, p;
      off = off || 0;
      p = { x : x, y : y, r : off };
      f = (coords.width > coords.height) ? fw : fh;
      points = this._scope.getPoints(coords);
      rtn = points.reduce((a,e,i,t) => a && (computeLineValue(e, t[(i+1)%t.length], p) * f[i] >= 0), true);
      if (off > 0) {
        rtn = points.reduce((a,e,i,t) => a && (circleIntersectLine(e, t[(i+1)%t.length], p) < 2), rtn);
      } else if (!rtn && off < 0) {
        rtn = points.reduce((a,e,i,t) => a || (circleIntersectLine(e, t[(i+1)%t.length], p) > 0), false);
      }
      return rtn;
    }

  }

  class Hex extends bitarea.HexEx {
    
    constructor(parent, bond, gridParent, drawScope, drawAlign, gridSpace, gridOrder) {
      super(parent, false);
      this.bindTo(bond);
      this._type = types.GRIDHEX;
      this.isGrid = true;
      this._grid = new HexGrid(gridParent, bond, this, drawScope, drawAlign, gridSpace, gridOrder);
    }

    bindTo(bond) {
      super.bindTo(bond, clsQualifiers.GRIDSCOPE);
      bond.bindTo(this, clsQualifiers.GRIDBOND);
    }

    unbindFrom(bond) {
      bond = bond || this._bonds[0];
      if (bond !== this._bonds[0]) {
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
      this._grid.remove();
      this._grid = null;
    }

    draw(coords, patternCoords) {
      super.draw(coords);
      this._grid.draw(coords, patternCoords);
    }

    get gridScope() {
      return this._grid.gridScope;
    }

    set gridScope(v) {
      this._grid.gridScope = v;
    }

    get gridAlign() {
      return this._grid.gridAlign;
    }

    set gridAlign(v) {
      this._grid.gridAlign = v;
    }

    get gridSpace() {
      return this._grid.gridSpace;
    }

    set gridSpace(v) {
      this._grid.gridSpace = v;
    }

    get gridOrder() {
      return this._grid.gridOrder;
    }

    set gridOrder(v) {
      this._grid.gridOrder = v;
    }

    freezeTo(areas, specialize) {
      this._grid.freezeTo(areas, this._parent, specialize);
    }

    get areas() {
      return this._grid.areas;
    }

    isPatternInGrid() {
      return this._grid.isPatternInGrid();
    }

    toRecord(index, areas) {
      return this._grid.toRecord(super.toRecord(index, areas));
    }

  } // HEX GRID

  /*
   * GRID FACTORY FROM RECORD
   */

  function createFromRecord(record, parent, gridParent, areas) {
    const factory = {
      'gridRectangle' : bitgrid.Rectangle,
      'gridCircle'    : bitgrid.Circle,
      'gridHex'       : bitgrid.Hex
    };
    let figure, generator;
    if (!record.isGrid) {
      return null;
    }
    if (record.bonds.length !== 1 || areas.length <= record.bonds[0]) {
      throw new Error('ERROR - Corrupted record with bad grid pattern');
    }
    generator = factory[record.type];
    if (!generator) {
      throw new Error('ERROR - Invalid figure type in record: ' + record.type);
    }
    figure = new generator(parent, areas[record.bonds[0]], gridParent, record.drawScope, record.drawAlign, record.gridSpace, record.gridOrder);
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
    scopes, aligns, orders,
    Rectangle, Circle, Hex,
    createFromRecord
  };

})(); /* BIT Grid Area Definition */
