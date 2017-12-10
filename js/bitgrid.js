/**
 * Boardgame image tool (BIT) Grid Area Definition
 * Copyright 2017 Herve Retaureau
 */

var bitgrid = (function() {
  'use strict';

  const types = {
    GRIDRECTANGLE : 'gridRectangle'
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

  /*
   * FIGUREGRID 
   */

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

  class FigureGrid {

    constructor(parent, pattern) {
      if (this.constructor == FigureGrid.constructor) {
        throw new Error('Invalid Figure grid constructor call: abstract class');
      }
      this.pattern = pattern;
      this.elts = [];
      this.group = document.createElementNS(bitarea.NSSVG, 'g');
      this.parent = parent;
      this.parent.appendChild(this.group);
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
      this.parent = this.group = null;
    }

    draw(coords) {
      console.log('draw() not defined');
    }

  }

  /*
   * RECTANGLE GRID 
   */

  class RectangleGrid extends FigureGrid{

    constructor(parent, pattern) {
      super(parent, pattern);
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

    draw(coords, patternCoords) {

      var computeGridProperties = function(coords, patternProps) {

        var index = (g, p, fdim, fov) => Math.ceil((g-p)/(fdim+fov));
        var start = (p, i, fdim, fov) => p + i*(fdim+fov);
        var extra = (p, fdim, fov) => p - (fdim+fov);
        var count = (g, dim, s, fdim, fov) => Math.floor(((g + dim - (s + fdim)) / (fdim + fov)) + 1);

        let tmp, props = {};
        tmp = index(coords.x, patternProps.start.x, patternProps.area.width, patternProps.raw.overlap);
        props.xs = start(patternProps.start.x, tmp, patternProps.area.width, patternProps.raw.overlap);
        [props.ts1, props.ts2] = (tmp%2 === 0) ? [patternProps.start.tilt, patternProps.raw.tilt] : [patternProps.raw.tilt, patternProps.start.tilt];
        props.xx = props.xs + patternProps.column.offset;
        props.tx1 = props.ts1;
        props.tx2 = props.ts2;
        tmp = extra(props.xx, patternProps.area.width, patternProps.raw.overlap);
        if (tmp >= coords.x) {
          props.xx = tmp;
          props.tx1 = props.ts2;
          props.tx2 = props.ts1;
        }

        tmp = index(coords.y, patternProps.start.y, patternProps.area.height, patternProps.column.overlap);
        props.ys = start(patternProps.start.y, tmp, patternProps.area.height, patternProps.column.overlap);
        props.is = Math.abs(tmp % 2);
        props.ix = Math.abs((tmp + 1) % 2);

        props.nx = count(coords.x, coords.width, props.xs, patternProps.area.width, patternProps.raw.overlap);
        props.nxx = count(coords.x, coords.width, props.xx, patternProps.area.width, patternProps.raw.overlap);
        props.ny = count(coords.y, coords.height, props.ys, patternProps.area.height, patternProps.column.overlap);
        return props;
      }

      var computeGridPropertiesEx = function(coords, patternProps) {
        let gp, pp;
        pp = Object.create(patternProps);
        pp.raw = Object.create(patternProps.raw);
        if (pp.column.overlap !== 0) {
          throw new Error('column.overlap = ' + pp.column.overlap + ' => Unsupported figure properties for griding!');
        }
        pp.raw.overlap = 0;
        pp.raw.tilt = pp.start.tilt;
        gp = computeGridProperties(coords, pp);
        if (gp.nx !== gp.nxx || gp.xs !== gp.xx) {
          throw new Error('Error when computing figure overlap by full width! => xs: ' + gp.xs + ' xx: ' + gp.xx + 'nx: ' + gp.nx + ' nxx: ' + gp.nxx);
        }
        gp.nx *= 2;
        gp.ts2 = patternProps.raw.tilt;
        pp.raw = null; pp = null;
        return gp;
      }

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

  }

  class Rectangle extends bitarea.Rectangle {
    
    constructor(parent, bond, gridParent) {
      super(parent, false);
      this.bindTo(bond);
      this.type = types.GRIDRECTANGLE;
      this.isGrid = true;
      this.grid = new RectangleGrid(gridParent, bond);
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

  return {
    Rectangle
  };

})(); /* BIT Grid Area Definition */
