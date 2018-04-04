/**
 * Boardgame image tool (BIT) Area Editors
 * Copyright 2017 Herve Retaureau
 */

var bitedit = (function() {
  'use strict';

  const NSSVG = 'http://www.w3.org/2000/svg';

  const clsStatus = {
    DISABLED      : 'disabled',
    SELECTED      : 'selected',
    HIGHLIGHTED   : 'highlighted'
  };

  const clsQualifiers = {
    GRIP          : 'grip'  
  };

  const cursors = {
    EW            : 'ew-resize',
    NS            : 'ns-resize',
    NWSE          : 'nwse-resize',
    NESW          : 'nesw-resize',
    ALL           : 'move'
  };

  const directions = {
    RCLK          : 'clockwise',
    RACLK         : 'anti-clockwise'
  };

  // EDITION GRIP

  var isGrip = (dom) => dom.classList.contains(clsQualifiers.GRIP) ? true : false;

  class Grip extends bitarea.Rectangle {
    
    constructor(id, group, center, cursor) {
      super(group, true);
      this._id = id;
      this._cursor = cursor;
      this.addClass(this.className);
      this._coords.x = center.x + this.lims.offset;
      this._coords.y = center.y + this.lims.offset;
      this._coords.width = this.lims.size;
      this._coords.height = this.lims.size;
      this.disable();
      this.draw();
    }

    reposition(center) {
      this._coords.x = center.x + this.lims.offset;
      this._coords.y = center.y + this.lims.offset;
      this.draw();
    }

    get id() {
      return this._id;
    }

    set id(id) {
      this._id = id;
    }

    is(dom) {
      return (dom === this._dom) ? true : false;
    }

    enable() {
      this.removeClass(clsStatus.DISABLED);
      this.addClass(this._cursor);
    }

    disable() {
      this.removeClass(this._cursor);
      this.addClass(clsStatus.DISABLED);
    }

    set cursor(cursor) {
      if (this.hasClass(this._cursor)) {
        this.removeClass(this._cursor);
        this.addClass(cursor);
      }
      this._cursor = cursor;
    }

    get className() {
      return clsQualifiers.GRIP;
    }

    get lims() {
      const sz = 5;
      return {
        size : sz,
        offset : -Math.ceil(sz/2)
      };
    }

  } // GRIP

  /*
   * FIGURE EDITOR
   */

  class Figure {

    constructor(figure) {
      if (this.constructor == Figure.constructor) {
        throw new Error('Invalid Figure generator constructor call: abstract class');
      }
      this._figure = figure;
      this._grips = [];
      this.createGrips();
      this._enabled = false;
    }

    is(figure) {
      return (figure === this._figure) ? true : false;
    }

    markSelected() {
      if (this._figure) {
        this._figure.addClass(clsStatus.SELECTED);
        this._figure.bonds.forEach(e => e.addClass(clsStatus.HIGHLIGHTED));
      }
    }

    markUnselected() {
      if (this._figure) {
        this._figure.removeClass(clsStatus.SELECTED);
        this._figure.bonds.forEach(e => e.removeClass(clsStatus.HIGHLIGHTED));
      }
    }

    remove() {
      this.destroyGrips();
      this._figure = this._grips = null;
    }

    isEditable(grip) {
      if (!this._enabled) return false;
      if (!isGrip(grip)) return false;
      return (this.getGrip(grip) ? true : false);
    }

    enableEdition() {
      if(!this._enabled) {
        this._grips.forEach(e => e.enable());
        this._enabled = true;
      }
    }

    disableEdition() {
      if (this._enabled) {
        this._grips.forEach(e => e.disable());
        this._enabled = false;
      }
    }

    get figure() {
      return this._figure;
    }

    // MOVE SECTION

    computeMoveDLims(wmax, hmax) {
      console.log('computeMoveDLims() not defined - ' + wmax + 'x' + hmax);
      return { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 };
    }

    computeMoveCoords(dx, dy) {
      console.log('computeMoveCoords() not defined');
      return this._figure.coords;
    }

    drawToOffset(dx, dy) {
      let coords = this.computeMoveCoords(dx, dy);
      this._figure.redraw(coords);
      this.repositionGrips(coords);
    }

    moveToOffset(dx, dy) {
      let coords = this.computeMoveCoords(dx, dy);
      this._figure.coords = coords;
      this._figure.redraw();
      this.repositionGrips(coords);
    }

    // ROTATE SECTION

    computeRotateCoords(direction, wmax, hmax) {
      console.log('computeRotateCoords() not defined');
      return this._figure.coords;
    }

    rotateGrips(direction) {
      console.log('rotateGrips() not defined');
    }

    rotate(direction, wmax, hmax) {
      let coords = this.computeRotateCoords(direction, wmax, hmax);
      if (null != coords) {
        this._figure.coords = coords;
        this.rotateGrips(direction);
        this._figure.redraw();
        this.repositionGrips();
        this.enableEdition();
        return true;
      }
      return false;
    }

    // GRIPS SECTION

    createGrips() {
      console.log('createGrips() not defined');
    }

    destroyGrips() {
      this._grips.forEach(e => e.remove());
      this._grips.splice(0, this._grips.length);
    }

    getGrip(dom) {
      return this._grips.find(e => e.is(dom));
    }

    gripCoords(id, coords) {
      console.log('gripCoords() not defined');
      return (coords || this._figure.coords);
    }

    gripCursor(id) {
      return cursors.ALL;
    }

    repositionGrips(coords) {
      let c = coords || this._figure.coords;
      this._grips.forEach(e => e.reposition(this.gripCoords(e.id, c)));
    }

    // EDIT SECTION

    computeEditDLims(grip, wmax, hmax) {
      console.log('computeEditDLims() not defined - ' + wmax + 'x' + hmax + ' for ' + grip);
      return { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 };
    }

    static checkCoords(coords) {
      console.log('checkCoords() not defined');
      return false;
    }

    drawModified(id, dx, dy) {
      let coords = this.computeEditCoords(id, dx, dy);
      this._figure.redraw(coords);
      this.repositionGrips(coords);
    }

    modify(id, dx, dy) {
      let coords = this.computeEditCoords(id, dx, dy);
      if (this.checkCoords(coords)) {
        this._figure.coords = coords;
        this._figure.redraw();
        this.repositionGrips(coords);
        return true;
      }
      this._figure.redraw();
      this.repositionGrips();
      return false;
    }

  }

  /*
   * RECTANGLE EDITOR
   */

  var fRectangle = (function() {
    
    // GRIP POSITIONS

    function tPos(coords)   { return { x : Math.round(coords.x + coords.width/2), y : coords.y }; }
    function bPos(coords)   { return { x : Math.round(coords.x + coords.width/2), y : coords.y + coords.height }; }
    function lPos(coords)   { return { x : coords.x, y : Math.round(coords.y + coords.height/2) }; }
    function rPos(coords)   { return { x : coords.x + coords.width, y : Math.round(coords.y + coords.height/2) }; }
    function tlPos(coords)  { return { x : coords.x, y : coords.y }; }
    function trPos(coords)  { return { x : coords.x + coords.width, y : coords.y }; }
    function blPos(coords)  { return { x : coords.x, y : coords.y + coords.height }; }
    function brPos(coords)  { return { x : coords.x + coords.width, y : coords.y + coords.height }; }

    // GRIP CONSTRAINTS

    function leftCns(coords, wmax)    { return [ -coords.x, coords.width ]; }
    function rightCns(coords, wmax)   { return [ -coords.width, wmax - (coords.x + coords.width) ]; }
    function topCns(coords, hmax)     { return [ -coords.y, coords.height ]; }
    function bottomCns(coords, hmax)  { return [ -coords.height,  hmax - (coords.y + coords.height) ]; }
    function editCns(coords, wmax, hmax, fx, fy) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 };
      if (fx) [rtn.dxmin, rtn.dxmax] = fx(coords, wmax);
      if (fy) [rtn.dymin, rtn.dymax] = fy(coords, hmax);
      return rtn;
    }

    function tEditCns(obj, wmax, hmax)  { return editCns(obj.coords, wmax, hmax, null, topCns); }
    function bEditCns(obj, wmax, hmax)  { return editCns(obj.coords, wmax, hmax, null, bottomCns); }
    function lEditCns(obj, wmax, hmax)  { return editCns(obj.coords, wmax, hmax, leftCns, null); }
    function rEditCns(obj, wmax, hmax)  { return editCns(obj.coords, wmax, hmax, rightCns, null); }
    function tlEditCns(obj, wmax, hmax) { return editCns(obj.coords, wmax, hmax, leftCns, topCns); }
    function trEditCns(obj, wmax, hmax) { return editCns(obj.coords, wmax, hmax, rightCns, topCns); }
    function blEditCns(obj, wmax, hmax) { return editCns(obj.coords, wmax, hmax, leftCns, bottomCns); }
    function brEditCns(obj, wmax, hmax) { return editCns(obj.coords, wmax, hmax, rightCns, bottomCns); }

    // GRIP EDITIONS

    function leftEdit(coords, dx)   { coords.x += dx; coords.width -= dx; }
    function rightEdit(coords, dx)  { coords.width += dx; }
    function topEdit(coords, dy)    { coords.y += dy; coords.height -= dy; }
    function bottomEdit(coords, dy) { coords.height += dy; }
    function edit(obj, dx, dy, fx, fy) {
      let coords = obj.coords;
      if (fx) fx(coords, dx);
      if (fy) fy(coords, dy);
      return coords;
    }

    function tEdit(obj, dx, dy)   { return edit(obj, dx, dy, null, topEdit); }
    function bEdit(obj, dx, dy)   { return edit(obj, dx, dy, null, bottomEdit); }
    function lEdit(obj, dx, dy)   { return edit(obj, dx, dy, leftEdit, null); }
    function rEdit(obj, dx, dy)   { return edit(obj, dx, dy, rightEdit, null); }
    function tlEdit(obj, dx, dy)  { return edit(obj, dx, dy, leftEdit, topEdit); }
    function trEdit(obj, dx, dy)  { return edit(obj, dx, dy, rightEdit, topEdit); }
    function blEdit(obj, dx, dy)  { return edit(obj, dx, dy, leftEdit, bottomEdit); }
    function brEdit(obj, dx, dy)  { return edit(obj, dx, dy, rightEdit, bottomEdit); }

    return {
      tPos, bPos, lPos, rPos, tlPos, trPos, blPos, brPos,
      tEditCns, bEditCns, lEditCns, rEditCns, tlEditCns, trEditCns, blEditCns, brEditCns,
      tEdit, bEdit, lEdit, rEdit, tlEdit, trEdit, blEdit, brEdit
    };
    
  })(); // fRectangle

  class Rectangle extends Figure {

    constructor(figure) {
      super(figure);
    }

    computeMoveDLims(wmax, hmax) {
      let c = this._figure.coords;
      return {
        dxmin : -c.x,
        dxmax : wmax - (c.x + c.width),
        dymin : -c.y,
        dymax : hmax - (c.y + c.height)
      };
    }


    computeMoveCoords(dx, dy) {
      let rtn = this._figure.copyCoords();
      rtn.x += dx;
      rtn.y += dy;
      return rtn;
    }

    computeRotateCoords(direction, wmax, hmax) {
      let rtn = this._figure.copyCoords();
      let w2 = Math.round(rtn.width / 2), h2 = Math.round(rtn.height / 2)
      rtn.x += w2 - h2;
      rtn.y += h2 - w2;
      let tmp = rtn.width;
      rtn.width = rtn.height;
      rtn.height = tmp;
      if (rtn.x >= 0 && rtn.x + rtn.width <= wmax &&
          rtn.y >= 0 && rtn.y + rtn.height <= hmax) {
        return rtn;
      }
      return null;
    }

    gripCoords(id, coords) {
      const gripPosition = {
        't' : fRectangle.tPos, 'b' : fRectangle.bPos, 'l' : fRectangle.lPos, 'r' : fRectangle.rPos,  
        'tl' : fRectangle.tlPos, 'tr' : fRectangle.trPos, 'bl' : fRectangle.blPos, 'br' : fRectangle.brPos
      };
      return gripPosition[id](coords || this._figure.coords);
    }

    gripCursor(id) {
      const gripCursors = {
        't' : cursors.NS, 'b' : cursors.NS, 'l' : cursors.EW, 'r' : cursors.EW,  
        'tl' : cursors.NWSE, 'tr' : cursors.NESW, 'bl' : cursors.NESW, 'br' : cursors.NWSE
      };
      return gripCursors[id] || super.gripCursor(id);
    }

    createGrips() {
      this._grips.push(new Grip('t', this._figure.domParent, this.gripCoords('t'), this.gripCursor('t')));
      this._grips.push(new Grip('b', this._figure.domParent, this.gripCoords('b'), this.gripCursor('b')));
      this._grips.push(new Grip('l', this._figure.domParent, this.gripCoords('l'), this.gripCursor('l')));
      this._grips.push(new Grip('r', this._figure.domParent, this.gripCoords('r'), this.gripCursor('r')));
      this._grips.push(new Grip('tl', this._figure.domParent, this.gripCoords('tl'), this.gripCursor('tl')));
      this._grips.push(new Grip('tr', this._figure.domParent, this.gripCoords('tr'), this.gripCursor('tr')));
      this._grips.push(new Grip('bl', this._figure.domParent, this.gripCoords('bl'), this.gripCursor('bl')));
      this._grips.push(new Grip('br', this._figure.domParent, this.gripCoords('br'), this.gripCursor('br')));
    }

    computeEditDLims(id, wmax, hmax) {
      const constraints = {
        't' : fRectangle.tEditCns, 'b' : fRectangle.bEditCns, 'l' : fRectangle.lEditCns, 'r' : fRectangle.rEditCns,  
        'tl' : fRectangle.tlEditCns, 'tr' : fRectangle.trEditCns, 'bl' : fRectangle.blEditCns, 'br' : fRectangle.brEditCns
      };
      return constraints[id](this._figure, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        't' : fRectangle.tEdit, 'b' : fRectangle.bEdit, 'l' : fRectangle.lEdit, 'r' : fRectangle.rEdit,  
        'tl' : fRectangle.tlEdit, 'tr' : fRectangle.trEdit, 'bl' : fRectangle.blEdit, 'br' : fRectangle.brEdit
      };
      return (this._enabled) ? editCoords[id](this._figure, dx, dy) : this._figure.coords;
    }

    checkCoords(coords) {
      return (coords.width > 0 && coords.height > 0) ? true : false;
    }

  } // RECTANGLE EDITOR

  /*
   * SQUARE EDITOR
   */

  var fSquare = (function() {

    // GRIP EDITIONS

    function tlEdit(obj, dx, dy) {
      let d = (dx > dy) ? dx : dy;
      return fRectangle.tlEdit(obj, d, d);
    }
    function trEdit(obj, dx, dy) {
      let d = (-dx > dy) ? -dx : dy;
      return fRectangle.trEdit(obj, -d, d);
    }
    function blEdit(obj, dx, dy) {
      let d = (dx > -dy) ? dx : -dy;
      return fRectangle.blEdit(obj, d, -d);
    }
    function brEdit(obj, dx, dy) {
      let d = (dx > dy) ? dy : dx;
      return fRectangle.brEdit(obj, d, d);
    }
   
    return {
      tlEdit, trEdit, blEdit, brEdit
    };

  })(); // fSquare

  class Square extends Rectangle {
    
    constructor(figure) {
      super(figure);
    }

    computeRotateCoords(direction, wmax, hmax) {
      return this._figure.copyCoords();
    }

    createGrips() {
      this._grips.push(new Grip('tl', this._figure.domParent, this.gripCoords('tl'), this.gripCursor('tl')));
      this._grips.push(new Grip('tr', this._figure.domParent, this.gripCoords('tr'), this.gripCursor('tr')));
      this._grips.push(new Grip('bl', this._figure.domParent, this.gripCoords('bl'), this.gripCursor('bl')));
      this._grips.push(new Grip('br', this._figure.domParent, this.gripCoords('br'), this.gripCursor('br')));
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        'tl' : fSquare.tlEdit, 'tr' : fSquare.trEdit, 'bl' : fSquare.blEdit, 'br' : fSquare.brEdit
      };
      return (this._enabled) ? editCoords[id](this._figure, dx, dy) : this._figure.coords;
    }

  } // SQUARE EDITOR

  /*
   * RHOMBUS EDITOR
   */

  class Rhombus extends Rectangle {
    
    constructor(figure) {
      super(figure);
    }

    createGrips() {
      this._grips.push(new Grip('l', this._figure.domParent, this.gripCoords('l'), this.gripCursor('l')));
      this._grips.push(new Grip('r', this._figure.domParent, this.gripCoords('r'), this.gripCursor('r')));
      this._grips.push(new Grip('t', this._figure.domParent, this.gripCoords('t'), this.gripCursor('t')));
      this._grips.push(new Grip('b', this._figure.domParent, this.gripCoords('b'), this.gripCursor('b')));
    }

  } // RHOMBUS EDITOR

  /*
   * CIRCLE (from CENTER) EDITOR
   */

  var fCircle = (function() {
    
    // GRIP POSITIONS
    function rPos(coords) { return { x : coords.x + coords.r, y : coords.y }; }

    // GRIP CONSTRAINTS
    function rEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dxmin : -obj.coords.r,
                dxmax : Math.min(-lims.dxmin, lims.dxmax, -lims.dymin, lims.dymax),
                dymin : 0, dymax : 0 };
    }

    // GRIP EDITIONS
    function rEdit(obj, dx, dy)   {
      let coords = obj.coords;
      coords.r += dx;
      return coords;
    }

    return {
      rPos, rEditCns, rEdit
    };
    
  })(); // fCircle

  class Circle extends Figure {

    constructor(figure) {
      super(figure);
    }

    computeMoveDLims(wmax, hmax) {
      let c = this._figure.coords;
      return {
        dxmin : -(c.x - c.r),
        dxmax : wmax - (c.x + c.r),
        dymin : -(c.y - c.r),
        dymax : hmax - (c.y + c.r)
      };
    }

    computeMoveCoords(dx, dy) {
      let rtn = this._figure.copyCoords();
      rtn.x += dx;
      rtn.y += dy;
      return rtn;
    }

    computeRotateCoords(direction, wmax, hmax) {
      return this._figure.copyCoords();
    }

    gripCoords(id, coords) {
      const gripPosition = { 'r' : fCircle.rPos };
      return gripPosition[id](coords || this._figure.coords);
    }

    gripCursor(id) {
      const gripCursors = { 'r' : cursors.EW };
      return gripCursors[id] || super.gripCursor(id);
    }

    createGrips() {
      this._grips.push(new Grip('r', this._figure.domParent, this.gripCoords('r'), this.gripCursor('r')));
    }

    computeEditDLims(id, wmax, hmax) {
      const constraints = { 'r' : fCircle.rEditCns };
      return constraints[id].bind(this)(this._figure, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = { 'r' : fCircle.rEdit };
      return (this._enabled) ? editCoords[id](this._figure, dx, dy) : this._figure.coords;
    }

    checkCoords(coords) {
      return (coords.r > 0) ? true : false;
    }

  } // CIRCLE (from CENTER)EDITOR

  /*
   * CIRCLE (from DIAMETER) EDITOR
   */

  var fCircleEx = (function() {
    
    // GRIP POSITIONS

    function lPos(coords) { return { x : coords.x - coords.r, y : coords.y }; }
    function tPos(coords) { return { x : coords.x, y : coords.y - coords.r }; }
    function bPos(coords) { return { x : coords.x, y : coords.y + coords.r }; }

    // GRIP CONSTRAINTS

    function rEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dxmin : -obj.coords.r*2,
                dxmax : Math.min(lims.dxmax, -lims.dymin*2, lims.dymax*2),
                dymin : 0, dymax : 0 };
    }
    function lEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dxmax : obj.coords.r*2,
                dxmin : -Math.min(-lims.dxmin, -lims.dymin*2, lims.dymax*2),
                dymin : 0, dymax : 0 };
    }
    function tEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dymax : obj.coords.r*2,
                dymin : -Math.min(-lims.dymin, -lims.dxmin*2, lims.dxmax*2),
                dxmin : 0, dxmax : 0 };
    }
    function bEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dymin : -obj.coords.r*2,
                dymax : Math.min(lims.dymax, -lims.dxmin*2, lims.dxmax*2),
                dxmin : 0, dxmax : 0 };
    }

    // GRIP EDITIONS

    function rEdit(obj, dx, dy)   {
      let coords = obj.coords;
      let dxx = Math.round(dx/2);
      coords.x += dxx;
      coords.r += dxx;
      return coords;
    }

    function lEdit(obj, dx, dy)   {
      let coords = obj.coords;
      let dxx = Math.round(dx/2);
      coords.x += dxx;
      coords.r -= dxx;
      return coords;
    }

    function tEdit(obj, dx, dy)   {
      let coords = obj.coords;
      let dyy = Math.round(dy/2);
      coords.y += dyy;
      coords.r -= dyy;
      return coords;
    }

    function bEdit(obj, dx, dy)   {
      let coords = obj.coords;
      let dyy = Math.round(dy/2);
      coords.y += dyy;
      coords.r += dyy;
      return coords;
    }

    return {
      lPos, tPos, bPos,
      rEditCns, lEditCns, tEditCns, bEditCns,
      rEdit, lEdit, tEdit, bEdit
    };
    
  })(); // fCircleEx

  class CircleEx extends Circle {

    constructor(figure) {
      super(figure);
    }

    gripCoords(id, coords) {
      const gripPosition = { 'l' : fCircleEx.lPos, 't' : fCircleEx.tPos, 'b' : fCircleEx.bPos };
      let f = gripPosition[id];
      return (f) ? f(coords || this._figure.coords) : super.gripCoords(id, coords);
    }

    gripCursor(id) {
      const gripCursors = { 'l' : cursors.EW, 't' : cursors.NS, 'b' : cursors.NS };
      return gripCursors[id] || super.gripCursor(id);
    }

    createGrips() {
      this._grips.push(new Grip('r', this._figure.domParent, this.gripCoords('r'), this.gripCursor('r')));
      this._grips.push(new Grip('l', this._figure.domParent, this.gripCoords('l'), this.gripCursor('l')));
      this._grips.push(new Grip('t', this._figure.domParent, this.gripCoords('t'), this.gripCursor('t')));
      this._grips.push(new Grip('b', this._figure.domParent, this.gripCoords('b'), this.gripCursor('b')));
    }

    computeEditDLims(id, wmax, hmax) {
      const constraints = {
        'r' : fCircleEx.rEditCns, 'l' : fCircleEx.lEditCns,
        't' : fCircleEx.tEditCns, 'b' : fCircleEx.bEditCns
      };
      let f = constraints[id];
      return (f) ? f.bind(this)(this._figure, wmax, hmax) : super.computeEditDLims(id, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        'r' : fCircleEx.rEdit, 'l' : fCircleEx.lEdit,
        't' : fCircleEx.tEdit, 'b' : fCircleEx.bEdit
      };
      if (!this._enabled) {
        return this._figure.coords;
      }
      let f = editCoords[id];
      return (f) ? f(this._figure, dx, dy) : super.computeEditCoords(id, dx, dy);
    }

  } // CIRCLE (from DIAMETER) EDITOR

  /*
   * ELLIPSE EDITOR
   */

  class Ellipse extends Rectangle {
    
    constructor(figure) {
      super(figure);
    }

    createGrips() {
      this._grips.push(new Grip('t', this._figure.domParent, this.gripCoords('t'), this.gripCursor('t')));
      this._grips.push(new Grip('b', this._figure.domParent, this.gripCoords('b'), this.gripCursor('b')));
      this._grips.push(new Grip('l', this._figure.domParent, this.gripCoords('l'), this.gripCursor('l')));
      this._grips.push(new Grip('r', this._figure.domParent, this.gripCoords('r'), this.gripCursor('r')));
    }

  } // ELLIPSE EDITOR

  /*
   * ISOSCELES TRIANGLE EDITOR
   */

  var fIsoscelesTriangle = (function() {

    // GRIP CONSTRAINTS

    function leftCns(lr, coords, lims)    { lr.dxmin = -Math.min(-lims.dxmin, lims.dxmax);  lr.dxmax = Math.round(coords.width/2); };
    function rightCns(lr, coords, lims)   { lr.dxmin = -Math.round(coords.width/2);         lr.dxmax = Math.min(-lims.dxmin, lims.dxmax); };
    function topCns(lr, coords, lims)     { lr.dymin = -Math.min(-lims.dymin, lims.dymax);  lr.dymax = Math.round(coords.height/2); };
    function bottomCns(lr, coords, lims)  { lr.dymin = -Math.round(coords.height/2);        lr.dymax = Math.min(-lims.dymin, lims.dymax); };
    function editCns(obj, wmax, hmax, fBase, fAdjust) {
      let rtn = fBase(obj, wmax, hmax);
      let lims = this.computeMoveDLims(wmax, hmax);
      fAdjust(rtn, obj.coords, lims);
      return rtn;
    }
    
    function ttlEditCns(obj, wmax, hmax) { return editCns.bind(this)(obj, wmax, hmax, fRectangle.tlEditCns, leftCns); }
    function ttrEditCns(obj, wmax, hmax) { return editCns.bind(this)(obj, wmax, hmax, fRectangle.trEditCns, rightCns); }
    function bblEditCns(obj, wmax, hmax) { return editCns.bind(this)(obj, wmax, hmax, fRectangle.blEditCns, leftCns); }
    function bbrEditCns(obj, wmax, hmax) { return editCns.bind(this)(obj, wmax, hmax, fRectangle.brEditCns, rightCns); }
    function ltlEditCns(obj, wmax, hmax) { return editCns.bind(this)(obj, wmax, hmax, fRectangle.tlEditCns, topCns); }
    function lblEditCns(obj, wmax, hmax) { return editCns.bind(this)(obj, wmax, hmax, fRectangle.blEditCns, bottomCns); }
    function rtrEditCns(obj, wmax, hmax) { return editCns.bind(this)(obj, wmax, hmax, fRectangle.trEditCns, topCns); }
    function rbrEditCns(obj, wmax, hmax) { return editCns.bind(this)(obj, wmax, hmax, fRectangle.brEditCns, bottomCns); }

    // GRIP EDITION

    function leftAdjust(dx, dy, coords)   { coords.width -= dx; }
    function rightAdjust(dx, dy, coords)  { coords.x -= dx; coords.width += dx; }
    function topAdjust(dx, dy, coords)    { coords.height -= dy; }
    function bottomAdjust(dx, dy, coords) { coords.y -= dy; coords.height += dy; }
    function edit(obj, dx, dy, fBase, fAdjust) {
      let coords = fBase(obj, dx, dy);
      fAdjust(dx, dy, coords);
      return coords;
    }

    function ttlEdit(obj, dx, dy) { return edit(obj, dx, dy, fRectangle.tlEdit, leftAdjust); }
    function ttrEdit(obj, dx, dy) { return edit(obj, dx, dy, fRectangle.trEdit, rightAdjust); }
    function bblEdit(obj, dx, dy) { return edit(obj, dx, dy, fRectangle.blEdit, leftAdjust); }
    function bbrEdit(obj, dx, dy) { return edit(obj, dx, dy, fRectangle.brEdit, rightAdjust); }
    function ltlEdit(obj, dx, dy) { return edit(obj, dx, dy, fRectangle.tlEdit, topAdjust); }
    function lblEdit(obj, dx, dy) { return edit(obj, dx, dy, fRectangle.blEdit, bottomAdjust); }
    function rtrEdit(obj, dx, dy) { return edit(obj, dx, dy, fRectangle.trEdit, topAdjust); }
    function rbrEdit(obj, dx, dy) { return edit(obj, dx, dy, fRectangle.brEdit, bottomAdjust); }

    return {

      ttlEditCns, ttrEditCns, bblEditCns, bbrEditCns, ltlEditCns, lblEditCns, rtrEditCns, rbrEditCns,
      ttlEdit, ttrEdit, bblEdit, bbrEdit, ltlEdit, lblEdit, rtrEdit, rbrEdit      
    };

  })(); // fIsoscelesTriangle

  class IsoscelesTriangle extends Rectangle {

    constructor(figure) {
      super(figure);
    }

    computeRotateCoords(direction, wmax, hmax) {
      let rtn = super.computeRotateCoords(direction, wmax, hmax);
      if (null != rtn) {
        switch (rtn.tilt) {
        case bitarea.tilts.BOTTOM:
          rtn.tilt = (directions.RCLK === direction) ? bitarea.tilts.LEFT : bitarea.tilts.RIGHT;
          break;
        case bitarea.tilts.TOP:
          rtn.tilt = (directions.RCLK === direction) ? bitarea.tilts.RIGHT : bitarea.tilts.LEFT;
          break;
        case bitarea.tilts.LEFT:
          rtn.tilt = (directions.RCLK === direction) ? bitarea.tilts.TOP : bitarea.tilts.BOTTOM;
          break;
        case bitarea.tilts.RIGHT:
          rtn.tilt = (directions.RCLK === direction) ? bitarea.tilts.BOTTOM : bitarea.tilts.TOP;
          break;
        default:
          rtn = null;
        }
      }
      return rtn;
    }

    gripCoords(id, coords) {
      const gripPosition = {
        'bbl' : fRectangle.blPos, 'bbr' : fRectangle.brPos,
        'ttl' : fRectangle.tlPos, 'ttr' : fRectangle.trPos,
        'ltl' : fRectangle.tlPos, 'lbl' : fRectangle.blPos,
        'rtr' : fRectangle.trPos, 'rbr' : fRectangle.brPos
      };
      let f = gripPosition[id];
      return (f) ? f(coords || this._figure.coords) : super.gripCoords(id, coords);
    }

    createGrips() {
      switch (this._figure.coords.tilt) {
      case bitarea.tilts.BOTTOM:
        this._grips.push(new Grip('t', this._figure.domParent, this.gripCoords('t'), this.gripCursor('t')));
        this._grips.push(new Grip('bbl', this._figure.domParent, this.gripCoords('bbl'), this.gripCursor('bbl')));
        this._grips.push(new Grip('bbr', this._figure.domParent, this.gripCoords('bbr'), this.gripCursor('bbr')));
        break;
      case bitarea.tilts.TOP:
        this._grips.push(new Grip('b', this._figure.domParent, this.gripCoords('b'), this.gripCursor('b')));
        this._grips.push(new Grip('ttl', this._figure.domParent, this.gripCoords('ttl'), this.gripCursor('ttl')));
        this._grips.push(new Grip('ttr', this._figure.domParent, this.gripCoords('ttr'), this.gripCursor('ttr')));
        break;
      case bitarea.tilts.LEFT:
        this._grips.push(new Grip('r', this._figure.domParent, this.gripCoords('r'), this.gripCursor('r')));
        this._grips.push(new Grip('ltl', this._figure.domParent, this.gripCoords('ltl'), this.gripCursor('ltl')));
        this._grips.push(new Grip('lbl', this._figure.domParent, this.gripCoords('lbl'), this.gripCursor('lbl')));
        break;
      case bitarea.tilts.RIGHT:
        this._grips.push(new Grip('l', this._figure.domParent, this.gripCoords('l'), this.gripCursor('l')));
        this._grips.push(new Grip('rtr', this._figure.domParent, this.gripCoords('rtr'), this.gripCursor('rtr')));
        this._grips.push(new Grip('rbr', this._figure.domParent, this.gripCoords('rbr'), this.gripCursor('rbr')));
        break;
      default:
      }
    }

    rotateGrips(direction) {
      const rclkNext = {
        't' : 'r', 'r' : 'b', 'b' : 'l', 'l' : 't',
        'bbl' : 'ltl', 'ltl' : 'ttr', 'ttr' : 'rbr', 'rbr' : 'bbl',
        'bbr' : 'lbl', 'lbl' : 'ttl', 'ttl' : 'rtr', 'rtr' : 'bbr'
      };
      const raclkNext = {
        't' : 'l', 'l' : 'b', 'b' : 'r', 'r' : 't',
        'bbl' : 'rbr', 'rbr' : 'ttr', 'ttr' : 'ltl', 'ltl' : 'bbl',
        'bbr' : 'rtr', 'rtr' : 'ttl', 'ttl' : 'lbl', 'lbl' : 'bbr'
      };
      this._grips.forEach(e => {
        let newId = (direction === directions.RCLK) ? rclkNext[e.id] : raclkNext[e.id];
        e.id = newId;
        e.cursor = this.gripCursor(newId);
      });
    }

    computeEditDLims(id, wmax, hmax) {
      const constraints = {
        'bbl' : fIsoscelesTriangle.bblEditCns, 'bbr' : fIsoscelesTriangle.bbrEditCns,
        'ttl' : fIsoscelesTriangle.ttlEditCns, 'ttr' : fIsoscelesTriangle.ttrEditCns,
        'ltl' : fIsoscelesTriangle.ltlEditCns, 'lbl' : fIsoscelesTriangle.lblEditCns,
        'rtr' : fIsoscelesTriangle.rtrEditCns, 'rbr' : fIsoscelesTriangle.rbrEditCns
      };
      let f = constraints[id];
      return (f) ? f.bind(this)(this._figure, wmax, hmax) : super.computeEditDLims(id, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        'bbl' : fIsoscelesTriangle.bblEdit, 'bbr' : fIsoscelesTriangle.bbrEdit,
        'ttl' : fIsoscelesTriangle.ttlEdit, 'ttr' : fIsoscelesTriangle.ttrEdit,
        'ltl' : fIsoscelesTriangle.ltlEdit, 'lbl' : fIsoscelesTriangle.lblEdit,
        'rtr' : fIsoscelesTriangle.rtrEdit, 'rbr' : fIsoscelesTriangle.rbrEdit
      };
      if (!this._enabled) {
        return this._figure.coords;
      }
      let f = editCoords[id];
      return (f) ? f(this._figure, dx, dy) : super.computeEditCoords(id, dx, dy);
    }

  } // ISOSCELES TRIANGLE EDITOR
 
  /*
   * EQUILATERAL TRIANGLE EDITOR
   */

var fEquilateralTriangle = (function() {
    
    const F = Math.sqrt(3);
    const R = F/2;

    // GRIP CONSTRAINTS

    function sideCompute(msm, mso, mbm, mbM) {
      return Math.min( msm, 2*mso, Math.min(mbm, mbM)/R );
    }

    function cornerCompute(msm, mso, mbm, mbM, ls, lb) {
      let ms = Math.min(msm, Math.round(mso/2), Math.round(mbm/F), Math.round(mbM/F));
      return [ms, Math.round(ms*F), Math.round(ls/3), Math.round(lb/2)];
    }

    function cornerAssign(minm, maxm, mino, maxo) {
      return [-minm, maxm, -mino, maxo];
    }

    function lEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = this.computeMoveDLims(wmax, hmax);
      rtn.dxmin = -sideCompute(-mlims.dxmin, mlims.dxmax, -mlims.dymin, mlims.dymax);
      rtn.dxmax = Math.round(obj.coords.width * 2/3);
      return rtn;
    }
    
    function rEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = this.computeMoveDLims(wmax, hmax);
      rtn.dxmin = -Math.round(obj.coords.width * 2/3);
      rtn.dxmax = sideCompute(mlims.dxmax, -mlims.dxmin, -mlims.dymin, mlims.dymax);
      return rtn;
    }
    
    function tEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = this.computeMoveDLims(wmax, hmax);
      rtn.dymin = -sideCompute(-mlims.dymin, mlims.dymax, -mlims.dxmin, mlims.dxmax);
      rtn.dymax = Math.round(obj.coords.height * 2/3);
      return rtn;
    }
    
    function bEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = this.computeMoveDLims(wmax, hmax);
      rtn.dymin = -Math.round(obj.coords.height * 2/3);
      rtn.dymax = sideCompute(mlims.dymax, -mlims.dymin, -mlims.dxmin, mlims.dxmax);
      return rtn;
    }
    
    function ltlEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = this.computeMoveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(-mlims.dxmin, mlims.dxmax, -mlims.dymin, mlims.dymax, obj.coords.width, obj.coords.height);
      [rtn.dxmin, rtn.dxmax, rtn.dymin, rtn.dymax] = cornerAssign(mmv, mmf, mov, mof);
      return rtn;
    }

    function lblEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = this.computeMoveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(-mlims.dxmin, mlims.dxmax, -mlims.dymin, mlims.dymax, obj.coords.width, obj.coords.height);
      [rtn.dxmin, rtn.dxmax, rtn.dymin, rtn.dymax] = cornerAssign(mmv, mmf, mof, mov);
      return rtn;
    }

    function rtrEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = this.computeMoveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(mlims.dxmax, -mlims.dxmin, -mlims.dymin, mlims.dymax, obj.coords.width, obj.coords.height);
      [rtn.dxmin, rtn.dxmax, rtn.dymin, rtn.dymax] = cornerAssign(mmf, mmv, mov, mof);
      return rtn;
    }

    function rbrEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = this.computeMoveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(mlims.dxmax, -mlims.dxmin, -mlims.dymin, mlims.dymax, obj.coords.width, obj.coords.height);
      [rtn.dxmin, rtn.dxmax, rtn.dymin, rtn.dymax] = cornerAssign(mmf, mmv, mof, mov);
      return rtn;
    }

    function ttlEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = this.computeMoveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(-mlims.dymin, mlims.dymax, -mlims.dxmin, mlims.dxmax, obj.coords.height, obj.coords.width);
      [rtn.dymin, rtn.dymax, rtn.dxmin, rtn.dxmax] = cornerAssign(mmv, mmf, mov, mof);
      return rtn;
    }

    function ttrEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = this.computeMoveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(-mlims.dymin, mlims.dymax, -mlims.dxmin, mlims.dxmax, obj.coords.height, obj.coords.width);
      [rtn.dymin, rtn.dymax, rtn.dxmin, rtn.dxmax] = cornerAssign(mmv, mmf, mof, mov);
      return rtn;
    }

    function bblEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = this.computeMoveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(mlims.dymax, -mlims.dymin, -mlims.dxmin, mlims.dxmax, obj.coords.height, obj.coords.width);
      [rtn.dymin, rtn.dymax, rtn.dxmin, rtn.dxmax] = cornerAssign(mmf, mmv, mov, mof);
      return rtn;
    }

    function bbrEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = this.computeMoveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(mlims.dymax, -mlims.dymin, -mlims.dxmin, mlims.dxmax, obj.coords.height, obj.coords.width);
      [rtn.dymin, rtn.dymax, rtn.dxmin, rtn.dxmax] = cornerAssign(mmf, mmv, mof, mov);
      return rtn;
    }

    // GRIP EDITION

    let sideEdit = function(dm, pm, po, lm, lo) {
      let dpm = Math.round(dm/2), dpo = Math.round(dm*R);
      return [pm-dm, pm-dpm, po-dpo, lm+dm+dpm, lo+2*dpo];
    };

    let cornerEdit = function(ds, db, ps, pb, ls, lb) {
      let dps = Math.min(ds, Math.round(db/F));
      let dpb = Math.round(dps*F);
      return [ps-2*dps, ps-dps, pb-dpb, ls+3*dps, lb+2*dpb]; // d = 2dps = sqrt(dps^2 + dpb^2) 
    };

    function lEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [rtn.x, , rtn.y, rtn.width, rtn.height] = sideEdit(-dx, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function rEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [, rtn.x, rtn.y, rtn.width, rtn.height] = sideEdit(dx, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function tEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [rtn.y, , rtn.x, rtn.height, rtn.width] = sideEdit(-dy, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function bEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [, rtn.y, rtn.x, rtn.height, rtn.width] = sideEdit(dy, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function ltlEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [, rtn.x, rtn.y, rtn.width, rtn.height] = cornerEdit(-dx, -dy, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function lblEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [, rtn.x, rtn.y, rtn.width, rtn.height] = cornerEdit(-dx, dy, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function rtrEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [rtn.x, , rtn.y, rtn.width, rtn.height] = cornerEdit(dx, -dy, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function rbrEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [rtn.x, , rtn.y, rtn.width, rtn.height] = cornerEdit(dx, dy, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function ttlEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [, rtn.y, rtn.x, rtn.height, rtn.width] = cornerEdit(-dy, -dx, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function ttrEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [, rtn.y, rtn.x, rtn.height, rtn.width] = cornerEdit(-dy, dx, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function bblEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [rtn.y, , rtn.x, rtn.height, rtn.width] = cornerEdit(dy, -dx, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function bbrEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [rtn.y, , rtn.x, rtn.height, rtn.width] = cornerEdit(dy, dx, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    return {

      lEditCns, rEditCns, tEditCns, bEditCns,
      ltlEditCns, lblEditCns, rtrEditCns, rbrEditCns, ttlEditCns, ttrEditCns, bblEditCns, bbrEditCns,
      lEdit, rEdit, tEdit, bEdit,
      ltlEdit, lblEdit, rtrEdit, rbrEdit, ttlEdit, ttrEdit, bblEdit, bbrEdit

    };

  })(); // treqEd

  class EquilateralTriangle extends IsoscelesTriangle {
    
    constructor(figure) {
      super(figure);
    }

    gripCursor(id) {
      const gripCursors = {
        'bbl' : cursors.NESW, 'bbr' : cursors.NWSE,
        'ttl' : cursors.NWSE, 'ttr' : cursors.NESW,  
        'ltl' : cursors.NWSE, 'lbl' : cursors.NESW,
        'rtr' : cursors.NESW, 'rbr' : cursors.NWSE
      };
      return gripCursors[id] || super.gripCursor(id);
    }

    computeEditDLims(id, wmax, hmax) {
      const constraints = {
        't' : fEquilateralTriangle.tEditCns, 'b' : fEquilateralTriangle.bEditCns, 'l' : fEquilateralTriangle.lEditCns, 'r' : fEquilateralTriangle.rEditCns,  
        'bbl' : fEquilateralTriangle.bblEditCns, 'bbr' : fEquilateralTriangle.bbrEditCns,
        'ttl' : fEquilateralTriangle.ttlEditCns, 'ttr' : fEquilateralTriangle.ttrEditCns,
        'ltl' : fEquilateralTriangle.ltlEditCns, 'lbl' : fEquilateralTriangle.lblEditCns,
        'rtr' : fEquilateralTriangle.rtrEditCns, 'rbr' : fEquilateralTriangle.rbrEditCns
      };
      return constraints[id].bind(this)(this._figure, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        't' : fEquilateralTriangle.tEdit, 'b' : fEquilateralTriangle.bEdit, 'l' : fEquilateralTriangle.lEdit, 'r' : fEquilateralTriangle.rEdit,  
        'bbl' : fEquilateralTriangle.bblEdit, 'bbr' : fEquilateralTriangle.bbrEdit,
        'ttl' : fEquilateralTriangle.ttlEdit, 'ttr' : fEquilateralTriangle.ttrEdit,
        'ltl' : fEquilateralTriangle.ltlEdit, 'lbl' : fEquilateralTriangle.lblEdit,
        'rtr' : fEquilateralTriangle.rtrEdit, 'rbr' : fEquilateralTriangle.rbrEdit
      };
      return (this._enabled) ? editCoords[id](this._figure, dx, dy) : this._figure.coords;
    }

  } // EQUILATERAL TRIANGLE GENERATOR

  /*
   * RECTANGLE TRIANGLE EDITOR
   */
  
  var fRectangleTriangle = (function() {

    function delta( w, h, dx, dy) {
      let r = w / h;  // h & w <> 0 for a visble rectangle
      return [Math.round(dy*r), Math.round(dx/r)];
    }

    function ceil(x1, y1, x2, y2, x3, y3, dx, dy, sgn) {
      let a = (y2-y1)/(x2-x1), b = (y1*x2 - y2*x1)/(x2-x1);
      let x = x3 + dx, y = y3 + dy;
      if ((y - (a*x + b)) * sgn < 0) {
        let bp = y + x / a;
        x = (a / (a*a - 1)) * (bp - b);
        y = a*x + b;
      }
      return [Math.round(x - x3), Math.round(y - y3)];
    }

    function ttlEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [dx, dy] = ceil(rtn.x, rtn.y + rtn.height, rtn.x + rtn.width, rtn.y, rtn.x, rtn.y, dx, dy, -1);
      let [dw, dh] = delta(rtn.width, rtn.height, dx, dy);
      rtn.width -= dw + dx;
      rtn.height -= dh + dy;
      rtn.x += dx;
      rtn.y += dy;
      return rtn;
    }

    function bbrEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [dx, dy] = ceil(rtn.x, rtn.y + rtn.height, rtn.x + rtn.width, rtn.y, rtn.x + rtn.width, rtn.y + rtn.height, dx, dy, 1);
      let [dw, dh] = delta(rtn.width, rtn.height, dx, dy);
      rtn.width += dw + dx;
      rtn.height += dh + dy;
      rtn.x -= dw;
      rtn.y -= dh;
      return rtn;
    }

    function lblEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [dx, dy] = ceil(rtn.x, rtn.y, rtn.x + rtn.width, rtn.y + rtn.height, rtn.x, rtn.y + rtn.height, dx, dy, 1);
      let [dw, dh] = delta(rtn.width, rtn.height, dx, dy);
      rtn.width -= dx - dw;
      rtn.height -= dh - dy;
      rtn.x += dx;
      rtn.y += dh;
      return rtn;
    }

    function rtrEdit(obj, dx, dy) {
      let rtn = obj.coords;
      [dx, dy] = ceil(rtn.x, rtn.y, rtn.x + rtn.width, rtn.y + rtn.height, rtn.x + rtn.width, rtn.y, dx, dy, -1);
      let [dw, dh] = delta(rtn.width, rtn.height, dx, dy);
      rtn.width += dx - dw;
      rtn.height += dh - dy;
      rtn.x += dw;
      rtn.y += dy;
      return rtn;
    }

    function pEditCns(obj, wmax, hmax, x, y) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 };
      let x1 = obj.coords.x, y1 = obj.coords.y, x2 = obj.coords.x + obj.coords.width, y2 = obj.coords.y + obj.coords.height;
      let a = (y2-y1)/(x2-x1), b = (y1*x2 - y2*x1)/(x2-x1);
      let my1 = Math.max(b, 0), mx1 = (my1-b)/a, my2 = Math.min(hmax, a*wmax+b), mx2 = (my2-b)/a;
      rtn.dxmin = Math.round(mx1-x);
      rtn.dxmax = Math.round(mx2-x);
      rtn.dymin = Math.round(my1-y);
      rtn.dymax = Math.round(my2-y);
      return rtn;
    }

    function nEditCns(obj, wmax, hmax, x, y) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 };
      let x1 = obj.coords.x, y1 = obj.coords.y + obj.coords.height, x2 = obj.coords.x + obj.coords.width, y2 = obj.coords.y;
      let a = (y2-y1)/(x2-x1), b = (y1*x2 - y2*x1)/(x2-x1);
      let my1 = Math.min(b, hmax), mx1 = (my1-b)/a, mx2 = Math.min(-b/a, wmax), my2 = a*mx2+b;
      rtn.dxmin = Math.round(mx1-x);
      rtn.dxmax = Math.round(mx2-x);
      rtn.dymin = Math.round(my2-y);
      rtn.dymax = Math.round(my1-y);
      return rtn;
    }

    function ttlEditCns(obj, wmax, hmax) { return nEditCns(obj, wmax, hmax, obj.coords.x, obj.coords.y); }
    function bbrEditCns(obj, wmax, hmax) { return nEditCns(obj, wmax, hmax, obj.coords.x + obj.coords.width, obj.coords.y + obj.coords.height); }
    function lblEditCns(obj, wmax, hmax) { return pEditCns(obj, wmax, hmax, obj.coords.x, obj.coords.y + obj.coords.height); }
    function rtrEditCns(obj, wmax, hmax) { return pEditCns(obj, wmax, hmax, obj.coords.x + obj.coords.width, obj.coords.y); }

    return {

      ttlEdit, bbrEdit, lblEdit, rtrEdit,
      ttlEditCns, bbrEditCns, lblEditCns, rtrEditCns

    }

  })(); // fRectangleTriangle

  class RectangleTriangle extends IsoscelesTriangle {
    
    constructor(figure) {
      super(figure);
    }

    gripCursor(id) {
      const gripCursors = {
        'bbr' : cursors.NWSE,
        'ttl' : cursors.NWSE,  
        'lbl' : cursors.NESW,
        'rtr' : cursors.NESW
      };
      return gripCursors[id] || super.gripCursor(id);
    }

    createGrips() {
      switch (this._figure.coords.tilt) {
      case bitarea.tilts.BOTTOM:
        this._grips.push(new Grip('bl', this._figure.domParent, this.gripCoords('bl'), this.gripCursor('bl')));
        this._grips.push(new Grip('bbr', this._figure.domParent, this.gripCoords('bbr'), this.gripCursor('bbr')));
        this._grips.push(new Grip('tr', this._figure.domParent, this.gripCoords('tr'), this.gripCursor('tr')));
        break;
      case bitarea.tilts.TOP:
        this._grips.push(new Grip('tr', this._figure.domParent, this.gripCoords('tr'), this.gripCursor('tr')));
        this._grips.push(new Grip('ttl', this._figure.domParent, this.gripCoords('ttl'), this.gripCursor('ttl')));
        this._grips.push(new Grip('bl', this._figure.domParent, this.gripCoords('bl'), this.gripCursor('bl')));
        break;
      case bitarea.tilts.LEFT:
        this._grips.push(new Grip('tl', this._figure.domParent, this.gripCoords('tl'), this.gripCursor('tl')));
        this._grips.push(new Grip('lbl', this._figure.domParent, this.gripCoords('lbl'), this.gripCursor('lbl')));
        this._grips.push(new Grip('br', this._figure.domParent, this.gripCoords('br'), this.gripCursor('br')));
        break;
      case bitarea.tilts.RIGHT:
        this._grips.push(new Grip('br', this._figure.domParent, this.gripCoords('br'), this.gripCursor('br')));
        this._grips.push(new Grip('rtr', this._figure.domParent, this.gripCoords('rtr'), this.gripCursor('rtr')));
        this._grips.push(new Grip('tl', this._figure.domParent, this.gripCoords('tl'), this.gripCursor('tl')));
        break;
      default:
      }
    }

    rotateGrips(direction) {
      const rclkNext = {
        'bl' : 'tl', 'tl' : 'tr', 'tr' : 'br', 'br' : 'bl',
        'bbr' : 'lbl', 'lbl' : 'ttl', 'ttl' : 'rtr', 'rtr' : 'bbr'
      };
      const raclkNext = {
        'bl' : 'br', 'br' : 'tr', 'tr' : 'tl', 'tl' : 'bl',
        'bbr' : 'rtr', 'rtr' : 'ttl', 'ttl' : 'lbl', 'lbl' : 'bbr'
      };
      this._grips.forEach(e => {
        let newId = (direction === directions.RCLK) ? rclkNext[e.id] : raclkNext[e.id];
        e.id = newId;
        e.cursor = this.gripCursor(newId);
      });
    }

    computeEditDLims(id, wmax, hmax) {
      const constraints = {
        'bbr' : fRectangleTriangle.bbrEditCns,
        'ttl' : fRectangleTriangle.ttlEditCns,
        'lbl' : fRectangleTriangle.lblEditCns,
        'rtr' : fRectangleTriangle.rtrEditCns
      };
      let f = constraints[id];
      return (f) ? f.bind(this)(this._figure, wmax, hmax) : super.computeEditDLims(id, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        'bbr' : fRectangleTriangle.bbrEdit,
        'ttl' : fRectangleTriangle.ttlEdit,
        'lbl' : fRectangleTriangle.lblEdit,
        'rtr' : fRectangleTriangle.rtrEdit
      };
      if (!this._enabled) {
        return this._figure.coords;
      }
      let f = editCoords[id];
      return (f) ? f(this._figure, dx, dy) : super.computeEditCoords(id, dx, dy);
    }

  } // RECTANGLE TRIANGLE GENERATOR

  /*
   * HEX EDITOR
   */

  var fHex = (function() {

    const F = Math.sqrt(3), R = F/2;

    // GRIPS CONSTRAINTS

    function hrEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dxmin : -obj.coords.width,
                dxmax : Math.min(lims.dxmax, Math.round(-lims.dymin/R*2), Math.round(lims.dymax/R*2)),
                dymin : 0, dymax : 0 };
    }
    function hlEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dxmax : obj.coords.width,
                dxmin : -Math.min(-lims.dxmin, Math.round(-lims.dymin/R*2), Math.round(lims.dymax/R*2)),
                dymin : 0, dymax : 0 };
    }
    function htEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dymax : obj.coords.heigth,
                dymin : -Math.min(-lims.dymin, Math.round(-lims.dxmin*F), Math.round(lims.dxmax*F)),
                dxmin : 0, dxmax : 0 };
    }
    function hbEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dymin : -obj.coords.height,
                dymax : Math.min(lims.dymax, Math.round(-lims.dxmin*F), Math.round(lims.dxmax*F)),
                dxmin : 0, dxmax : 0 };
    }

    function vrEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dxmin : -obj.coords.width,
                dxmax : Math.min(lims.dxmax, Math.round(-lims.dymin*F), Math.round(lims.dymax*F)),
                dymin : 0, dymax : 0 };
    }
    function vlEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dxmax : obj.coords.width,
                dxmin : -Math.min(-lims.dxmin, Math.round(-lims.dymin*F), Math.round(lims.dymax*F)),
                dymin : 0, dymax : 0 };
    }
    function vtEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dymax : obj.coords.heigth,
                dymin : -Math.min(-lims.dymin, Math.round(-lims.dxmin/R*2), Math.round(lims.dxmax/R*2)),
                dxmin : 0, dxmax : 0 };
    }
    function vbEditCns(obj, wmax, hmax) {
      let lims = this.computeMoveDLims(wmax, hmax);
      return {  dymin : -obj.coords.heigth,
                dymax : Math.min(lims.dymax, Math.round(-lims.dxmin/R*2), Math.round(lims.dxmax/R*2)),
                dxmin : 0, dxmax : 0 };
    }

    // GRIPS EDITIONS

    function SmEdit(ds, s, b, ls, lb) {
      return [s, s-ds, b - Math.round(ds*R/2), ls + ds, lb + Math.round(ds*R)];
    }
    function BsEdit(db, b, s, lb, ls) {
      return [b, b-db, s - Math.round(db/F), lb + db, ls + Math.round(db/R)];
    }

    function hrEdit(obj, dx, dy)   {
      let coords = obj.coords;
      [coords.x, , coords.y, coords.width, coords.height] = SmEdit(dx, coords.x, coords.y, coords.width, coords.height);
      return coords;
    }
    function hlEdit(obj, dx, dy)   {
      let coords = obj.coords;
      [, coords.x, coords.y, coords.width, coords.height] = SmEdit(-dx, coords.x, coords.y, coords.width, coords.height);
      return coords;
    }
    function htEdit(obj, dx, dy)   {
      let coords = obj.coords;
      [, coords.y, coords.x, coords.height, coords.width] = BsEdit(-dy, coords.y, coords.x, coords.height, coords.width);
      return coords;
    }
    function hbEdit(obj, dx, dy)   {
      let coords = obj.coords;
      [coords.y, , coords.x, coords.height, coords.width] = BsEdit(dy, coords.y, coords.x, coords.height, coords.width);
      return coords;
    }
    function vrEdit(obj, dx, dy)   {
      let coords = obj.coords;
      [coords.x, , coords.y, coords.width, coords.height] = BsEdit(dx, coords.x, coords.y, coords.width, coords.height);
      return coords;
    }
    function vlEdit(obj, dx, dy)   {
      let coords = obj.coords;
      [, coords.x, coords.y, coords.width, coords.height] = BsEdit(-dx, coords.x, coords.y, coords.width, coords.height);
      return coords;
    }
    function vtEdit(obj, dx, dy)   {
      let coords = obj.coords;
      [, coords.y, coords.x, coords.height, coords.width] = SmEdit(-dy, coords.y, coords.x, coords.height, coords.width);
      return coords;
    }
    function vbEdit(obj, dx, dy)   {
      let coords = obj.coords;
      [coords.y, , coords.x, coords.height, coords.width] = SmEdit(dy, coords.y, coords.x, coords.height, coords.width);
      return coords;
    }

    return {

      hrEditCns, hlEditCns, htEditCns, hbEditCns, vrEditCns, vlEditCns, vtEditCns, vbEditCns,
      hrEdit, hlEdit, htEdit, hbEdit, vrEdit, vlEdit, vtEdit, vbEdit

    };

  })(); // fHex

  class Hex extends Rectangle {
    
    constructor(figure) {
      super(figure);
    }

    gripCursor(id) {
      const gripCursors = {
          'hl' : cursors.EW, 'hr' : cursors.EW, 'ht' : cursors.NS, 'hb' : cursors.NS,
          'vl' : cursors.EW, 'vr' : cursors.EW, 'vt' : cursors.NS, 'vb' : cursors.NS
      };
      return gripCursors[id] || super.gripCursor(id);
    }

    gripCoords(id, coords) {
      const gripPosition = {
        'hl' : fRectangle.lPos, 'hr' : fRectangle.rPos, 'ht' : fRectangle.tPos, 'hb' : fRectangle.bPos,
        'vl' : fRectangle.lPos, 'vr' : fRectangle.rPos, 'vt' : fRectangle.tPos, 'vb' : fRectangle.bPos
      };
      let f = gripPosition[id];
      return (f) ? f(coords || this._figure.coords) : super.gripCoords(id, coords);
    }

    createGrips() {
      let c = this._figure.coords;
      if (c.width > c.height) {
        this._grips.push(new Grip('hl', this._figure.domParent, this.gripCoords('hl'), this.gripCursor('hl')));
        this._grips.push(new Grip('hr', this._figure.domParent, this.gripCoords('hr'), this.gripCursor('hr')));
        this._grips.push(new Grip('ht', this._figure.domParent, this.gripCoords('ht'), this.gripCursor('ht')));
        this._grips.push(new Grip('hb', this._figure.domParent, this.gripCoords('hb'), this.gripCursor('hb')));
      } else {
        this._grips.push(new Grip('vl', this._figure.domParent, this.gripCoords('vl'), this.gripCursor('vl')));
        this._grips.push(new Grip('vr', this._figure.domParent, this.gripCoords('vr'), this.gripCursor('vr')));
        this._grips.push(new Grip('vt', this._figure.domParent, this.gripCoords('vt'), this.gripCursor('vt')));
        this._grips.push(new Grip('vb', this._figure.domParent, this.gripCoords('vb'), this.gripCursor('vb')));
      }
    }

    rotateGrips(direction) {
      const rNext = {
          'hl' : 'vl', 'hr' : 'vr', 'ht' : 'vt', 'hb' : 'vb',  
          'vl' : 'hl', 'vr' : 'hr', 'vt' : 'ht', 'vb' : 'hb'  
      };
      this._grips.forEach(e => {
        let newId = rNext[e.id];
        e.id = newId;
        e.cursor = this.gripCursor(newId);
      });
    }

    computeEditDLims(id, wmax, hmax) {
      const constraints = {
        'hl' : fHex.hlEditCns, 'hr' : fHex.hrEditCns, 'ht' : fHex.htEditCns, 'hb' : fHex.hbEditCns,
        'vl' : fHex.vlEditCns, 'vr' : fHex.vrEditCns, 'vt' : fHex.vtEditCns, 'vb' : fHex.vbEditCns
      };
      let f = constraints[id];
      return (f) ? f.bind(this)(this._figure, wmax, hmax) : super.computeEditDLims(id, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        'hl' : fHex.hlEdit, 'hr' : fHex.hrEdit, 'ht' : fHex.htEdit, 'hb' : fHex.hbEdit,
        'vl' : fHex.vlEdit, 'vr' : fHex.vrEdit, 'vt' : fHex.vtEdit, 'vb' : fHex.vbEdit
      };
      if (!this._enabled) {
        return this._figure.coords;
      }
      let f = editCoords[id];
      return (f) ? f(this._figure, dx, dy) : super.computeEditCoords(id, dx, dy);
    }

  } // HEX EDITOR

  /*
   * POLYGON EDITOR 
   */

  class Polygon extends Figure {
    
    constructor(figure) {
      super(figure);
    }

    computeMoveDLims(wmax, hmax) {
      let c = this._figure.coords;
      let lims = c.reduce(function(r, e) {
        if (r.xmin > e.x) r.xmin = e.x;
        if (r.xmax < e.x) r.xmax = e.x;
        if (r.ymin > e.y) r.ymin = e.y;
        if (r.ymax < e.y) r.ymax = e.y;
        return r;
      }, { xmin : 1000000, xmax : -1000000, ymin : 1000000, ymax : -1000000 });
      return {
        dxmin : -lims.xmin,
        dxmax : wmax - lims.xmax,
        dymin : -lims.ymin,
        dymax : hmax - lims.ymax
      };
    }

    computeMoveCoords(dx, dy) {
      let rtn = this._figure.copyCoords();
      rtn.forEach(function(e) {
        e.x += dx;
        e.y += dy;
      });
      return rtn;
    }

    computeRotateCoords(direction, wmax, hmax) {
      return this._figure.coords;
    }

    gripCoords(id, coords) {
      let c = coords || this._figure.coords;
      return { x : c[id].x, y : c[id].y };
    }

    createGrips() {
      for (let i = 0; i < this._figure.coords.length; i++) {
        this._grips.push(new Grip(i, this._figure.domParent, this.gripCoords(i), this.gripCursor(i)));
      }
    }

    computeEditDLims(id, wmax, hmax) {
      let c = this._figure.coords[id];
      return {  dxmin : -c.x, dxmax : wmax - c.x,
                dymin : -c.y, dymax : hmax - c.y };
    }

    computeEditCoords(id, dx, dy) {
      let coords = this._figure.copyCoords();
      if (this._enabled) {
        coords[id].x += dx;
        coords[id].y += dy;
      }
      return coords;
    }

    checkCoords(coords) {
      return (2 < coords.length) ? true : false;
    }

  }

  /*
   * ORDER DISPLAY
   */
  
  class OrderDisplay {

    constructor(g, figure, order) {
      let x, y;
      this._g = g;
      this._figure = figure;
      this._order = order;
      [x, y] = figure.center;
      this._dom = document.createElementNS(NSSVG, 'text');
      this._dom.textContent = order.toString();
      this._dom.setAttribute('text-anchor', 'middle');
      this._dom.setAttribute('alignment-baseline', 'middle');
      this._dom.setAttribute('x', x);
      this._dom.setAttribute('y', y);
      this._dom.classList.add('order');
      this._g.appendChild(this._dom);
    }

    remove() {
      this._g.removeChild(this._dom);
      this._g = this._dom = this._figure = null;
    }

  } // ORDER DISPLAY

  /*
   * EDITOR FACTORY
   */

  var factory = {
    'rectangle'     : Rectangle,
    'square'        : Square,
    'rhombus'       : Rhombus,
    'circleCtr'     : Circle,
    'circleDtr'     : CircleEx,
    'ellipse'       : Ellipse,
    'triangleIsc'   : IsoscelesTriangle,
    'triangleEql'   : EquilateralTriangle,
    'triangleRct'   : RectangleTriangle,
    'hexRct'        : Hex,
    'hexDtr'        : Hex,
    'polygon'       : Polygon,
    'gridRectangle' : Rectangle,
    'gridCircle'    : CircleEx,
    'gridHex'       : Hex
  };

  function create(figure) {
    if(!figure || null == figure) return null;
    let figEdit = factory[figure.type];
    if (!figEdit) {
      console.log('ERROR - Editor mode not handled');
      return null;
    }
    return new figEdit(figure);
  }

  /*
   * MULTI-SELECTOR
   */

  class MultiSelector {

    constructor() {
      this._selection = [];
    }

    set(figure) {
      let editor = this.find(figure);
      if (1 === this._selection.length && editor === this._selection[0]) {
        return;
      }
      editor = editor || create(figure);
      let id = this._selection.indexOf(editor);
      if (-1 === id) {
        this.empty();
        editor.markSelected();
        this._selection.push(editor);
        this.enableEdition();
      } else {
        if (0 !== id) {
          this.disableEdition();
          this._selection.splice(0, id);
        }
        this._selection.splice(1, this._selection.length - 1);
        this.enableEdition();
      }
    }

    toggle(figure) {
      let editor = this.find(figure) || create(figure);
      let id = this._selection.indexOf(editor);
      if (-1 === id) {
        this.disableEdition();
        editor.markSelected();
        this._selection.push(editor);
        this.enableEdition();
      } else {
        this._selection.splice(id, 1);
        editor.markUnselected();
        editor.remove();
        this.enableEdition();
      }
    }

    add(figure) {
      let editor = this.find(figure) || create(figure);
      let id = this._selection.indexOf(editor);
      if (-1 === id) {
        this.disableEdition();
        editor.markSelected();
        this._selection.push(editor);
        this.enableEdition();
      }
    }

/*
    remove(obj) {
      let id = this._selection.indexOf(obj);
      if (-1 === id) {
        return;
      }
      obj.markUnselected();
      this._selection.splice(id, 1);
    }
*/

    empty() {
      this._selection.forEach(e => { 
        e.markUnselected();
        e.remove();
      });
      this._selection.splice(0, this._selection.length);
    }

    has(figure) {
      let editor = this.find(figure);
      return (editor && null !== editor) ? true : false;
    }

    find(figure) {
      return this._selection.find(e => e.is(figure));
    }

    get(id) {
      return this._selection[id];
    }
    
    get length() {
      return this._selection.length;
    }

    enableEdition() {
      if (1 == this._selection.length) {
        this._selection[0].enableEdition();
      }
    }

    disableEdition() {
      if (1 == this._selection.length) {
        this._selection[0].disableEdition();
      }
    }

    forEach(f) {
      return this._selection.forEach(f);
    }

    sort(f) {
      return this._selection.sort(f);
    }


    reduce(f, i) {
      return this._selection.reduce(f, i);
    }

    slice() {
      return this._selection.slice();
    }

  } // MULTI-SELECTOR

  /*
   * MOVER
   */

  class Mover {

    constructor() {
      this.selector = null;
      this.org = { x : 0, y : 0 };
      this.lims = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 };
    }

    start(selector, pt, wmax, hmax) {
      this.selector = selector;
      this.org.x = pt.x;
      this.org.y = pt.y;
      this.setLims(wmax, hmax);
    }

    progress(pt) {
      let d = this.constrain(pt.x - this.org.x, pt.y - this.org.y);
      this.selector.forEach(e => e.drawToOffset(d.dx, d.dy));
    }

    end(pt) {
      let d = this.constrain(pt.x - this.org.x, pt.y - this.org.y);
      this.selector.forEach(e => e.moveToOffset(d.dx, d.dy));
      this.reset();
    }

    cancel() {
      this.selector.forEach(e => e.drawToOffset(0, 0));
      this.reset();
    }

    step(selector, dx, dy, wmax, hmax) {
      this.selector = selector;
      this.setLims(wmax, hmax);
      let d = this.constrain(dx, dy);
      this.selector.forEach(e => e.moveToOffset(d.dx, d.dy));
      this.reset();
    }

    reset() {
      this.org.x = this.org.y = 0;
      this.lims.dxmin = this.lims.dxmax = this.lims.dymin = this.lims.dymax = 0;
    }

    setLims(width, height) {
      let dlims = this.selector.reduce((r, e) => {
        let l = e.computeMoveDLims(width, height);
        if (r.dxmin < l.dxmin) r.dxmin = l.dxmin;
        if (r.dxmax > l.dxmax) r.dxmax = l.dxmax;
        if (r.dymin < l.dymin) r.dymin = l.dymin;
        if (r.dymax > l.dymax) r.dymax = l.dymax;
        return r;
      }, { dxmin : -1000000, dxmax : 1000000, dymin : -1000000, dymax : 1000000 });
      this.lims.dxmin = dlims.dxmin;
      this.lims.dxmax = dlims.dxmax;
      this.lims.dymin = dlims.dymin;
      this.lims.dymax = dlims.dymax;
    }

    constrain(dx, dy) {
      let rtn = { dx : dx, dy : dy };
      if (dx < this.lims.dxmin) rtn.dx = this.lims.dxmin;
      if (dx > this.lims.dxmax) rtn.dx = this.lims.dxmax;
      if (dy < this.lims.dymin) rtn.dy = this.lims.dymin;
      if (dy > this.lims.dymax) rtn.dy = this.lims.dymax;
      return rtn;
    }

  } // MOVER

  /*
   * EDITOR
   */

  class Editor {

    constructor() {
      this._selection = null;
      this._id = '';
      this.org = { x : 0, y : 0 };
      this.lims = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 };
    }

    start(selection, target, pt, wmax, hmax) {
      this._selection = selection;
      this._id = this._selection.getGrip(target).id;
      this.org.x = pt.x;
      this.org.y = pt.y;
      this.setLims(this._selection, this._id, wmax, hmax);
    }

    progress(pt) {
      let d = this.constrain(pt.x - this.org.x, pt.y - this.org.y);
      this._selection.drawModified(this._id, d.dx, d.dy);
    }

    end(pt) {
      let d = this.constrain(pt.x - this.org.x, pt.y - this.org.y);
      if(!this._selection.modify(this._id, d.dx, d.dy)) {
        alert('Invalid area dimensions!');
      }
      this.reset();
    }

    cancel() {
      this._selection.drawToOffset(0, 0);
      this.reset();
    }

    reset() {
      this.org.x = this.org.y = 0;
      this.lims.dxmin = this.lims.dxmax = this.lims.dymin = this.lims.dymax = 0;
      this._selection = null;
      this._id = '';
    }

    setLims(selection, id, wmax, hmax) {
      let dlims = selection.computeEditDLims(id, wmax, hmax);
      this.lims.dxmin = dlims.dxmin;
      this.lims.dxmax = dlims.dxmax;
      this.lims.dymin = dlims.dymin;
      this.lims.dymax = dlims.dymax;
    }

    constrain(dx, dy) {
      let rtn = { dx : dx, dy : dy };
      if (dx < this.lims.dxmin) rtn.dx = this.lims.dxmin;
      if (dx > this.lims.dxmax) rtn.dx = this.lims.dxmax;
      if (dy < this.lims.dymin) rtn.dy = this.lims.dymin;
      if (dy > this.lims.dymax) rtn.dy = this.lims.dymax;
      return rtn;
    }

  } // EDITOR

  /*
   * ORDER
   */

  class Order {

    constructor() {
      this.elts = [];
      this.parent = this.group = null;;
    }

    display(areas) {
      if (0 < areas.length) {
        if (null === this.parent) {
          this.parent = areas[0].parent;
          this.group = document.createElementNS(NSSVG, 'g');
          this.parent.appendChild(this.group);
        }
        areas.forEach((e,i) => {
          this.elts.push(new OrderDisplay(this.group, e, i+1));
        });
      }
    }

    hide() {
      this.elts.forEach(e => e.remove());
      this.elts.splice(0, this.elts.length);
      if (null !== this.parent) {
        this.parent.removeChild(this.group);
      }
      this.parent = this.group = null;
    }
 
  } // ORDER

  return {
    directions, clsStatus, isGrip,
    MultiSelector, Mover, Editor, Order
  };
  
})(); /* BIT Area Editors */
