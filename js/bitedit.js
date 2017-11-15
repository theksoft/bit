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
    RCLK  : 'clockwise',
    RACLK : 'anti-clockwise'
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

  // FIGURE EDITOR

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
        't' : fRectangle.tPos, 'b' : fRectangle.bPos, 'l' : fRectangle.lPos, 'r' : fRectangle.rPos,  
        'bbl' : fRectangle.blPos, 'bbr' : fRectangle.brPos,
        'ttl' : fRectangle.tlPos, 'ttr' : fRectangle.trPos,
        'ltl' : fRectangle.tlPos, 'lbl' : fRectangle.blPos,
        'rtr' : fRectangle.trPos, 'rbr' : fRectangle.brPos
      };
      return gripPosition[id](coords || this.figure.getCoords());
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
        't' : fRectangle.tEditCns, 'b' : fRectangle.bEditCns, 'l' : fRectangle.lEditCns, 'r' : fRectangle.rEditCns,  
        'bbl' : fIsoscelesTriangle.bblEditCns, 'bbr' : fIsoscelesTriangle.bbrEditCns,
        'ttl' : fIsoscelesTriangle.ttlEditCns, 'ttr' : fIsoscelesTriangle.ttrEditCns,
        'ltl' : fIsoscelesTriangle.ltlEditCns, 'lbl' : fIsoscelesTriangle.lblEditCns,
        'rtr' : fIsoscelesTriangle.rtrEditCns, 'rbr' : fIsoscelesTriangle.rbrEditCns
      };
      return constraints[id].bind(this)(this.figure, wmax, hmax);
    }

    computeEditCoords(id, dx, dy) {
      const editCoords = {
        't' : fRectangle.tEdit, 'b' : fRectangle.bEdit, 'l' : fRectangle.lEdit, 'r' : fRectangle.rEdit,  
        'bbl' : fIsoscelesTriangle.bblEdit, 'bbr' : fIsoscelesTriangle.bbrEdit,
        'ttl' : fIsoscelesTriangle.ttlEdit, 'ttr' : fIsoscelesTriangle.ttrEdit,
        'ltl' : fIsoscelesTriangle.ltlEdit, 'lbl' : fIsoscelesTriangle.lblEdit,
        'rtr' : fIsoscelesTriangle.rtrEdit, 'rbr' : fIsoscelesTriangle.rbrEdit
      };
      return (this.enabled) ? editCoords[id](this.figure, dx, dy) : this.figure.getCoords();
    }

  } // ISOSCELES TRIANGLE EDITOR

  /*
   * EDITOR FACTORY
   */

  var factory = {
    'rectangle'   : Rectangle,
    'square'      : Square,
    'rhombus'     : Rhombus,
    'triangleIsc' : IsoscelesTriangle
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
