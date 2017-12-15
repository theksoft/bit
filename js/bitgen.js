/**
 * Boardgame image tool (BIT) Area Generators
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

    constructor(parent, noGroup, alt) {
      super();
      this.org = { x : 0, y : 0 };
      this.figure = null;
      this.createFigure(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Rectangle(parent, noGroup);
    }

    start(point) {
      let coords = this.figure.getCoords();
      this.org.x = coords.x = point.x;
      this.org.y = coords.y = point.y;
      this.figure.setCoords(coords);
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

    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Square(parent, noGroup);
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

    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
      this.tracker = new Tracker(parent);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Rhombus(parent, noGroup);
    }

    start(point) {
      super.start(point);
      this.tracker.start(point);
    }

    progress(point) {
      super.progress(point);
      if (this.tracker) {
        this.tracker.progress(point);
      }
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

  /*
   * CIRCLE (from CENTER) GENERATOR
   */

  class Circle extends Figure {

    constructor(parent, noGroup, alt) {
      super();
      this.org = { x : 0, y : 0 };
      this.figure = null;
      this.createFigure(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Circle(parent, noGroup);
    }

    start(point) {
      let coords = this.figure.getCoords();
      this.org.x = coords.x = point.x;
      this.org.y = coords.y = point.y;
      this.figure.setCoords(coords);
      this.figure.redraw();
    }

    progress(point) {
      this.figure.redraw(this.computeCoords(point));
    }

    end(point) {
      let coords = this.computeCoords(point);
      if (0 >= coords.r) {
        this.cancel();
        return 'error';
      }

      this.figure.setCoords(coords);
      this.figure.redraw();
      return 'done';
    }

    computeCoords(point) {
      let dx = point.x - this.org.x,
          dy = point.y - this.org.y; 
      return {
        x : this.org.x,
        y : this.org.y,
        r : Math.round(Math.sqrt(dx*dx + dy*dy))
      };
    }

  } // CIRCLE (from CENTER) GENERATOR

  /*
   * CIRCLE (from DIAMETER) GENERATOR
   */

  class CircleEx extends Circle {

    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.CircleEx(parent, noGroup);
    }

    computeCoords(point) {
      let dx = point.x - this.org.x,
          dy = point.y - this.org.y; 
      return {
        x : this.org.x + Math.round(dx/2),
        y : this.org.y + Math.round(dy/2),
        r : Math.round(Math.sqrt(dx*dx + dy*dy)/2)
      };
    }

  } // CIRCLE (from DIAMETER) GENERATOR

  /*
   * ELLIPSE GENERATOR
   */

  class Ellipse extends Rectangle {
    
    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
      this.tracker = new Tracker(parent);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Ellipse(parent, noGroup);
    }

    start(point) {
      super.start(point);
      this.tracker.start(point);
    }

    progress(point) {
      super.progress(point);
      if (this.tracker) {
        this.tracker.progress(point);
      }
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

  } // ELLIPSE GENERATOR

  /*
   * ISOSCELES TRIANGLE GENERATOR
   */

  class IsoscelesTriangle extends Rectangle {
    
    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
      this.tracker = new Tracker(parent);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.IsoscelesTriangle(parent, noGroup, (alt) ? bitarea.tilts.LEFT : bitarea.tilts.DEFAULT);
    }

    computeCoords(point) {
      let coords = super.computeCoords(point);
      switch(coords.tilt) {
      case bitarea.tilts.TOP:
      case bitarea.tilts.BOTTOM:
        coords.tilt = (point.y < this.org.y) ? bitarea.tilts.BOTTOM : bitarea.tilts.TOP;
        break;
      case bitarea.tilts.LEFT:
      case bitarea.tilts.RIGHT:
        coords.tilt = (point.x < this.org.x) ? bitarea.tilts.RIGHT : bitarea.tilts.LEFT;
        break;
      }
      return coords;
    }

    start(point) {
      super.start(point);
      this.tracker.start(point);
    }

    progress(point) {
      super.progress(point);
      if (this.tracker) {
        this.tracker.progress(point);
      }
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

  } // ISOSCELES TRIANGLE GENERATOR

  /*
   * EQUILATERAL TRIANGLE GENERATOR
   */

  class EquilateralTriangle extends IsoscelesTriangle {
    
    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.EquilateralTriangle(parent, noGroup, (alt) ? bitarea.tilts.LEFT : bitarea.tilts.DEFAULT);
    }

    computeCoords(point) {
      let coords = super.computeCoords(point);
      let r = Math.sqrt(3) / 2;
      let delta = 0;
      switch(coords.tilt) {
      case bitarea.tilts.LEFT:
      case bitarea.tilts.RIGHT:
        delta = Math.round(coords.width - r * coords.height);
        if (delta > 0) {
          coords.width = Math.round(r * coords.height);
          if (point.x < this.org.x) {
            coords.x = this.org.x - coords.width;
          }
        } else if (delta < 0) {
          coords.height = Math.round(coords.width / r);
          if (point.y < this.org.y) {
            coords.y = this.org.y - coords.height;
          }
        }
        break;
      case bitarea.tilts.TOP:
      case bitarea.tilts.BOTTOM:
        delta = Math.round(coords.height - r * coords.width);
        if (delta > 0) {
          coords.height = Math.round(r * coords.width);
          if (point.y < this.org.y) {
            coords.y = this.org.y - coords.height;
          }
        } else if (delta < 0) {
          coords.width = Math.round(coords.height / r);
          if (point.x < this.org.x) {
            coords.x = this.org.x - coords.width;
          }
        }
        break;
      default:
      }
      return coords;
    }

  } // EQUILATERAL TRIANGLE GENERATOR

  /*
   * RECTANGLE TRIANGLE GENERATOR
   */

  class RectangleTriangle extends IsoscelesTriangle {
    
    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.RectangleTriangle(parent, noGroup, (alt) ? bitarea.tilts.LEFT : bitarea.tilts.DEFAULT);
    }

    computeCoords(point) {
      let coords = super.computeCoords(point);
      if (point.x <= this.org.x && point.y <= this.org.y) {
        coords.tilt = bitarea.tilts.RIGHT;
      } else if (point.x <= this.org.x && point.y > this.org.y) {
        coords.tilt = bitarea.tilts.BOTTOM;
      } else if (point.x > this.org.x && point.y <= this.org.y) {
        coords.tilt = bitarea.tilts.TOP;
      } else {
        coords.tilt = bitarea.tilts.LEFT;
      }
      return coords;
    }

  } // RECTANGLE TRIANGLE GENERATOR

  /*
   * HEX (from RECTANGLE) GENERATOR
   */

  class Hex extends Rectangle {
    
    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
      this.tracker = new Tracker(parent);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Hex(parent, noGroup);
    }

    computeCoords(point) {
      const r = Math.sqrt(3)/2;
      let coords = super.computeCoords(point);
      let w = coords.width, h = coords.height, dw = 0, dh = 0;
      if (w >= h) {
        if (w > h/r) { w = Math.round(h/r); } else { h = Math.round(w*r); }
      } else {
        if (h > w/r) { h = Math.round(w/r); } else { w = Math.round(h*r); }
      }
      dw = coords.width - w; 
      dh = coords.height - h;
      coords.width = w;
      coords.height = h;
      if (point.x < this.org.x) { coords.x += dw; }
      if (point.y < this.org.y) { coords.y += dh; }
      return coords;
    }

    start(point) {
      super.start(point);
      this.tracker.start(point);
    }

    progress(point) {
      super.progress(point);
      if (this.tracker) {
        this.tracker.progress(point);
      }
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

  } // HEX (from RECTANGLE) GENERATOR

  /*
   * HEX (from DIAMETER) GENERATOR
   */

  class HexEx extends Rectangle {
    
    constructor(parent, noGroup, alt) {
      super(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.HexEx(parent, noGroup);
    }

    computeCoords(point, wmax, hmax) {

      const tan60 = Math.tan(Math.PI/3);
      const tan30 = Math.tan(Math.PI/6);
      const L1 = tan30 / 2;
      const L2 = tan30 + (tan60 - tan30) / 2;
      const L3 = Math.tan(70/180 * Math.PI);

      const F = Math.sqrt(3);
      const R = F/2;

      function coordsTiltNorm(dx, dy, r) {
        let dxx = Math.abs(dx), dyy = Math.abs(dy);
        dxx = Math.min(dxx, Math.round(dyy/r));
        dyy = Math.round(dxx*r);
        return [(dx > 0) ? dxx : -dxx, (dy > 0) ? dyy : -dyy ]
      }

      function coordsTiltCeil(ss, ds, db, sm) {
        let dbb = 0;
        if (ds >= 0) { dbb = Math.round(Math.min(Math.abs(db), 4*R*ss, (sm-ss)/R)); }
        else         { dbb = Math.round(Math.min(Math.abs(db), ss/R, (sm-ss)*4*R)); }
        let dss = Math.round(dbb/F);
        dbb = Math.round(dbb);
        return [(ds > 0) ? dss : -dss, (db > 0) ? dbb : -dbb];
      }

      function coordsOrthCeil(ds, bs, bm) {
        let dss = Math.min(Math.abs(ds), 2*bs/R, 2*bm/R)
        return (ds > 0) ? dss : -dss;
      }

      function fixTilt(xs, ys, xp, yp, wmax, hmax) {
        let dx = 0, dy = yp - ys, type = 0;
        if (Math.round(xp - xs) !== 0) {
          dx = xp - xs;
          dy = yp - ys;
          let tan = dy / dx;
          if (tan > L3)       { dx = 0; dy = coordsOrthCeil(dy, xs, wmax); }
          else if (tan > L2)  { type = 1; [dx, dy] = coordsTiltNorm(dx, dy, tan60); [dx, dy] = coordsTiltCeil(xs, dx, dy, wmax); }
          else if (tan > L1)  { type = 2; [dx, dy] = coordsTiltNorm(dx, dy, tan30); [dy, dx] = coordsTiltCeil(ys, dy, dx, hmax); }
          else if (tan > -L1) { type = 3; dy = 0; dx = coordsOrthCeil(dx, ys, hmax); }
          else if (tan > -L2) { type = 4; [dx, dy] = coordsTiltNorm(dx, dy, tan30); [dy, dx] = coordsTiltCeil(ys, dy, dx, hmax); }
          else if (tan > -L3) { type = 5; [dx, dy] = coordsTiltNorm(dx, dy, tan60); [dx, dy] = coordsTiltCeil(xs, dx, dy, wmax); }
          else                { dx = 0; dy = coordsOrthCeil(dy, xs, wmax); }
        } else {
          dy = coordsOrthCeil(dy, ys, hmax);
        }
        return [ dx, dy, type ];
      }

      function computeCoordsOrth(s, b, ds, db) {
        let ls = Math.abs(ds), lb = ls*R;
        return [(ds > 0) ? s : s+ds, b - Math.round(lb/2), ls, Math.round(lb)];
      }

      function computeCoordsTilt(s, b, ds, db) {
        let lb = Math.abs(db), ls = lb/R;
        return [(ds > 0) ? s - Math.round(ls/4) : s - Math.round(3*ls/4), (db > 0) ? b : b+db, Math.round(ls), lb];
      }

      let dx = 0, dy = 0, type = 0;
      let coords = Object.create(this.figure.coords);
      [dx, dy, type] = fixTilt(this.org.x, this.org.y, point.x, point.y, wmax, hmax);
      switch(type) {
      case 0:
        [coords.y, coords.x, coords.height, coords.width] = computeCoordsOrth(this.org.y, this.org.x, dy, dx);
        break;
      case 1:
      case 5:
        [coords.x, coords.y, coords.width, coords.height] = computeCoordsTilt(this.org.x, this.org.y, dx, dy);
        break;
      case 2:
      case 4:
        [coords.y, coords.x, coords.height, coords.width] = computeCoordsTilt(this.org.y, this.org.x, dy, dx);
        break;
      case 3:
        [coords.x, coords.y, coords.width, coords.height] = computeCoordsOrth(this.org.x, this.org.y, dx, dy);
        break;
      default:
      }
      return coords;
    }

    progress(point, wmax, hmax) {
      this.figure.redraw(this.computeCoords(point, wmax, hmax));
    }

    end(point, wmax, hmax) {
      let coords = this.computeCoords(point, wmax, hmax);
      if (0 == coords.width || 0 == coords.height) {
        this.cancel();
        return 'error';
      }

      this.figure.setCoords(coords);
      this.figure.redraw();
      return 'done';
    }

  } // HEX (from DIAMETER) GENERATOR

  /*
   * POLYGON GENERATOR
   */

  class Polygon extends Figure {
    
    constructor(parent, noGroup, alt) {
      super();
      this.org = { x : 0, y : 0 };
      this.closeGap = 3;
      this.context = { 'parent' : parent, 'noGroup' : noGroup };
      this.figure = null;
      this.createFigure(parent, noGroup, alt);
    }

    createFigure(parent, noGroup, alt) {
      this.figure = new bitarea.Polyline(parent, noGroup);
    }

    closure(point) {
      let d = point.x - this.org.x;
      if (d < -this.closeGap || d > this.closeGap) {
        return false;
      }
      d = point.y - this.org.y;
      if (d < -this.closeGap || d > this.closeGap) {
        return false;
      }
      return true;
    }

    start(point) {
      let coords = this.figure.getCoords();
      coords[0].x = this.org.x = point.x;
      coords[0].y = this.org.y = point.y;
      coords.push({ x : point.x, y : point.y });
      this.figure.setCoords(coords);
      this.figure.redraw();
    }

    progress(point) {
      this.figure.redraw(this.computeCoords(point));
    }

    end(point) {
      let coords = this.computeCoords(point);
      if (this.closure(point)) {
        coords.pop();
        if (3 > coords.length) {
          this.cancel();
          return 'error';
        }
        this.cancel();
        this.figure = new bitarea.Polygon(this.context.parent, this.context.noGroup);
        this.figure.setCoords(coords);
        this.figure.redraw();
        return 'done';
      }
      coords.push({ x : point.x, y : point.y });
      this.figure.setCoords(coords);
      return 'continue';
    }

    computeCoords(point) {
      let coords = this.figure.copyCoords(this.figure.coords);
      let last = coords.length - 1;
      coords[last].x = point.x;
      coords[last].y = point.y;
      return coords;
    }

  } // POLYGON GENERATOR

  /*
   * GRID RECTANGLE 
   */

  class GridRectangle extends Rectangle {
    
    constructor(parent, bond, gridParent, scope) {
      super(parent, false, false);
      this.createFigure(parent, bond, gridParent, scope);
    }

    createFigure(parent, bond, gridParent, scope) {
      if (bond) {
        this.figure = new bitgrid.Rectangle(parent, bond, gridParent, scope);
      }
    }

  } // GRID RECTANGLE

  /*
   * GRID CIRCLE 
   */

  class GridCircle extends CircleEx {
    
    constructor(parent, bond, gridParent, scope) {
      super(parent, false, false);
      this.createFigure(parent, bond, gridParent, scope);
    }

    createFigure(parent, bond, gridParent, scope) {
      if (bond) {
        this.figure = new bitgrid.Circle(parent, bond, gridParent, scope);
      }
    }

  } // GRID CIRCLE

  /*
   * GRID HEX 
   */

  class GridHex extends HexEx {
    
    constructor(parent, bond, gridParent, scope) {
      super(parent, false, false);
      this.createFigure(parent, bond, gridParent, scope);
    }

    createFigure(parent, bond, gridParent, scope) {
      if (bond) {
        this.figure = new bitgrid.Hex(parent, bond, gridParent, scope);
      }
    }

  } // GRID HEX

  return {
    Rectangle, Square, Rhombus,
    Circle, CircleEx, Ellipse,
    IsoscelesTriangle, EquilateralTriangle, RectangleTriangle,
    Hex, HexEx, Polygon,
    GridRectangle, GridCircle, GridHex,
    Tracker
  }

})(); /* BIT Area Generators */
