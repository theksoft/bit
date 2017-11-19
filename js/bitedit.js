/**
 * Boardgame image tool (BIT)
 * Copyright 2017 Herve Retaureau
 */

var bitedit = (function() {
  'use strict';

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

  function isGrip(dom) {
    return dom.classList.contains(clsQualifiers.GRIP) ? true : false;
  }

  class Grip extends bitarea.Rectangle {
    
    constructor(id, group, center, cursor) {
      super(group, true);
      this.id = id;
      this.cursor = cursor;
      this.Enable = true;
      this.addClass(this.className());
      this.coords.x = center.x + this.lims().offset;
      this.coords.y = center.y + this.lims().offset;
      this.coords.width = this.lims().size;
      this.coords.height = this.lims().size;
      this.disable();
      this.draw();
    }

    reposition(center) {
      this.coords.x = center.x + this.lims().offset;
      this.coords.y = center.y + this.lims().offset;
      this.draw();
    }

    getID() {
      return this.id;
    }

    setID(id) {
      this.id = id;
    }

    is(dom) {
      return (dom === this.dom) ? true : false;
    }

    enable() {
      this.removeClass(clsStatus.DISABLED);
      this.addClass(this.cursor);
    }

    disable() {
      this.removeClass(this.cursor);
      this.addClass(clsStatus.DISABLED);
    }

    setCursor(cursor) {
      if (this.hasClass(this.cursor)) {
        this.removeClass(this.cursor);
        this.addClass(cursor);
      }
      this.cursor = cursor;
    }

    className() {
      return clsQualifiers.GRIP;
    }

    lims() {
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

    constructor(fig) {
      if (this.constructor == Figure.constructor) {
        throw new Error('Invalid Figure generator constructor call: abstract class');
      }
      this.figure = fig;
      this.grips = [];
      this.createGrips();
      this.enabled = false;
    }

    is(fig) {
      return (fig === this.figure) ? true : false;
    }

    markSelected() {
      if (this.figure) {
        this.figure.addClass(clsStatus.SELECTED);
//        this.bonds.forEach(function(e) {
//          e.dom.classList.add(utils.clsNames.HIGHLIGHTED);
//        });
      }
    }

    markUnselected() {
      if (this.figure) {
        this.figure.removeClass(clsStatus.SELECTED);
//        this.bonds.forEach(function(e) {
//          e.dom.classList.remove(utils.clsNames.HIGHLIGHTED);
//        });
      }
    }

    remove() {
      this.destroyGrips();
      this.figure = this.grips = null;
    }

    isEditable(grip) {
      if (!this.enabled) return false;
      if (!isGrip(grip)) return false;
      return (this.getGrip(grip) ? true : false);
    }

    enableEdition() {
      if(!this.enabled) {
        this.grips.forEach(function(e) {
          e.enable();
        });
        this.enabled = true;
      }
    }

    disableEdition() {
      if (this.enabled) {
        this.grips.forEach(function(e) {
          e.disable();
        });
        this.enabled = false;
      }
    }

    getFigure() {
      return this.figure;
    }

    // MOVE SECTION

    computeMoveDLims(wmax, hmax) {
      console.log('computeMoveDLims() not defined - ' + wmax + 'x' + hmax);
      return { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 };
    }

    computeMoveCoords(dx, dy) {
      console.log('computeMoveCoords() not defined');
      return this.figure.getCoords();
    }

    drawToOffset(dx, dy) {
      let coords = this.computeMoveCoords(dx, dy);
      this.figure.redraw(coords);
      this.repositionGrips(coords);
    }

    moveToOffset(dx, dy) {
      let coords = this.computeMoveCoords(dx, dy);
      this.figure.setCoords(coords);
      this.figure.redraw();
      this.repositionGrips(coords);
    }

    // ROTATE SECTION

    computeRotateCoords(direction, wmax, hmax) {
      console.log('computeRotateCoords() not defined');
      return this.figure.getCoords();
    }

    rotateGrips(direction) {
      console.log('rotateGrips() not defined');
    }

    rotate(direction, wmax, hmax) {
      let coords = this.computeRotateCoords(direction, wmax, hmax);
      if (null != coords) {
        this.figure.setCoords(coords);
        this.rotateGrips(direction);
        this.figure.redraw();
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
      this.grips.forEach(function(e) {
        e.remove();
      });
      this.grips.splice(0, this.grips.length);
    }

    getGrip(dom) {
      return this.grips.find(function(e) {
        return e.is(dom);
      });
    }

    gripCoords(id, coords) {
      console.log('gripCoords() not defined');
      return (coords || this.figure.getCoords());
    }

    gripCursor(id) {
      return cursors.ALL;
    }

    repositionGrips(coords) {
      let c = coords || this.figure.getCoords();
      let getCoords = this.gripCoords.bind(this);
      this.grips.forEach(function(e) {
        e.reposition(getCoords(e.getID(), c));
      });
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
      this.figure.redraw(coords);
      this.repositionGrips(coords);
    }

    modify(id, dx, dy) {
      let coords = this.computeEditCoords(id, dx, dy);
      if (this.checkCoords(coords)) {
        this.figure.setCoords(coords);
        this.figure.redraw();
        this.repositionGrips(coords);
        return true;
      }
      this.figure.redraw();
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
      let coords = Object.create(obj.coords);
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

    constructor(fig) {
      super(fig);
    }

    computeMoveDLims(wmax, hmax) {
      let c = this.figure.getCoords();
      return {
        dxmin : -c.x,
        dxmax : wmax - (c.x + c.width),
        dymin : -c.y,
        dymax : hmax - (c.y + c.height)
      };
    }

    computeMoveCoords(dx, dy) {
      let rtn = Object.create(this.figure.coords);
      rtn.x += dx;
      rtn.y += dy;
      return rtn;
    }

    computeRotateCoords(direction, wmax, hmax) {
      let rtn = Object.create(this.figure.coords);
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
      return gripPosition[id](coords || this.figure.getCoords());
    }

    gripCursor(id) {
      const gripCursors = {
        't' : cursors.NS, 'b' : cursors.NS, 'l' : cursors.EW, 'r' : cursors.EW,  
        'tl' : cursors.NWSE, 'tr' : cursors.NESW, 'bl' : cursors.NESW, 'br' : cursors.NWSE
      };
      return gripCursors[id] || super.gripCursor(id);
    }

    createGrips() {
      this.grips.push(new Grip('t', this.figure.getDomParent(), this.gripCoords('t'), this.gripCursor('t')));
      this.grips.push(new Grip('b', this.figure.getDomParent(), this.gripCoords('b'), this.gripCursor('b')));
      this.grips.push(new Grip('l', this.figure.getDomParent(), this.gripCoords('l'), this.gripCursor('l')));
      this.grips.push(new Grip('r', this.figure.getDomParent(), this.gripCoords('r'), this.gripCursor('r')));
      this.grips.push(new Grip('tl', this.figure.getDomParent(), this.gripCoords('tl'), this.gripCursor('tl')));
      this.grips.push(new Grip('tr', this.figure.getDomParent(), this.gripCoords('tr'), this.gripCursor('tr')));
      this.grips.push(new Grip('bl', this.figure.getDomParent(), this.gripCoords('bl'), this.gripCursor('bl')));
      this.grips.push(new Grip('br', this.figure.getDomParent(), this.gripCoords('br'), this.gripCursor('br')));
    }

    computeEditDLims(id, wmax, hmax) {
      const constraints = {
        't' : fRectangle.tEditCns, 'b' : fRectangle.bEditCns, 'l' : fRectangle.lEditCns, 'r' : fRectangle.rEditCns,  
        'tl' : fRectangle.tlEditCns, 'tr' : fRectangle.trEditCns, 'bl' : fRectangle.blEditCns, 'br' : fRectangle.brEditCns
      };
      return constraints[id](this.figure, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        't' : fRectangle.tEdit, 'b' : fRectangle.bEdit, 'l' : fRectangle.lEdit, 'r' : fRectangle.rEdit,  
        'tl' : fRectangle.tlEdit, 'tr' : fRectangle.trEdit, 'bl' : fRectangle.blEdit, 'br' : fRectangle.brEdit
      };
      return (this.enabled) ? editCoords[id](this.figure, dx, dy) : this.figure.getCoords();
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
    
    constructor(fig) {
      super(fig);
    }

    computeRotateCoords(direction, wmax, hmax) {
      return Object.create(this.figure.coords);
    }

    createGrips() {
      this.grips.push(new Grip('tl', this.figure.getDomParent(), this.gripCoords('tl'), this.gripCursor('tl')));
      this.grips.push(new Grip('tr', this.figure.getDomParent(), this.gripCoords('tr'), this.gripCursor('tr')));
      this.grips.push(new Grip('bl', this.figure.getDomParent(), this.gripCoords('bl'), this.gripCursor('bl')));
      this.grips.push(new Grip('br', this.figure.getDomParent(), this.gripCoords('br'), this.gripCursor('br')));
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        'tl' : fSquare.tlEdit, 'tr' : fSquare.trEdit, 'bl' : fSquare.blEdit, 'br' : fSquare.brEdit
      };
      return (this.enabled) ? editCoords[id](this.figure, dx, dy) : this.figure.getCoords();
    }

  } // SQUARE EDITOR

  /*
   * RHOMBUS EDITOR
   */

  class Rhombus extends Rectangle {
    
    constructor(fig) {
      super(fig);
    }

    createGrips() {
      this.grips.push(new Grip('l', this.figure.getDomParent(), this.gripCoords('l'), this.gripCursor('l')));
      this.grips.push(new Grip('r', this.figure.getDomParent(), this.gripCoords('r'), this.gripCursor('r')));
      this.grips.push(new Grip('t', this.figure.getDomParent(), this.gripCoords('t'), this.gripCursor('t')));
      this.grips.push(new Grip('b', this.figure.getDomParent(), this.gripCoords('b'), this.gripCursor('b')));
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
      let coords = Object.create(obj.coords);
      coords.r += dx;
      return coords;
    }

    return {
      rPos, rEditCns, rEdit
    };
    
  })(); // fCircle

  class Circle extends Figure {

    constructor(fig) {
      super(fig);
    }

    computeMoveDLims(wmax, hmax) {
      let c = this.figure.getCoords();
      return {
        dxmin : -(c.x - c.r),
        dxmax : wmax - (c.x + c.r),
        dymin : -(c.y - c.r),
        dymax : hmax - (c.y + c.r)
      };
    }

    computeMoveCoords(dx, dy) {
      let rtn = Object.create(this.figure.coords);
      rtn.x += dx;
      rtn.y += dy;
      return rtn;
    }

    computeRotateCoords(direction, wmax, hmax) {
      return Object.create(this.figure.coords);
    }

    gripCoords(id, coords) {
      const gripPosition = { 'r' : fCircle.rPos };
      return gripPosition[id](coords || this.figure.getCoords());
    }

    gripCursor(id) {
      const gripCursors = { 'r' : cursors.EW };
      return gripCursors[id] || super.gripCursor(id);
    }

    createGrips() {
      this.grips.push(new Grip('r', this.figure.getDomParent(), this.gripCoords('r'), this.gripCursor('r')));
    }

    computeEditDLims(id, wmax, hmax) {
      const constraints = { 'r' : fCircle.rEditCns };
      return constraints[id].bind(this)(this.figure, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = { 'r' : fCircle.rEdit };
      return (this.enabled) ? editCoords[id](this.figure, dx, dy) : this.figure.getCoords();
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
      let coords = Object.create(obj.coords);
      let dxx = Math.round(dx/2);
      coords.x += dxx;
      coords.r += dxx;
      return coords;
    }

    function lEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      let dxx = Math.round(dx/2);
      coords.x += dxx;
      coords.r -= dxx;
      return coords;
    }

    function tEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      let dyy = Math.round(dy/2);
      coords.y += dyy;
      coords.r -= dyy;
      return coords;
    }

    function bEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
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

    constructor(fig) {
      super(fig);
    }

    gripCoords(id, coords) {
      const gripPosition = { 'l' : fCircleEx.lPos, 't' : fCircleEx.tPos, 'b' : fCircleEx.bPos };
      let f = gripPosition[id];
      return (f) ? f(coords || this.figure.getCoords()) : super.gripCoords(id, coords);
    }

    gripCursor(id) {
      const gripCursors = { 'l' : cursors.EW, 't' : cursors.NS, 'b' : cursors.NS };
      return gripCursors[id] || super.gripCursor(id);
    }

    createGrips() {
      this.grips.push(new Grip('r', this.figure.getDomParent(), this.gripCoords('r'), this.gripCursor('r')));
      this.grips.push(new Grip('l', this.figure.getDomParent(), this.gripCoords('l'), this.gripCursor('l')));
      this.grips.push(new Grip('t', this.figure.getDomParent(), this.gripCoords('t'), this.gripCursor('t')));
      this.grips.push(new Grip('b', this.figure.getDomParent(), this.gripCoords('b'), this.gripCursor('b')));
    }

    computeEditDLims(id, wmax, hmax) {
      const constraints = {
        'r' : fCircleEx.rEditCns, 'l' : fCircleEx.lEditCns,
        't' : fCircleEx.tEditCns, 'b' : fCircleEx.bEditCns
      };
      let f = constraints[id];
      return (f) ? f.bind(this)(this.figure, wmax, hmax) : super.computeEditDLims(id, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        'r' : fCircleEx.rEdit, 'l' : fCircleEx.lEdit,
        't' : fCircleEx.tEdit, 'b' : fCircleEx.bEdit
      };
      if (!this.enabled) {
        return this.figure.getCoords();
      }
      let f = editCoords[id];
      return (f) ? f(this.figure, dx, dy) : super.computeEditCoords(id, dx, dy);
    }

  } // CIRCLE (from DIAMETER) EDITOR

  /*
   * ELLIPSE EDITOR
   */

  class Ellipse extends Rectangle {
    
    constructor(fig) {
      super(fig);
    }

    createGrips() {
      this.grips.push(new Grip('t', this.figure.getDomParent(), this.gripCoords('t'), this.gripCursor('t')));
      this.grips.push(new Grip('b', this.figure.getDomParent(), this.gripCoords('b'), this.gripCursor('b')));
      this.grips.push(new Grip('l', this.figure.getDomParent(), this.gripCoords('l'), this.gripCursor('l')));
      this.grips.push(new Grip('r', this.figure.getDomParent(), this.gripCoords('r'), this.gripCursor('r')));
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

    constructor(fig) {
      super(fig);
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
      return (f) ? f(coords || this.figure.getCoords()) : super.gripCoords(id, coords);
    }

    createGrips() {
      switch (this.figure.coords.tilt) {
      case bitarea.tilts.BOTTOM:
        this.grips.push(new Grip('t', this.figure.getDomParent(), this.gripCoords('t'), this.gripCursor('t')));
        this.grips.push(new Grip('bbl', this.figure.getDomParent(), this.gripCoords('bbl'), this.gripCursor('bbl')));
        this.grips.push(new Grip('bbr', this.figure.getDomParent(), this.gripCoords('bbr'), this.gripCursor('bbr')));
        break;
      case bitarea.tilts.TOP:
        this.grips.push(new Grip('b', this.figure.getDomParent(), this.gripCoords('b'), this.gripCursor('b')));
        this.grips.push(new Grip('ttl', this.figure.getDomParent(), this.gripCoords('ttl'), this.gripCursor('ttl')));
        this.grips.push(new Grip('ttr', this.figure.getDomParent(), this.gripCoords('ttr'), this.gripCursor('ttr')));
        break;
      case bitarea.tilts.LEFT:
        this.grips.push(new Grip('r', this.figure.getDomParent(), this.gripCoords('r'), this.gripCursor('r')));
        this.grips.push(new Grip('ltl', this.figure.getDomParent(), this.gripCoords('ltl'), this.gripCursor('ltl')));
        this.grips.push(new Grip('lbl', this.figure.getDomParent(), this.gripCoords('lbl'), this.gripCursor('lbl')));
        break;
      case bitarea.tilts.RIGHT:
        this.grips.push(new Grip('l', this.figure.getDomParent(), this.gripCoords('l'), this.gripCursor('l')));
        this.grips.push(new Grip('rtr', this.figure.getDomParent(), this.gripCoords('rtr'), this.gripCursor('rtr')));
        this.grips.push(new Grip('rbr', this.figure.getDomParent(), this.gripCoords('rbr'), this.gripCursor('rbr')));
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
      let newCursor = this.gripCursor.bind(this);
      this.grips.forEach(function f(e) {
        let newId = (direction === directions.RCLK) ? rclkNext[e.getID()] : raclkNext[e.getID()];
        e.setID(newId);
        e.setCursor(newCursor(newId));
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
      return (f) ? f.bind(this)(this.figure, wmax, hmax) : super.computeEditDLims(id, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        'bbl' : fIsoscelesTriangle.bblEdit, 'bbr' : fIsoscelesTriangle.bbrEdit,
        'ttl' : fIsoscelesTriangle.ttlEdit, 'ttr' : fIsoscelesTriangle.ttrEdit,
        'ltl' : fIsoscelesTriangle.ltlEdit, 'lbl' : fIsoscelesTriangle.lblEdit,
        'rtr' : fIsoscelesTriangle.rtrEdit, 'rbr' : fIsoscelesTriangle.rbrEdit
      };
      if (!this.enabled) {
        return this.figure.getCoords();
      }
      let f = editCoords[id];
      return (f) ? f(this.figure, dx, dy) : super.computeEditCoords(id, dx, dy);
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
      let rtn = Object.create(obj.coords);
      [rtn.x, , rtn.y, rtn.width, rtn.height] = sideEdit(-dx, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function rEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [, rtn.x, rtn.y, rtn.width, rtn.height] = sideEdit(dx, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function tEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [rtn.y, , rtn.x, rtn.height, rtn.width] = sideEdit(-dy, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function bEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [, rtn.y, rtn.x, rtn.height, rtn.width] = sideEdit(dy, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function ltlEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [, rtn.x, rtn.y, rtn.width, rtn.height] = cornerEdit(-dx, -dy, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function lblEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [, rtn.x, rtn.y, rtn.width, rtn.height] = cornerEdit(-dx, dy, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function rtrEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [rtn.x, , rtn.y, rtn.width, rtn.height] = cornerEdit(dx, -dy, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function rbrEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [rtn.x, , rtn.y, rtn.width, rtn.height] = cornerEdit(dx, dy, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function ttlEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [, rtn.y, rtn.x, rtn.height, rtn.width] = cornerEdit(-dy, -dx, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function ttrEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [, rtn.y, rtn.x, rtn.height, rtn.width] = cornerEdit(-dy, dx, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function bblEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [rtn.y, , rtn.x, rtn.height, rtn.width] = cornerEdit(dy, -dx, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function bbrEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
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
    
    constructor(fig) {
      super(fig);
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
      return constraints[id].bind(this)(this.figure, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        't' : fEquilateralTriangle.tEdit, 'b' : fEquilateralTriangle.bEdit, 'l' : fEquilateralTriangle.lEdit, 'r' : fEquilateralTriangle.rEdit,  
        'bbl' : fEquilateralTriangle.bblEdit, 'bbr' : fEquilateralTriangle.bbrEdit,
        'ttl' : fEquilateralTriangle.ttlEdit, 'ttr' : fEquilateralTriangle.ttrEdit,
        'ltl' : fEquilateralTriangle.ltlEdit, 'lbl' : fEquilateralTriangle.lblEdit,
        'rtr' : fEquilateralTriangle.rtrEdit, 'rbr' : fEquilateralTriangle.rbrEdit
      };
      return (this.enabled) ? editCoords[id](this.figure, dx, dy) : this.figure.getCoords();
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
      let rtn = Object.create(obj.coords);
      [dx, dy] = ceil(rtn.x, rtn.y + rtn.height, rtn.x + rtn.width, rtn.y, rtn.x, rtn.y, dx, dy, -1);
      let [dw, dh] = delta(rtn.width, rtn.height, dx, dy);
      rtn.width -= dw + dx;
      rtn.height -= dh + dy;
      rtn.x += dx;
      rtn.y += dy;
      return rtn;
    }

    function bbrEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [dx, dy] = ceil(rtn.x, rtn.y + rtn.height, rtn.x + rtn.width, rtn.y, rtn.x + rtn.width, rtn.y + rtn.height, dx, dy, 1);
      let [dw, dh] = delta(rtn.width, rtn.height, dx, dy);
      rtn.width += dw + dx;
      rtn.height += dh + dy;
      rtn.x -= dw;
      rtn.y -= dh;
      return rtn;
    }

    function lblEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [dx, dy] = ceil(rtn.x, rtn.y, rtn.x + rtn.width, rtn.y + rtn.height, rtn.x, rtn.y + rtn.height, dx, dy, 1);
      let [dw, dh] = delta(rtn.width, rtn.height, dx, dy);
      rtn.width -= dx - dw;
      rtn.height -= dh - dy;
      rtn.x += dx;
      rtn.y += dh;
      return rtn;
    }

    function rtrEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
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
    
    constructor(fig) {
      super(fig);
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
      switch (this.figure.coords.tilt) {
      case bitarea.tilts.BOTTOM:
        this.grips.push(new Grip('bl', this.figure.getDomParent(), this.gripCoords('bl'), this.gripCursor('bl')));
        this.grips.push(new Grip('bbr', this.figure.getDomParent(), this.gripCoords('bbr'), this.gripCursor('bbr')));
        this.grips.push(new Grip('tr', this.figure.getDomParent(), this.gripCoords('tr'), this.gripCursor('tr')));
        break;
      case bitarea.tilts.TOP:
        this.grips.push(new Grip('tr', this.figure.getDomParent(), this.gripCoords('tr'), this.gripCursor('tr')));
        this.grips.push(new Grip('ttl', this.figure.getDomParent(), this.gripCoords('ttl'), this.gripCursor('ttl')));
        this.grips.push(new Grip('bl', this.figure.getDomParent(), this.gripCoords('bl'), this.gripCursor('bl')));
        break;
      case bitarea.tilts.LEFT:
        this.grips.push(new Grip('tl', this.figure.getDomParent(), this.gripCoords('tl'), this.gripCursor('tl')));
        this.grips.push(new Grip('lbl', this.figure.getDomParent(), this.gripCoords('lbl'), this.gripCursor('lbl')));
        this.grips.push(new Grip('br', this.figure.getDomParent(), this.gripCoords('br'), this.gripCursor('br')));
        break;
      case bitarea.tilts.RIGHT:
        this.grips.push(new Grip('br', this.figure.getDomParent(), this.gripCoords('br'), this.gripCursor('br')));
        this.grips.push(new Grip('rtr', this.figure.getDomParent(), this.gripCoords('rtr'), this.gripCursor('rtr')));
        this.grips.push(new Grip('tl', this.figure.getDomParent(), this.gripCoords('tl'), this.gripCursor('tl')));
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
      let newCursor = this.gripCursor.bind(this);
      this.grips.forEach(function f(e) {
        let newId = (direction === directions.RCLK) ? rclkNext[e.getID()] : raclkNext[e.getID()];
        e.setID(newId);
        e.setCursor(newCursor(newId));
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
      return (f) ? f.bind(this)(this.figure, wmax, hmax) : super.computeEditDLims(id, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        'bbr' : fRectangleTriangle.bbrEdit,
        'ttl' : fRectangleTriangle.ttlEdit,
        'lbl' : fRectangleTriangle.lblEdit,
        'rtr' : fRectangleTriangle.rtrEdit
      };
      if (!this.enabled) {
        return this.figure.getCoords();
      }
      let f = editCoords[id];
      return (f) ? f(this.figure, dx, dy) : super.computeEditCoords(id, dx, dy);
    }

  } // RECTANGLE TRIANGLE GENERATOR

  /*
   * HEX EDITOR
   */

  var fHex = (function() {

    const F = Math.sqrt(3), R = F/2;

    // GRABBER CONSTRAINTS

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

    // GRABBER EDITIONS

    function SmEdit(ds, s, b, ls, lb) {
      return [s, s-ds, b - Math.round(ds*R/2), ls + ds, lb + Math.round(ds*R)];
    }
    function BsEdit(db, b, s, lb, ls) {
      return [b, b-db, s - Math.round(db/F), lb + db, ls + Math.round(db/R)];
    }

    function hrEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [coords.x, , coords.y, coords.width, coords.height] = SmEdit(dx, coords.x, coords.y, coords.width, coords.height);
      return coords;
    }
    function hlEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [, coords.x, coords.y, coords.width, coords.height] = SmEdit(-dx, coords.x, coords.y, coords.width, coords.height);
      return coords;
    }
    function htEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [, coords.y, coords.x, coords.height, coords.width] = BsEdit(-dy, coords.y, coords.x, coords.height, coords.width);
      return coords;
    }
    function hbEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [coords.y, , coords.x, coords.height, coords.width] = BsEdit(dy, coords.y, coords.x, coords.height, coords.width);
      return coords;
    }
    function vrEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [coords.x, , coords.y, coords.width, coords.height] = BsEdit(dx, coords.x, coords.y, coords.width, coords.height);
      return coords;
    }
    function vlEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [, coords.x, coords.y, coords.width, coords.height] = BsEdit(-dx, coords.x, coords.y, coords.width, coords.height);
      return coords;
    }
    function vtEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [, coords.y, coords.x, coords.height, coords.width] = SmEdit(-dy, coords.y, coords.x, coords.height, coords.width);
      return coords;
    }
    function vbEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [coords.y, , coords.x, coords.height, coords.width] = SmEdit(dy, coords.y, coords.x, coords.height, coords.width);
      return coords;
    }

    return {

      hrEditCns, hlEditCns, htEditCns, hbEditCns, vrEditCns, vlEditCns, vtEditCns, vbEditCns,
      hrEdit, hlEdit, htEdit, hbEdit, vrEdit, vlEdit, vtEdit, vbEdit

    };

  })(); // fHex

  class Hex extends Rectangle {
    
    constructor(fig) {
      super(fig);
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
      return (f) ? f(coords || this.figure.getCoords()) : super.gripCoords(id, coords);
    }

    createGrips() {
      if (this.figure.coords.width > this.figure.coords.height) {
        this.grips.push(new Grip('hl', this.figure.getDomParent(), this.gripCoords('hl'), this.gripCursor('hl')));
        this.grips.push(new Grip('hr', this.figure.getDomParent(), this.gripCoords('hr'), this.gripCursor('hr')));
        this.grips.push(new Grip('ht', this.figure.getDomParent(), this.gripCoords('ht'), this.gripCursor('ht')));
        this.grips.push(new Grip('hb', this.figure.getDomParent(), this.gripCoords('hb'), this.gripCursor('hb')));
      } else {
        this.grips.push(new Grip('vl', this.figure.getDomParent(), this.gripCoords('vl'), this.gripCursor('vl')));
        this.grips.push(new Grip('vr', this.figure.getDomParent(), this.gripCoords('vr'), this.gripCursor('vr')));
        this.grips.push(new Grip('vt', this.figure.getDomParent(), this.gripCoords('vt'), this.gripCursor('vt')));
        this.grips.push(new Grip('vb', this.figure.getDomParent(), this.gripCoords('vb'), this.gripCursor('vb')));
      }
    }

    rotateGrips(direction) {
      const rNext = {
          'hl' : 'vl', 'hr' : 'vr', 'ht' : 'vt', 'hb' : 'vb',  
          'vl' : 'hl', 'vr' : 'hr', 'vt' : 'ht', 'vb' : 'hb'  
      };
      let newCursor = this.gripCursor.bind(this);
      this.grips.forEach(function f(e) {
        let newId = rNext[e.getID()];
        e.setID(newId);
        e.setCursor(newCursor(newId));
      });
    }

    computeEditDLims(id, wmax, hmax) {
      const constraints = {
        'hl' : fHex.hlEditCns, 'hr' : fHex.hrEditCns, 'ht' : fHex.htEditCns, 'hb' : fHex.hbEditCns,
        'vl' : fHex.vlEditCns, 'vr' : fHex.vrEditCns, 'vt' : fHex.vtEditCns, 'vb' : fHex.vbEditCns
      };
      let f = constraints[id];
      return (f) ? f.bind(this)(this.figure, wmax, hmax) : super.computeEditDLims(id, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        'hl' : fHex.hlEdit, 'hr' : fHex.hrEdit, 'ht' : fHex.htEdit, 'hb' : fHex.hbEdit,
        'vl' : fHex.vlEdit, 'vr' : fHex.vrEdit, 'vt' : fHex.vtEdit, 'vb' : fHex.vbEdit
      };
      if (!this.enabled) {
        return this.figure.getCoords();
      }
      let f = editCoords[id];
      return (f) ? f(this.figure, dx, dy) : super.computeEditCoords(id, dx, dy);
    }

  }

  /*
   * EDITOR FACTORY
   */

  var factory = {
    'rectangle'   : Rectangle,
    'square'      : Square,
    'rhombus'     : Rhombus,
    'circleCtr'   : Circle,
    'circleDtr'   : CircleEx,
    'ellipse'     : Ellipse,
    'triangleIsc' : IsoscelesTriangle,
    'triangleEql' : EquilateralTriangle,
    'triangleRct' : RectangleTriangle,
    'hexRct'      : Hex
  };

  function create(fig) {
    if(!fig || null == fig) return null;
    let figEdit = factory[fig.getType()];
    if (!figEdit) {
      console.log('ERROR - Editor mode not handled');
      return null;
    }
    return new figEdit(fig);
  }

  /*
   * MULTI-SELECTOR
   */

  class MultiSelector {

    constructor() {
      this.selection = [];
    }

    set(fig) {
      let editor = this.find(fig);
      if (1 === this.selection.length && editor === this.selection[0]) {
        return;
      }
      editor = editor || create(fig);
      let id = this.selection.indexOf(editor);
      if (-1 === id) {
        this.empty();
        editor.markSelected();
        this.selection.push(editor);
        this.enableEdition();
      } else {
        if (0 !== id) {
          this.disableEdition();
          this.selection.splice(0, id);
        }
        this.selection.splice(1, this.selection.length - 1);
        this.enableEdition();
      }
    }

    toggle(fig) {
      let editor = this.find(fig) || create(fig);
      let id = this.selection.indexOf(editor);
      if (-1 === id) {
        this.disableEdition();
        editor.markSelected();
        this.selection.push(editor);
        this.enableEdition();
      } else {
        this.selection.splice(id, 1);
        editor.markUnselected();
        editor.remove();
        this.enableEdition();
      }
    }

/*
    remove(obj) {
      let id = this.selection.indexOf(obj);
      if (-1 === id) {
        return;
      }
      obj.markUnselected();
      this.selection.splice(id, 1);
    }
*/

    empty() {
      this.selection.forEach(function(e) { 
        e.markUnselected();
        e.remove();
      });
      this.selection.splice(0, this.selection.length);
    }

    has(fig) {
      let editor = this.find(fig);
      return (editor && null !== editor) ? true : false;
    }

    find(fig) {
      return this.selection.find(function(e) {
        return e.is(fig);
      });
    }

    get(id) {
      return this.selection[id];
    }
    
    length() {
      return this.selection.length;
    }

    enableEdition() {
      if (1 == this.selection.length) {
        this.selection[0].enableEdition();
      }
    }

    disableEdition() {
      if (1 == this.selection.length) {
        this.selection[0].disableEdition();
      }
    }

    forEach(f) {
      return this.selection.forEach(f);
    }

/*
    sort(f) {
      return this.selection.sort(f);
    }
*/

    reduce(f, i) {
      return this.selection.reduce(f, i);
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
      this.selector.forEach(function(e) {
        e.drawToOffset(d.dx, d.dy);
      });
    }

    end(pt) {
      let d = this.constrain(pt.x - this.org.x, pt.y - this.org.y);
      this.selector.forEach(function(e) {
        e.moveToOffset(d.dx, d.dy);
      });
      this.reset();
    }

    cancel() {
      this.selector.forEach(function(e) {
        e.drawToOffset(0, 0);
      });
      this.reset();
    }

    step(selector, dx, dy, wmax, hmax) {
      this.selector = selector;
      this.setLims(wmax, hmax);
      let d = this.constrain(dx, dy);
      this.selector.forEach(function(e) {
        e.moveToOffset(d.dx, d.dy);
      });
      this.reset();
    }

    reset() {
      this.org.x = this.org.y = 0;
      this.lims.dxmin = this.lims.dxmax = this.lims.dymin = this.lims.dymax = 0;
    }

    setLims(width, height) {
      let dlims = this.selector.reduce(function(r, e) {
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
      this.selection = null;
      this.id = '';
      this.org = { x : 0, y : 0 };
      this.lims = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 };
    }

    start(selection, target, pt, wmax, hmax) {
      this.selection = selection;
      this.id = this.selection.getGrip(target).getID();
      this.org.x = pt.x;
      this.org.y = pt.y;
      this.setLims(this.selection, this.id, wmax, hmax);
    }

    progress(pt) {
      let d = this.constrain(pt.x - this.org.x, pt.y - this.org.y);
      this.selection.drawModified(this.id, d.dx, d.dy);
    }

    end(pt) {
      let d = this.constrain(pt.x - this.org.x, pt.y - this.org.y);
      if(!this.selection.modify(this.id, d.dx, d.dy)) {
        alert('Invalid area dimensions!');
      }
      this.reset();
    }

    cancel() {
      this.selection.drawToOffset(0, 0);
      this.reset();
    }

    reset() {
      this.org.x = this.org.y = 0;
      this.lims.dxmin = this.lims.dxmax = this.lims.dymin = this.lims.dymax = 0;
      this.selection = null;
      this.id = '';
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

  return {
    directions, clsStatus, isGrip,
    MultiSelector, Mover, Editor
  };
  
})(); /* bitedit */
