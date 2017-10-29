
/**
 * Boardgame image tool (BIT)
 * Copyright 2017 Herve Retaureau
 */

var bhimc = (function() {
  'use strict';

  function $(s) { return utils.id(s); }

  /* Utility functions */
  var utils = (function() {

    const keyCodes = {
      ESC   : 27,
      DEL   : 46,
      LEFT  : 37,
      UP    : 38,
      RIGHT : 39,
      DOWN  : 40
    };
    
    const ns = {
      SVG : 'http://www.w3.org/2000/svg'
    };

    const clsNames = {
      DISABLED      : 'disabled',
      DRAGGING      : 'dragging',
      DRAWING       : 'drawing',
      SELECTED      : 'selected',
      TRACKING      : 'tracking',
      MOVING        : 'moving',
      EDITING       : 'editing',
      TRACKER       : 'tracker',
      RECTANGLE     : 'rectangle',
      SQUARE        : 'square',
      RHOMBUS       : 'rhombus'
      ISOSCELES     : 'isosceles',
      EQUILATERAL   : 'equilateral',
      RIGHTANGLE    : 'right-angle',
      HEX           : 'hex',
      GRIDSCOPE     : 'gridscope',
      GRIDBOND      : 'gridbond',
      HIGHLIGHTED   : 'highlighted',
      EXTENDED      : 'extended',
      GRABBER       : 'grabber'
    };

    const fgTypes = {
      NONE          : 'none',
      HEXDTR        : 'hexDtr',
      HEXRCT        : 'hexRct',
      RECTANGLE     : 'rectangle',
      SQUARE        : 'square',
      RHOMBUS       : 'rhombus',
      TRIANGLEEQL   : 'triangleEql',
      TRIANGLEISC   : 'triangleIsc',
      TRIANGLERCT   : 'triangleRct',
      ELLIPSE       : 'ellipse',
      CIRCLEDTR     : 'circleDtr',
      CIRCLECTR     : 'circleCtr',
      POLYGON       : 'polygon',
      HEXDTRGRID    : 'hexDtrGrid',
      RECTANGLEGRID : 'rectangleGrid',
      CIRCLEDTRGRID : 'circleDtrGrid'
    };

    const tilts = {
      DEFAULT : 0,
      BOTTOM  : 0,
      LEFT    : Math.PI / 2,
      TOP     : Math.PI,
      RIGHT   : -Math.PI / 2
    };

    const cursors = {
      EW    : 'ew-resize',
      NS    : 'ns-resize',
      NWSE  : 'nwse-resize',
      NESW  : 'nesw-resize',
      ALL   : 'move'
    };

    const directions = {
      RCLK  : 'clockwise',
      RACLK : 'anti-clockwise'
    };

    return {

      id : function(s) {
        return document.getElementById(s);
      },
      keyCodes,
      ns,
      clsNames,
      fgTypes,
      tilts,
      cursors,
      directions
    };
    
  })(); /* utils */

  /*
   * SELECTABLE
   */

  class Selectable {
    constructor() {
      if (this.constructor === Selectable.constructor) {
        console.log('ERROR - Selectable.constructor is abstract');
      }
    }
    markSelected()    { console.log('selectable.markSelected() default implementation!'); }
    markUnselected()  { console.log('selectable.markUnelected() default implementation!'); }
    enableEdition()   { console.log('selectable.enableEdition() default implementation!'); }
    disbaleEdition()  { console.log('selectable.disableEdition() default implementation!'); }
  }

  /*
   * MULTI-SELECTOR
   */

  class MultiSelector {

    constructor() {
      this.selection = [];
    }

    set(obj) {
      if (!obj || null == obj || (1 === this.selection.length && obj === this.selection[0])) {
        return;
      }
      let id = this.selection.indexOf(obj);
      if (-1 === id) {
        this.empty();
        obj.markSelected();
        this.selection.push(obj);
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

    toggle(obj) {
      if (!obj || null == obj) {
        return;
      }
      let id = this.selection.indexOf(obj);
      if (-1 === id) {
        this.disableEdition();
        obj.markSelected();
        this.selection.push(obj);
        this.enableEdition();
      } else {
        this.selection.splice(id, 1);
        obj.markUnselected();
        this.enableEdition();
      }
    }

    remove(obj) {
      let id = this.selection.indexOf(obj);
      if (-1 === id) {
        return;
      }
      obj.markUnselected();
      this.selection.splice(id, 1);
    }

    empty() {
      this.selection.forEach(function(e) { 
        e.markUnselected();
      });
      this.selection.splice(0, this.selection.length);
    }

    has(obj) {
      return (-1 != this.selection.indexOf(obj)) ? true : false;
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

    sort(f) {
      return this.selection.sort(f);
    }

    reduce(f, i) {
      return this.selection.reduce(f, i);
    }
  }

  /*
   * GRIP 
   */

  class Grip {

    constructor(parent, center, cursor) {
      this.parent = parent;
      this.cursor = cursor;
      this.dom = document.createElementNS(utils.ns.SVG, 'rect');
      this.dom.classList.add(this.className());
      this.dom.setAttribute('height', this.lims().size);
      this.dom.setAttribute('width', this.lims().size);
      this.dom.setAttribute('x', center.x + this.lims().offset);
      this.dom.setAttribute('y', center.y + this.lims().offset);
      parent.appendChild(this.dom);
    }

    reposition(center) {
      this.dom.setAttribute('x', center.x + this.lims().offset);
      this.dom.setAttribute('y', center.y + this.lims().offset);
    }

    addCursor() {
      this.dom.classList.add(this.cursor);
    }

    removeCursor() {
      this.dom.classList.remove(this.cursor);
    }

    remove() {
      this.parent.removeChild(this.dom);
      this.parent = this.dom = null;
    }

    className() {
      return utils.clsNames.GRABBER;
    }

    lims() {
      const sz = 5;
      return {
        size : sz,
        offset : -Math.ceil(sz/2)
      };
    }

  }

  /*
   * GRASP 
   */

  class Grasp {

    constructor(grip, bond, editors) {
      this.grip = grip;
      this.bond = bond;
      this.editors = editors;
      this.enabled = false;
    }

    isEqual(obj) {
      return (this.grip.dom === obj) ? true : false;
    }

    isEnabled() {
      return this.enabled;
    }

    enable() {
      if (!this.enabled) {
        this.grip.addCursor();
        this.enabled = true;
      }
    }

    disable() {
      if (this.enabled) {
        this.grip.removeCursor();
        this.enabled = false;
      }
    }

    reposition(coords) {
      let c = coords || this.bond.getCoords();
      this.grip.reposition(this.editors.pos(c))
    }

    getConstraints(width, height) {
      return this.editors.cns(this.bond, width, height);
    }

    editCoords(dx, dy) {
      return (this.enabled) ? this.editors.edt(this.bond, dx, dy) : this.bond.getCoords();
    }

    remove() {
      this.grip.remove();
      this.bond = this.grip = this.editors = 0;
    }

  }

  /*
   * FIGURE
   */

  class Figure extends Selectable {

    constructor(type, parent) {
      super();
      this.type = type;
      this.parent = parent;
      this.dom = null;
      this.g = document.createElementNS(utils.ns.SVG, 'g');
      this.parent.appendChild(this.g);
      this.grabbers = [];
      this.grid = null;
      this.bonds = [];
      if (this.constructor == Figure.constructor) {
        console.log('ERROR - Selectable.constructor is abstract');
      }
    }

    drawStart(point) {
      console.log('drawStart() not defined: ' + point);
    }

    drawMove(point) {
      console.log('drawMove() not defined: ' + point);
    }

    drawEnd(point) {
      console.log('drawEnd() not defined: ' + point);
      return 'error';
    }
    
    drawCancel() {
      this.remove();
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
      return this;
    }

    moveCoords(dx, dy) {
      console.log('moveCoords() not defined');
    }

    rotateStepCoords(direction, wmax, hmax) {
      console.log('rotateStepCoords() not defined');
    }

    redraw(coords) {
      let c = coords || this.getCoords();
      this.draw(c);
      this.grabbers.forEach(function(e) {
        e.reposition(coords);
      });
    }

    check(dom) {
      return (dom === this.dom) ? true : false;
    }

    isGrid() {
      return (null != this.grid) ? true : false;
    }

    hasBonds() {
      return (this.bonds.length > 0) ? true : false;
    }

    getBonds() {
      return this.bonds.slice();
    }

    removeBonds() {
      console.log('removeBonds() not defined');
    }

    remove() {
      this.removeBonds();
      this.destroyGrabbers();
      this.parent.removeChild(this.g);
      this.parent = this.g = this.dom = null;
    }

    dynamicMove(dx, dy) {
      this.redraw(this.moveCoords(dx, dy));
    }

    move(dx, dy) {
      this.setCoords(this.moveCoords(dx, dy))
      .redraw();
    }

    dynamicEdit(obj, dx, dy) {
      let grasp = this.getGrasp(obj);
      if (grasp) {
        this.redraw(grasp.editCoords(dx, dy));
      }
    }

    canEdit(obj) {
      let grasp = this.getGrasp(obj);
      return (grasp) && grasp.isEnabled();
    }

    edit(obj, dx, dy) {
      let grasp = this.getGrasp(obj);
      if (grasp) {
        let coords = grasp.editCoords(dx, dy);
        if (this.checkCoords(coords)) {
          this.setCoords(coords);
          this.redraw();
          return true;
        }
      }
      this.redraw();
      return false;
    }
    
    moveDLims(wmax, hmax) {
      console.log('moveDLims() not defined - ' + wmax + 'x' + hmax);
      return { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 };
    }

    editDLims(obj, wmax, hmax) {
      let grasp = this.getGrasp(obj);
      if (grasp) {
        return grasp.getConstraints(wmax, hmax);
      }
      return { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 };
    }

    rotateStep(direction, wmax, hmax) {
      let coords = this.rotateStepCoords(direction, wmax, hmax);
      if (null != coords) {
        this.destroyGrabbers();
        this.setCoords(coords);
        this.createGrabbers();
        this.redraw();
        this.enableEdition();
        return true;
      }
      return false;
    }

    markSelected() {
      if (this.dom) {
        this.dom.classList.add(utils.clsNames.SELECTED);
        this.createGrabbers();
        this.bonds.forEach(function(e) {
          e.dom.classList.add(utils.clsNames.HIGHLIGHTED);
        });
      }
    }

    markUnselected() {
      if (this.dom) {
        this.dom.classList.remove(utils.clsNames.SELECTED);
        this.destroyGrabbers();
        this.bonds.forEach(function(e) {
          e.dom.classList.remove(utils.clsNames.HIGHLIGHTED);
        });
      }
    }

    getGrasp(obj) {
      return this.grabbers.find(function(e) {
        return (e.isEqual(obj));
      });
    }

    createGrabbers() {
      console.log('addGrabbers() not defined');
    }

    destroyGrabbers() {
      this.grabbers.forEach(function(e) {
        e.remove();
      });
      this.grabbers.splice(0, this.grabbers.length);
    }

    enableEdition() {
      this.grabbers.forEach(function(e) {
        e.enable();
      });
    }

    disableEdition() {
      this.grabbers.forEach(function(e) {
        e.disable();
      });
    }

    within(coords) {
      console.log('within() not defined');
      return false;
    }

  }

  /*
   * RECTANGLE EDITORS
   */

  var rctEd = (function() {
    
    // GRABBER POSITIONS

    function TPos(coords)   { return { x : Math.round(coords.x + coords.width/2), y : coords.y }; }
    function BPos(coords)   { return { x : Math.round(coords.x + coords.width/2), y : coords.y + coords.height }; }
    function LPos(coords)   { return { x : coords.x, y : Math.round(coords.y + coords.height/2) }; }
    function RPos(coords)   { return { x : coords.x + coords.width, y : Math.round(coords.y + coords.height/2) }; }
    function TLPos(coords)  { return { x : coords.x, y : coords.y }; }
    function TRPos(coords)  { return { x : coords.x + coords.width, y : coords.y }; }
    function BLPos(coords)  { return { x : coords.x, y : coords.y + coords.height }; }
    function BRPos(coords)  { return { x : coords.x + coords.width, y : coords.y + coords.height }; }

    // GRABBER CONSTRAINTS

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

    function TEditCns(obj, wmax, hmax)  { return editCns(obj.coords, wmax, hmax, null, topCns); }
    function BEditCns(obj, wmax, hmax)  { return editCns(obj.coords, wmax, hmax, null, bottomCns); }
    function LEditCns(obj, wmax, hmax)  { return editCns(obj.coords, wmax, hmax, leftCns, null); }
    function REditCns(obj, wmax, hmax)  { return editCns(obj.coords, wmax, hmax, rightCns, null); }
    function TLEditCns(obj, wmax, hmax) { return editCns(obj.coords, wmax, hmax, leftCns, topCns); }
    function TREditCns(obj, wmax, hmax) { return editCns(obj.coords, wmax, hmax, rightCns, topCns); }
    function BLEditCns(obj, wmax, hmax) { return editCns(obj.coords, wmax, hmax, leftCns, bottomCns); }
    function BREditCns(obj, wmax, hmax) { return editCns(obj.coords, wmax, hmax, rightCns, bottomCns); }

    // GRABBER EDITION

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

    function TEdit(obj, dx, dy)   { return edit(obj, dx, dy, null, topEdit); }
    function BEdit(obj, dx, dy)   { return edit(obj, dx, dy, null, bottomEdit); }
    function LEdit(obj, dx, dy)   { return edit(obj, dx, dy, leftEdit, null); }
    function REdit(obj, dx, dy)   { return edit(obj, dx, dy, rightEdit, null); }
    function TLEdit(obj, dx, dy)  { return edit(obj, dx, dy, leftEdit, topEdit); }
    function TREdit(obj, dx, dy)  { return edit(obj, dx, dy, rightEdit, topEdit); }
    function BLEdit(obj, dx, dy)  { return edit(obj, dx, dy, leftEdit, bottomEdit); }
    function BREdit(obj, dx, dy)  { return edit(obj, dx, dy, rightEdit, bottomEdit); }

    return {

      TPos, BPos, LPos, RPos, TLPos, TRPos, BLPos, BRPos,
      TEditCns, BEditCns, LEditCns, REditCns, TLEditCns, TREditCns, BLEditCns, BREditCns,
      TEdit, BEdit, LEdit, REdit, TLEdit, TREdit, BLEdit, BREdit,

      t   : { pos : TPos, cns : TEditCns, edt : TEdit },
      b   : { pos : BPos, cns : BEditCns, edt : BEdit },
      l   : { pos : LPos, cns : LEditCns, edt : LEdit },
      r   : { pos : RPos, cns : REditCns, edt : REdit },
      tl  : { pos : TLPos, cns : TLEditCns, edt : TLEdit },
      tr  : { pos : TRPos, cns : TREditCns, edt : TREdit },
      bl  : { pos : BLPos, cns : BLEditCns, edt : BLEdit },
      br  : { pos : BRPos, cns : BREditCns, edt : BREdit }

    };
    
  })(); // rctEd

  /*
   * RECTANGLE
   */

  class Rectangle extends Figure {

    constructor(parent, alt) {
      super(utils.fgTypes.RECTANGLE, parent);
      this.start = { x : 0, y : 0 };
      this.coords = { x : 0, y : 0, width : 0, height : 0, tilt : utils.tilts.DEFAULT };
      this.dom = document.createElementNS(utils.ns.SVG, 'rect');
      this.g.appendChild(this.dom);
    }

    drawStart(point) {
      this.coords.x = this.start.x = point.x;
      this.coords.y = this.start.y = point.y;
      this.coords.width = 0;
      this.coords.height = 0;
      this.redraw();
    }

    drawMove(point) {
      this.setCoords(this.computeCoords(point)).redraw();
    }

    drawEnd(point) {
      this.setCoords(this.computeCoords(point)).redraw();
      if (0 == this.coords.width || 0 == this.coords.height) {
        this.drawCancel();
        return 'error';
      }
      return 'done';
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
      return this;
    }

    checkCoords(coords) {
      return (coords.width > 0 && coords.height > 0) ? true : false;
    }

    computeCoords(point) {
      let width = point.x - this.start.x;
      let height = point.y - this.start.y;
      return {
        x : (width < 0) ? point.x : this.start.x,
        y : (height < 0) ? point.y : this.start.y,
        width : (width < 0) ? -width : width,
        height : (height < 0) ? -height : height,
        tilt : this.coords.tilt
      };
    }

    moveCoords(dx, dy) {
      let rtn = Object.create(this.coords);
      rtn.x = this.coords.x + dx;
      rtn.y = this.coords.y + dy;
      return rtn;
    }

    rotateStepCoords(direction, wmax, hmax) {
      let rtn = Object.create(this.coords);
      let w2 = Math.round(this.coords.width / 2), h2 = Math.round(this.coords.height / 2)
      rtn.x = this.coords.x + w2 - h2;
      rtn.y = this.coords.y + h2 - w2;
      rtn.width = this.coords.height;
      rtn.height = this.coords.width;
      if (rtn.x >= 0 && rtn.x + this.coords.height <= wmax &&
          rtn.y >= 0 && rtn.y + this.coords.width <= hmax) {
        return rtn;
      }
      return null;
    }

    draw(coords) {
      let c = coords || this.coords;
      this.dom.setAttribute('x', c.x);
      this.dom.setAttribute('y', c.y);
      this.dom.setAttribute('width', c.width);
      this.dom.setAttribute('height', c.height);
    }

    moveDLims(wmax, hmax) {
      return {
        dxmin : -this.coords.x,
        dxmax : wmax - ( this.coords.x + this.coords.width ),
        dymin : -this.coords.y,
        dymax : hmax - (this.coords.y + this.coords.height)
      };
    }

    createGrabbers() {
      this.grabbers.push(new Grasp(new Grip(this.g, rctEd.t.pos(this.coords), utils.cursors.NS), this, rctEd.t));
      this.grabbers.push(new Grasp(new Grip(this.g, rctEd.b.pos(this.coords), utils.cursors.NS), this, rctEd.b));
      this.grabbers.push(new Grasp(new Grip(this.g, rctEd.l.pos(this.coords), utils.cursors.EW), this, rctEd.l));
      this.grabbers.push(new Grasp(new Grip(this.g, rctEd.r.pos(this.coords), utils.cursors.EW), this, rctEd.r));
      this.grabbers.push(new Grasp(new Grip(this.g, rctEd.tl.pos(this.coords), utils.cursors.NWSE), this, rctEd.tl));
      this.grabbers.push(new Grasp(new Grip(this.g, rctEd.tr.pos(this.coords), utils.cursors.NESW), this, rctEd.tr));
      this.grabbers.push(new Grasp(new Grip(this.g, rctEd.bl.pos(this.coords), utils.cursors.NESW), this, rctEd.bl));
      this.grabbers.push(new Grasp(new Grip(this.g, rctEd.br.pos(this.coords), utils.cursors.NWSE), this, rctEd.br));
    }

    within(coords) {
      if (this.coords.x < coords.x) return false;
      if (this.coords.x + this.coords.width > coords.x + coords.width) return false;
      if (this.coords.y < coords.y) return false;
      if (this.coords.y + this.coords.height > coords.y + coords.height) return false;
      return true;
    }

  } // Rectangle

  /*
   * SQUARE 
   */

  var sqrEd = (function() {

    // GRABBER EDITION

    function TLEdit(obj, dx, dy) {
      let d = (dx > dy) ? dx : dy;
      return rctEd.TLEdit(obj, d, d);
    }
    function TREdit(obj, dx, dy) {
      let d = (-dx > dy) ? -dx : dy;
      return rctEd.TREdit(obj, -d, d);
    }
    function BLEdit(obj, dx, dy) {
      let d = (dx > -dy) ? dx : -dy;
      return rctEd.BLEdit(obj, d, -d);
    }
    function BREdit(obj, dx, dy) {
      let d = (dx > dy) ? dy : dx;
      return rctEd.BREdit(obj, d, d);
    }
   
    return {

      TLEdit, TREdit, BLEdit, BREdit,
      
      tl : { pos : rctEd.TLPos, cns : rctEd.TLEditCns, edt : TLEdit },
      tr : { pos : rctEd.TRPos, cns : rctEd.TREditCns, edt : TREdit },
      bl : { pos : rctEd.BLPos, cns : rctEd.BLEditCns, edt : BLEdit },
      br : { pos : rctEd.BRPos, cns : rctEd.BREditCns, edt : BREdit }

    };

  })(); // sqrEd

  class Square extends Rectangle {

    constructor(parent, alt) {
      super(parent, alt);
      this.type = utils.fgTypes.SQUARE;
      this.dom.classList.add(utils.clsNames.SQUARE);
    }

    computeCoords(point) {
      let width = point.x - this.start.x;
      let height = point.y - this.start.y;
      let coords = super.computeCoords(point);
      let delta = coords.width - coords.height;
      if (delta > 0) {
        coords.width = coords.height;
        if (point.x < this.start.x) {
          coords.x = this.start.x - coords.width;
        }
      } else if (delta < 0){
        coords.height = coords.width;
        if (point.y < this.start.y) {
          coords.y = this.start.y - coords.height;
        }
      }
      return coords;
    }

    rotateStepCoords(direction, wmax, hmax) {
      return Object.create(this.coords);
    }

    createGrabbers() {
      this.grabbers.push(new Grasp(new Grip(this.g, sqrEd.tl.pos(this.coords), utils.cursors.NWSE), this, sqrEd.tl));
      this.grabbers.push(new Grasp(new Grip(this.g, sqrEd.tr.pos(this.coords), utils.cursors.NESW), this, sqrEd.tr));
      this.grabbers.push(new Grasp(new Grip(this.g, sqrEd.bl.pos(this.coords), utils.cursors.NESW), this, sqrEd.bl));
      this.grabbers.push(new Grasp(new Grip(this.g, sqrEd.br.pos(this.coords), utils.cursors.NWSE), this, sqrEd.br));
    }

  } // Square

  /*
   * RHOMBUS 
   */

  var rhbEd = (function() {

    return {
      l : rctEd.l, r : rctEd.r, t : rctEd.t, b : rctEd.b
    };

  })(); // rhbEd

  class Rhombus extends Rectangle {

    constructor(parent, alt) {
      super(parent, alt);
      this.type = utils.fgTypes.RHOMBUS;
      this.tracker = this.dom;
      this.tracker.classList.add(utils.clsNames.TRACKER);
      this.dom = document.createElementNS(utils.ns.SVG, 'polygon');
      this.dom.classList.add(utils.clsNames.RHOMBUS);
      this.g.appendChild(this.dom);
    }

    drawEnd(point) {
      let rtn = super.drawEnd(point);
      if ('done' === rtn) {  // If canceled, whole group has already been removed including tracker 
        this.g.removeChild(this.tracker);
      }
      this.tracker = null;
      return rtn;
    }

    draw(coords) {
      let c = coords || this.coords;
      // Position tracker if it exists
      if (this.tracker != null) {
        this.tracker.setAttribute('x', c.x);
        this.tracker.setAttribute('y', c.y);
        this.tracker.setAttribute('width', c.width);
        this.tracker.setAttribute('height', c.height);
      }
      // Define polygon
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

    createGrabbers() {
      this.grabbers.push(new Grasp(new Grip(this.g, rhbEd.l.pos(this.coords), utils.cursors.EW), this, rhbEd.l));
      this.grabbers.push(new Grasp(new Grip(this.g, rhbEd.r.pos(this.coords), utils.cursors.EW), this, rhbEd.r));
      this.grabbers.push(new Grasp(new Grip(this.g, rhbEd.t.pos(this.coords), utils.cursors.NS), this, rhbEd.t));
      this.grabbers.push(new Grasp(new Grip(this.g, rhbEd.b.pos(this.coords), utils.cursors.NS), this, rhbEd.b));
    }

  } // Rhombus

  /*
   * ISOSCELES TRIANGLE
   */

  var trisEd = (function() {

    // GRABBER CONSTRAINTS

    function leftCns(lr, coords, lims)    { lr.dxmin = -Math.min(-lims.dxmin, lims.dxmax);  lr.dxmax = Math.round(coords.width/2); };
    function rightCns(lr, coords, lims)   { lr.dxmin = -Math.round(coords.width/2);         lr.dxmax = Math.min(-lims.dxmin, lims.dxmax); };
    function topCns(lr, coords, lims)     { lr.dymin = -Math.min(-lims.dymin, lims.dymax);  lr.dymax = Math.round(coords.height/2); };
    function bottomCns(lr, coords, lims)  { lr.dymin = -Math.round(coords.height/2);        lr.dymax = Math.min(-lims.dymin, lims.dymax); };
    function editCns(obj, wmax, hmax, fBase, fAdjust) {
      let rtn = fBase(obj, wmax, hmax);
      let lims = obj.moveDLims(wmax, hmax);
      fAdjust(rtn, obj.coords, lims);
      return rtn;
    }

    function TTLEditCns(obj, wmax, hmax) { return editCns(obj, wmax, hmax, rctEd.TLEditCns, leftCns); }
    function TTREditCns(obj, wmax, hmax) { return editCns(obj, wmax, hmax, rctEd.TREditCns, rightCns); }
    function BBLEditCns(obj, wmax, hmax) { return editCns(obj, wmax, hmax, rctEd.BLEditCns, leftCns); }
    function BBREditCns(obj, wmax, hmax) { return editCns(obj, wmax, hmax, rctEd.BREditCns, rightCns); }
    function LTLEditCns(obj, wmax, hmax) { return editCns(obj, wmax, hmax, rctEd.TLEditCns, topCns); }
    function LBLEditCns(obj, wmax, hmax) { return editCns(obj, wmax, hmax, rctEd.BLEditCns, bottomCns); }
    function RTREditCns(obj, wmax, hmax) { return editCns(obj, wmax, hmax, rctEd.TREditCns, topCns); }
    function RBREditCns(obj, wmax, hmax) { return editCns(obj, wmax, hmax, rctEd.BREditCns, bottomCns); }

    // GRABBER EDITION

    function leftAdjust(dx, dy, coords)   { coords.width -= dx; }
    function rightAdjust(dx, dy, coords)  { coords.x -= dx; coords.width += dx; }
    function topAdjust(dx, dy, coords)    { coords.height -= dy; }
    function bottomAdjust(dx, dy, coords) { coords.y -= dy; coords.height += dy; }
    function edit(obj, dx, dy, fBase, fAdjust) {
      let coords = fBase(obj, dx, dy);
      fAdjust(dx, dy, coords);
      return coords;
    }

    function TTLEdit(obj, dx, dy) { return edit(obj, dx, dy, rctEd.TLEdit, leftAdjust); }
    function TTREdit(obj, dx, dy) { return edit(obj, dx, dy, rctEd.TREdit, rightAdjust); }
    function BBLEdit(obj, dx, dy) { return edit(obj, dx, dy, rctEd.BLEdit, leftAdjust); }
    function BBREdit(obj, dx, dy) { return edit(obj, dx, dy, rctEd.BREdit, rightAdjust); }
    function LTLEdit(obj, dx, dy) { return edit(obj, dx, dy, rctEd.TLEdit, topAdjust); }
    function LBLEdit(obj, dx, dy) { return edit(obj, dx, dy, rctEd.BLEdit, bottomAdjust); }
    function RTREdit(obj, dx, dy) { return edit(obj, dx, dy, rctEd.TREdit, topAdjust); }
    function RBREdit(obj, dx, dy) { return edit(obj, dx, dy, rctEd.BREdit, bottomAdjust); }

    return {

      TTLEditCns, TTREditCns, BBLEditCns, BBREditCns, LTLEditCns, LBLEditCns, RTREditCns, RBREditCns,
      TTLEdit, TTREdit, BBLEdit, BBREdit, LTLEdit, LBLEdit, RTREdit, RBREdit,

      t : rctEd.t, b : rctEd.b, l : rctEd.l, r : rctEd.r,
      bbl : { pos : rctEd.BLPos, cns : BBLEditCns, edt : BBLEdit },
      bbr : { pos : rctEd.BRPos, cns : BBREditCns, edt : BBREdit },
      ttl : { pos : rctEd.TLPos, cns : TTLEditCns, edt : TTLEdit },
      ttr : { pos : rctEd.TRPos, cns : TTREditCns, edt : TTREdit },
      ltl : { pos : rctEd.TLPos, cns : LTLEditCns, edt : LTLEdit },
      lbl : { pos : rctEd.BLPos, cns : LBLEditCns, edt : LBLEdit },
      rtr : { pos : rctEd.TRPos, cns : RTREditCns, edt : RTREdit },
      rbr : { pos : rctEd.BRPos, cns : RBREditCns, edt : RBREdit }
      
    };

  })(); // trisEd

  class IsoscelesTriangle extends Rectangle {

    constructor(parent, alt) {
      super(parent, alt);
      if(alt) {
        // Tilt represent where lies the base
        this.coords.tilt = utils.tilts.LEFT;
      }
      this.type = utils.fgTypes.TRIANGLEISC;
      this.tracker = this.dom;
      this.tracker.classList.add(utils.clsNames.TRACKER);
      this.dom = document.createElementNS(utils.ns.SVG, 'polygon');
      this.dom.classList.add(utils.clsNames.ISOSCELES);
      this.g.appendChild(this.dom);
    }
    
    drawEnd(point) {
      let rtn = super.drawEnd(point);
      if ('done' === rtn) {  // If canceled, whole group has already been removed including tracker 
        this.g.removeChild(this.tracker);
      }
      this.tracker = null;
      return rtn;
    }

    computeCoords(point) {
      let coords = super.computeCoords(point);
      switch(coords.tilt) {
      case utils.tilts.TOP:
      case utils.tilts.BOTTOM:
        coords.tilt = (point.y < this.start.y) ? utils.tilts.BOTTOM : utils.tilts.TOP;
        break;
      case utils.tilts.LEFT:
      case utils.tilts.RIGHT:
        coords.tilt = (point.x < this.start.x) ? utils.tilts.RIGHT : utils.tilts.LEFT;
        break;
      }
      return coords;
    }

    draw(coords) {
      let c = coords || this.coords;
      // Position tracker if it exists
      if (this.tracker != null) {
        this.tracker.setAttribute('x', c.x);
        this.tracker.setAttribute('y', c.y);
        this.tracker.setAttribute('width', c.width);
        this.tracker.setAttribute('height', c.height);
      }
      // Define polygon
      let lx = c.x, rx = c.x + c.width, cx = c.x + Math.round(c.width/2),  
          ty = c.y, by = c.y + c.height, cy = c.y + Math.round(c.height/2);
      let points = [];
      switch(c.tilt) {
      case utils.tilts.BOTTOM:
        points.push({ x : lx, y : by });
        points.push({ x : rx, y : by });
        points.push({ x : cx, y : ty });
        break;
      case utils.tilts.TOP:
        points.push({ x : lx, y : ty });
        points.push({ x : rx, y : ty });
        points.push({ x : cx, y : by });
        break;
      case utils.tilts.LEFT:
        points.push({ x : lx, y : ty });
        points.push({ x : lx, y : by });
        points.push({ x : rx, y : cy });
        break;
      case utils.tilts.RIGHT:
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

    rotateStepCoords(direction, wmax, hmax) {
      let rtn = super.rotateStepCoords(direction, wmax, hmax);
      if (null != rtn) {
        switch (rtn.tilt) {
        case utils.tilts.BOTTOM:
          rtn.tilt = (utils.directions.RCLK === direction) ? utils.tilts.LEFT : utils.tilts.RIGHT;
          break;
        case utils.tilts.TOP:
          rtn.tilt = (utils.directions.RCLK === direction) ? utils.tilts.RIGHT : utils.tilts.LEFT;
          break;
        case utils.tilts.LEFT:
          rtn.tilt = (utils.directions.RCLK === direction) ? utils.tilts.TOP : utils.tilts.BOTTOM;
          break;
        case utils.tilts.RIGHT:
          rtn.tilt = (utils.directions.RCLK === direction) ? utils.tilts.BOTTOM : utils.tilts.TOP;
          break;
        default:
          rtn = null;
        }
      }
      return rtn;
    }

    createGrabbers() {

      switch (this.coords.tilt) {
      case utils.tilts.BOTTOM:
        this.grabbers.push(new Grasp(new Grip(this.g, trisEd.t.pos(this.coords), utils.cursors.NS), this, trisEd.t));
        this.grabbers.push(new Grasp(new Grip(this.g, trisEd.bbl.pos(this.coords), utils.cursors.ALL), this, trisEd.bbl));
        this.grabbers.push(new Grasp(new Grip(this.g, trisEd.bbr.pos(this.coords), utils.cursors.ALL), this, trisEd.bbr));
        break;
      case utils.tilts.TOP:
        this.grabbers.push(new Grasp(new Grip(this.g, trisEd.b.pos(this.coords), utils.cursors.NS), this, trisEd.b));
        this.grabbers.push(new Grasp(new Grip(this.g, trisEd.ttl.pos(this.coords), utils.cursors.ALL), this, trisEd.ttl));
        this.grabbers.push(new Grasp(new Grip(this.g, trisEd.ttr.pos(this.coords), utils.cursors.ALL), this, trisEd.ttr));
        break;
      case utils.tilts.LEFT:
        this.grabbers.push(new Grasp(new Grip(this.g, trisEd.r.pos(this.coords), utils.cursors.EW), this, trisEd.r));
        this.grabbers.push(new Grasp(new Grip(this.g, trisEd.ltl.pos(this.coords), utils.cursors.ALL), this, trisEd.ltl));
        this.grabbers.push(new Grasp(new Grip(this.g, trisEd.lbl.pos(this.coords), utils.cursors.ALL), this, trisEd.lbl));
        break;
      case utils.tilts.RIGHT:
        this.grabbers.push(new Grasp(new Grip(this.g, trisEd.l.pos(this.coords), utils.cursors.EW), this, trisEd.l));
        this.grabbers.push(new Grasp(new Grip(this.g, trisEd.rtr.pos(this.coords), utils.cursors.ALL), this, trisEd.rtr));
        this.grabbers.push(new Grasp(new Grip(this.g, trisEd.rbr.pos(this.coords), utils.cursors.ALL), this, trisEd.rbr));
        break;
      default:
      }
    }

  } // IsoscelesTriangle

  /*
   * EQUILATERAL TRIANGLE
   */

  var treqEd = (function() {
    
    const F = Math.sqrt(3);
    const R = F/2;

    // GRABBER CONSTRAINTS

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

    function LEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = obj.moveDLims(wmax, hmax);
      rtn.dxmin = -sideCompute(-mlims.dxmin, mlims.dxmax, -mlims.dymin, mlims.dymax);
      rtn.dxmax = Math.round(obj.coords.width * 2/3);
      return rtn;
    }
    
    function REditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = obj.moveDLims(wmax, hmax);
      rtn.dxmin = -Math.round(obj.coords.width * 2/3);
      rtn.dxmax = sideCompute(mlims.dxmax, -mlims.dxmin, -mlims.dymin, mlims.dymax);
      return rtn;
    }
    
    function TEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = obj.moveDLims(wmax, hmax);
      rtn.dymin = -sideCompute(-mlims.dymin, mlims.dymax, -mlims.dxmin, mlims.dxmax);
      rtn.dymax = Math.round(obj.coords.height * 2/3);
      return rtn;
    }
    
    function BEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = obj.moveDLims(wmax, hmax);
      rtn.dymin = -Math.round(obj.coords.height * 2/3);
      rtn.dymax = sideCompute(mlims.dymax, -mlims.dymin, -mlims.dxmin, mlims.dxmax);
      return rtn;
    }
    
    function LTLEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = obj.moveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(-mlims.dxmin, mlims.dxmax, -mlims.dymin, mlims.dymax, obj.coords.width, obj.coords.height);
      [rtn.dxmin, rtn.dxmax, rtn.dymin, rtn.dymax] = cornerAssign(mmv, mmf, mov, mof);
      return rtn;
    }

    function LBLEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = obj.moveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(-mlims.dxmin, mlims.dxmax, -mlims.dymin, mlims.dymax, obj.coords.width, obj.coords.height);
      [rtn.dxmin, rtn.dxmax, rtn.dymin, rtn.dymax] = cornerAssign(mmv, mmf, mof, mov);
      return rtn;
    }

    function RTREditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = obj.moveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(mlims.dxmax, -mlims.dxmin, -mlims.dymin, mlims.dymax, obj.coords.width, obj.coords.height);
      [rtn.dxmin, rtn.dxmax, rtn.dymin, rtn.dymax] = cornerAssign(mmf, mmv, mov, mof);
      return rtn;
    }

    function RBREditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = obj.moveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(mlims.dxmax, -mlims.dxmin, -mlims.dymin, mlims.dymax, obj.coords.width, obj.coords.height);
      [rtn.dxmin, rtn.dxmax, rtn.dymin, rtn.dymax] = cornerAssign(mmf, mmv, mof, mov);
      return rtn;
    }

    function TTLEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = obj.moveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(-mlims.dymin, mlims.dymax, -mlims.dxmin, mlims.dxmax, obj.coords.height, obj.coords.width);
      [rtn.dymin, rtn.dymax, rtn.dxmin, rtn.dxmax] = cornerAssign(mmv, mmf, mov, mof);
      return rtn;
    }

    function TTREditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = obj.moveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(-mlims.dymin, mlims.dymax, -mlims.dxmin, mlims.dxmax, obj.coords.height, obj.coords.width);
      [rtn.dymin, rtn.dymax, rtn.dxmin, rtn.dxmax] = cornerAssign(mmv, mmf, mof, mov);
      return rtn;
    }

    function BBLEditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = obj.moveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(mlims.dymax, -mlims.dymin, -mlims.dxmin, mlims.dxmax, obj.coords.height, obj.coords.width);
      [rtn.dymin, rtn.dymax, rtn.dxmin, rtn.dxmax] = cornerAssign(mmf, mmv, mov, mof);
      return rtn;
    }

    function BBREditCns(obj, wmax, hmax) {
      let rtn = { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
          mlims = obj.moveDLims(wmax, hmax),
          mmv = 0, mmf = 0, mov = 0, mof = 0;
      [mmv, mov, mmf, mof] = cornerCompute(mlims.dymax, -mlims.dymin, -mlims.dxmin, mlims.dxmax, obj.coords.height, obj.coords.width);
      [rtn.dymin, rtn.dymax, rtn.dxmin, rtn.dxmax] = cornerAssign(mmf, mmv, mof, mov);
      return rtn;
    }

    // GRABBER EDITION

    let sideEdit = function(dm, pm, po, lm, lo) {
      let dpm = Math.round(dm/2), dpo = Math.round(dm*R);
      return [pm-dm, pm-dpm, po-dpo, lm+dm+dpm, lo+2*dpo];
    };

    let cornerEdit = function(ds, db, ps, pb, ls, lb) {
      let dps = Math.min(ds, Math.round(db/F));
      let dpb = Math.round(dps*F);
      return [ps-2*dps, ps-dps, pb-dpb, ls+3*dps, lb+2*dpb]; // d = 2dps = sqrt(dps^2 + dpb^2) 
    };

    function LEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [rtn.x, , rtn.y, rtn.width, rtn.height] = sideEdit(-dx, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function REdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [, rtn.x, rtn.y, rtn.width, rtn.height] = sideEdit(dx, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function TEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [rtn.y, , rtn.x, rtn.height, rtn.width] = sideEdit(-dy, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function BEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [, rtn.y, rtn.x, rtn.height, rtn.width] = sideEdit(dy, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function LTLEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [, rtn.x, rtn.y, rtn.width, rtn.height] = cornerEdit(-dx, -dy, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function LBLEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [, rtn.x, rtn.y, rtn.width, rtn.height] = cornerEdit(-dx, dy, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function RTREdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [rtn.x, , rtn.y, rtn.width, rtn.height] = cornerEdit(dx, -dy, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function RBREdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [rtn.x, , rtn.y, rtn.width, rtn.height] = cornerEdit(dx, dy, rtn.x, rtn.y, rtn.width, rtn.height);
      return rtn;
    }

    function TTLEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [, rtn.y, rtn.x, rtn.height, rtn.width] = cornerEdit(-dy, -dx, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function TTREdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [, rtn.y, rtn.x, rtn.height, rtn.width] = cornerEdit(-dy, dx, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function BBLEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [rtn.y, , rtn.x, rtn.height, rtn.width] = cornerEdit(dy, -dx, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    function BBREdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [rtn.y, , rtn.x, rtn.height, rtn.width] = cornerEdit(dy, dx, rtn.y, rtn.x, rtn.height, rtn.width);
      return rtn;
    }

    return {

      LEditCns, REditCns, TEditCns, BEditCns,
      LTLEditCns, LBLEditCns, RTREditCns, RBREditCns, TTLEditCns, TTREditCns, BBLEditCns, BBREditCns,
      LEdit, REdit, TEdit, BEdit,
      LTLEdit, LBLEdit, RTREdit, RBREdit, TTLEdit, TTREdit, BBLEdit, BBREdit,
      
      t   : { pos : rctEd.TPos, cns : TEditCns, edt : TEdit },
      b   : { pos : rctEd.BPos, cns : BEditCns, edt : BEdit },
      l   : { pos : rctEd.LPos, cns : LEditCns, edt : LEdit },
      r   : { pos : rctEd.RPos, cns : REditCns, edt : REdit },
      bbl : { pos : rctEd.BLPos, cns : BBLEditCns, edt : BBLEdit },
      bbr : { pos : rctEd.BRPos, cns : BBREditCns, edt : BBREdit },
      ttl : { pos : rctEd.TLPos, cns : TTLEditCns, edt : TTLEdit },
      ttr : { pos : rctEd.TRPos, cns : TTREditCns, edt : TTREdit },
      ltl : { pos : rctEd.TLPos, cns : LTLEditCns, edt : LTLEdit },
      lbl : { pos : rctEd.BLPos, cns : LBLEditCns, edt : LBLEdit },
      rtr : { pos : rctEd.TRPos, cns : RTREditCns, edt : RTREdit },
      rbr : { pos : rctEd.BRPos, cns : RBREditCns, edt : RBREdit }

    };

  })(); // treqEd

  class EquilateralTriangle extends IsoscelesTriangle {
    
    constructor(parent, alt) {
      super(parent, alt);
      this.type = utils.fgTypes.TRIANGLEEQL;
      this.dom.classList.add(utils.clsNames.EQUILATERAL);
    }

    computeCoords(point) {
      let coords = super.computeCoords(point);
      let r = Math.sqrt(3) / 2;
      let delta = 0;
      switch(coords.tilt) {
      case utils.tilts.LEFT:
      case utils.tilts.RIGHT:
        delta = Math.round(coords.width - r * coords.height);
        if (delta > 0) {
          coords.width = Math.round(r * coords.height);
          if (point.x < this.start.x) {
            coords.x = this.start.x - coords.width;
          }
        } else if (delta < 0) {
          coords.height = Math.round(coords.width / r);
          if (point.y < this.start.y) {
            coords.y = this.start.y - coords.height;
          }
        }
        break;
      case utils.tilts.TOP:
      case utils.tilts.BOTTOM:
        delta = Math.round(coords.height - r * coords.width);
        if (delta > 0) {
          coords.height = Math.round(r * coords.width);
          if (point.y < this.start.y) {
            coords.y = this.start.y - coords.height;
          }
        } else if (delta < 0) {
          coords.width = Math.round(coords.height / r);
          if (point.x < this.start.x) {
            coords.x = this.start.x - coords.width;
          }
        }
        break;
        default:
      }
      return coords;
    }

    createGrabbers() {
      
      switch (this.coords.tilt) {
      case utils.tilts.BOTTOM:
        this.grabbers.push(new Grasp(new Grip(this.g, treqEd.t.pos(this.coords), utils.cursors.NS), this, treqEd.t));
        this.grabbers.push(new Grasp(new Grip(this.g, treqEd.bbl.pos(this.coords), utils.cursors.NESW), this, treqEd.bbl));
        this.grabbers.push(new Grasp(new Grip(this.g, treqEd.bbr.pos(this.coords), utils.cursors.NWSE), this, treqEd.bbr));
        break;
      case utils.tilts.TOP:
        this.grabbers.push(new Grasp(new Grip(this.g, treqEd.b.pos(this.coords), utils.cursors.NS), this, treqEd.b));
        this.grabbers.push(new Grasp(new Grip(this.g, treqEd.ttl.pos(this.coords), utils.cursors.NWSE), this, treqEd.ttl));
        this.grabbers.push(new Grasp(new Grip(this.g, treqEd.ttr.pos(this.coords), utils.cursors.NESW), this, treqEd.ttr));
        break;
      case utils.tilts.LEFT:
        this.grabbers.push(new Grasp(new Grip(this.g, treqEd.r.pos(this.coords), utils.cursors.EW), this, treqEd.r));
        this.grabbers.push(new Grasp(new Grip(this.g, treqEd.ltl.pos(this.coords), utils.cursors.NWSE), this, treqEd.ltl));
        this.grabbers.push(new Grasp(new Grip(this.g, treqEd.lbl.pos(this.coords), utils.cursors.NESW), this, treqEd.lbl));
        break;
      case utils.tilts.RIGHT:
        this.grabbers.push(new Grasp(new Grip(this.g, treqEd.l.pos(this.coords), utils.cursors.EW), this, treqEd.l));
        this.grabbers.push(new Grasp(new Grip(this.g, treqEd.rtr.pos(this.coords), utils.cursors.NESW), this, treqEd.rtr));
        this.grabbers.push(new Grasp(new Grip(this.g, treqEd.rbr.pos(this.coords), utils.cursors.NWSE), this, treqEd.rbr));
        break;
      default:
      }

    }

  } // EquilateralTriangle

  /*
   * RIGHT-ANGLE TRIANGLE
   */

  var trrcEd = (function() {

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

    function TTLEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [dx, dy] = ceil(rtn.x, rtn.y + rtn.height, rtn.x + rtn.width, rtn.y, rtn.x, rtn.y, dx, dy, -1);
      let [dw, dh] = delta(rtn.width, rtn.height, dx, dy);
      rtn.width -= dw + dx;
      rtn.height -= dh + dy;
      rtn.x += dx;
      rtn.y += dy;
      return rtn;
    }

    function BBREdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [dx, dy] = ceil(rtn.x, rtn.y + rtn.height, rtn.x + rtn.width, rtn.y, rtn.x + rtn.width, rtn.y + rtn.height, dx, dy, 1);
      let [dw, dh] = delta(rtn.width, rtn.height, dx, dy);
      rtn.width += dw + dx;
      rtn.height += dh + dy;
      rtn.x -= dw;
      rtn.y -= dh;
      return rtn;
    }

    function LBLEdit(obj, dx, dy) {
      let rtn = Object.create(obj.coords);
      [dx, dy] = ceil(rtn.x, rtn.y, rtn.x + rtn.width, rtn.y + rtn.height, rtn.x, rtn.y + rtn.height, dx, dy, 1);
      let [dw, dh] = delta(rtn.width, rtn.height, dx, dy);
      rtn.width -= dx - dw;
      rtn.height -= dh - dy;
      rtn.x += dx;
      rtn.y += dh;
      return rtn;
    }

    function RTREdit(obj, dx, dy) {
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

    function TTLEditCns(obj, wmax, hmax) { return nEditCns(obj, wmax, hmax, obj.coords.x, obj.coords.y); }
    function BBREditCns(obj, wmax, hmax) { return nEditCns(obj, wmax, hmax, obj.coords.x + obj.coords.width, obj.coords.y + obj.coords.height); }
    function LBLEditCns(obj, wmax, hmax) { return pEditCns(obj, wmax, hmax, obj.coords.x, obj.coords.y + obj.coords.height); }
    function RTREditCns(obj, wmax, hmax) { return pEditCns(obj, wmax, hmax, obj.coords.x + obj.coords.width, obj.coords.y); }

    return {

      TTLEdit, BBREdit, LBLEdit, RTREdit,
      TTLEditCns, BBREditCns, LBLEditCns, RTREditCns,
      
      ttl : { pos : rctEd.TLPos, cns : TTLEditCns, edt : TTLEdit },
      bbr : { pos : rctEd.BRPos, cns : BBREditCns, edt : BBREdit },
      lbl : { pos : rctEd.BLPos, cns : LBLEditCns, edt : LBLEdit },
      rtr : { pos : rctEd.TRPos, cns : RTREditCns, edt : RTREdit },

      tl : rctEd.tl,
      tr : rctEd.tr,
      bl : rctEd.bl,
      br : rctEd.br

    }
  })(); // trrcEd

  class RectangleTriangle extends IsoscelesTriangle {

    constructor(parent, alt) {
      super(parent, alt);
      this.type = utils.fgTypes.TRIANGLERCT;
      this.dom.classList.add(utils.clsNames.RIGHTANGLE);
    }

    computeCoords(point) {
      let coords = super.computeCoords(point);
      if (point.x <= this.start.x && point.y <= this.start.y) {
        coords.tilt = utils.tilts.RIGHT;
      } else if (point.x <= this.start.x && point.y > this.start.y) {
        coords.tilt = utils.tilts.BOTTOM;
      } else if (point.x > this.start.x && point.y <= this.start.y) {
        coords.tilt = utils.tilts.TOP;
      } else {
        coords.tilt = utils.tilts.LEFT;
      }
      return coords;
    }

    draw(coords) {
      let c = coords || this.coords;
      // Position tracker if it exists
      if (this.tracker != null) {
        this.tracker.setAttribute('x', c.x);
        this.tracker.setAttribute('y', c.y);
        this.tracker.setAttribute('width', c.width);
        this.tracker.setAttribute('height', c.height);
      }
      // Define polygon
      let lx = c.x, rx = c.x + c.width,  
          ty = c.y, by = c.y + c.height;
      let points = [];
      switch(c.tilt) {
      case utils.tilts.BOTTOM:
        points.push({ x : lx, y : by });
        points.push({ x : rx, y : by });
        points.push({ x : rx, y : ty });
        break;
      case utils.tilts.TOP:
        points.push({ x : rx, y : ty });
        points.push({ x : lx, y : ty });
        points.push({ x : lx, y : by });
        break;
      case utils.tilts.LEFT:
        points.push({ x : lx, y : ty });
        points.push({ x : lx, y : by });
        points.push({ x : rx, y : by });
        break;
      case utils.tilts.RIGHT:
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

    createGrabbers() {
      
      switch (this.coords.tilt) {
      case utils.tilts.BOTTOM:
        this.grabbers.push(new Grasp(new Grip(this.g, trrcEd.bl.pos(this.coords), utils.cursors.NESW), this, trrcEd.bl));
        this.grabbers.push(new Grasp(new Grip(this.g, trrcEd.bbr.pos(this.coords), utils.cursors.NWSE), this, trrcEd.bbr));
        this.grabbers.push(new Grasp(new Grip(this.g, trrcEd.tr.pos(this.coords), utils.cursors.NESW), this, trrcEd.tr));
        break;
      case utils.tilts.TOP:
        this.grabbers.push(new Grasp(new Grip(this.g, trrcEd.tr.pos(this.coords), utils.cursors.NESW), this, trrcEd.tr));
        this.grabbers.push(new Grasp(new Grip(this.g, trrcEd.ttl.pos(this.coords), utils.cursors.NWSE), this, trrcEd.ttl));
        this.grabbers.push(new Grasp(new Grip(this.g, trrcEd.bl.pos(this.coords), utils.cursors.NESW), this, trrcEd.bl));
        break;
      case utils.tilts.LEFT:
        this.grabbers.push(new Grasp(new Grip(this.g, trrcEd.tl.pos(this.coords), utils.cursors.NWSE), this, trrcEd.tl));
        this.grabbers.push(new Grasp(new Grip(this.g, trrcEd.lbl.pos(this.coords), utils.cursors.NESW), this, trrcEd.lbl));
        this.grabbers.push(new Grasp(new Grip(this.g, trrcEd.br.pos(this.coords), utils.cursors.NWSE), this, trrcEd.br));
        break;
      case utils.tilts.RIGHT:
        this.grabbers.push(new Grasp(new Grip(this.g, trrcEd.br.pos(this.coords), utils.cursors.NWSE), this, trrcEd.br));
        this.grabbers.push(new Grasp(new Grip(this.g, trrcEd.rtr.pos(this.coords), utils.cursors.NESW), this, trrcEd.rtr));
        this.grabbers.push(new Grasp(new Grip(this.g, trrcEd.tl.pos(this.coords), utils.cursors.NWSE), this, trrcEd.tl));
        break;
      default:
      }

    }

  }

  /*
   * CIRCLE (from CENTER) 
   */

  var crcEd = (function() {
    
    // GRABBER POSITIONS
    function RPos(coords) { return { x : coords.x + coords.r, y : coords.y }; }
    // GRABBER CONSTRAINTS
    function REditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dxmin : -obj.coords.r,
                dxmax : Math.min(-lims.dxmin, lims.dxmax, -lims.dymin, lims.dymax),
                dymin : 0, dymax : 0 };
    }
    // GRABBER EDITION
    function REdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      coords.r += dx;
      return coords;
    }

    return {
      RPos, REditCns, REdit,
      r   : { pos : RPos, cns : REditCns, edt : REdit }
    };
    
  })(); // crcEd
  
  class Circle extends Figure {

    constructor(parent, alt) {
      super(utils.fgTypes.CIRCLECTR, parent);
      this.start = { x : 0, y : 0 };
      this.coords = { x : 0, y : 0, r : 0 };
      this.dom = document.createElementNS(utils.ns.SVG, 'circle');
      this.g.appendChild(this.dom);
    }

    drawStart(point) {
      this.coords.x = this.start.x = point.x;
      this.coords.y = this.start.y = point.y;
      this.coords.r = 0;
      this.redraw();
    }

    drawMove(point) {
      this.setCoords(this.computeCoords(point)).redraw();
    }

    drawEnd(point) {
      this.setCoords(this.computeCoords(point)).redraw();
      if (0 == this.coords.r) {
        this.drawCancel();
        return 'error';
      }
      return 'done';
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
      return this;
    }

    checkCoords(coords) {
      return (coords.r > 0) ? true : false;
    }

    computeCoords(point) {
      let dx = point.x - this.start.x,
          dy = point.y - this.start.y; 
      return {
        x : this.start.x,
        y : this.start.y,
        r : Math.round(Math.sqrt(dx*dx + dy*dy))
      };
    }

    moveCoords(dx, dy) {
      let rtn = Object.create(this.coords);
      rtn.x = this.coords.x + dx;
      rtn.y = this.coords.y + dy;
      return rtn;
    }

    rotateStepCoords(direction, wmax, hmax) {
      return Object.create(this.coords);
    }

    draw(coords) {
      let c = coords || this.coords;
      this.dom.setAttribute('cx', c.x);
      this.dom.setAttribute('cy', c.y);
      this.dom.setAttribute('r', c.r);
    }

    moveDLims(wmax, hmax) {
      return {
        dxmin : -(this.coords.x - this.coords.r),
        dxmax : wmax - (this.coords.x + this.coords.r),
        dymin : -(this.coords.y - this.coords.r),
        dymax : hmax - (this.coords.y + this.coords.r)
      };
    }

    createGrabbers() {
      this.grabbers.push(new Grasp(new Grip(this.g, crcEd.r.pos(this.coords), utils.cursors.EW), this, crcEd.r));
    }

    within(coords) {
      if (this.coords.x - this.coords.r < coords.x) return false;
      if (this.coords.x + this.coords.r > coords.x + coords.width) return false;
      if (this.coords.y - this.coords.r < coords.y) return false;
      if (this.coords.y + this.coords.r > coords.y + coords.height) return false;
      return true;
    }

  } // Circle

  /*
   * CIRCLE (from CENTER) 
   */

  var cexEd = (function() {
    
    // GRABBER POSITIONS

    function LPos(coords) { return { x : coords.x - coords.r, y : coords.y }; }
    function TPos(coords) { return { x : coords.x, y : coords.y - coords.r }; }
    function BPos(coords) { return { x : coords.x, y : coords.y + coords.r }; }

    // GRABBER CONSTRAINTS

    function REditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dxmin : -obj.coords.r,
                dxmax : Math.min(lims.dxmax, -lims.dymin*2, lims.dymax*2),
                dymin : 0, dymax : 0 };
    }
    function LEditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dxmax : obj.coords.r,
                dxmin : -Math.min(-lims.dxmin, -lims.dymin*2, lims.dymax*2),
                dymin : 0, dymax : 0 };
    }
    function TEditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dymax : obj.coords.r,
                dymin : -Math.min(-lims.dymin, -lims.dxmin*2, lims.dxmax*2),
                dxmin : 0, dxmax : 0 };
    }
    function BEditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dymin : -obj.coords.r,
                dymax : Math.min(lims.dymax, -lims.dxmin*2, lims.dxmax*2),
                dxmin : 0, dxmax : 0 };
    }

    // GRABBER EDITION

    function REdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      let dxx = Math.round(dx/2);
      coords.x += dxx;
      coords.r += dxx;
      return coords;
    }

    function LEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      let dxx = Math.round(dx/2);
      coords.x += dxx;
      coords.r -= dxx;
      return coords;
    }

    function TEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      let dyy = Math.round(dy/2);
      coords.y += dyy;
      coords.r -= dyy;
      return coords;
    }

    function BEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      let dyy = Math.round(dy/2);
      coords.y += dyy;
      coords.r += dyy;
      return coords;
    }

    return {
      LPos, TPos, BPos,
      REditCns, LEditCns, TEditCns, BEditCns,
      REdit, LEdit, TEdit, BEdit,
      
      r   : { pos : crcEd.RPos, cns : REditCns, edt : REdit },
      l   : { pos : LPos, cns : LEditCns, edt : LEdit },
      t   : { pos : TPos, cns : TEditCns, edt : TEdit },
      b   : { pos : BPos, cns : BEditCns, edt : BEdit },
    };
    
  })(); // cexEd

  class CircleEx extends Circle {

    constructor(parent, alt) {
      super(parent, alt);
      this.type = utils.fgTypes.CIRCLEDTR;
      this.dom.classList.add(utils.clsNames.EXTENDED);
    }

    computeCoords(point) {
      let dx = point.x - this.start.x,
          dy = point.y - this.start.y; 
      return {
        x : this.start.x + Math.round(dx/2),
        y : this.start.y + Math.round(dy/2),
        r : Math.round(Math.sqrt(dx*dx + dy*dy)/2)
      };
    }

    createGrabbers() {
      this.grabbers.push(new Grasp(new Grip(this.g, cexEd.r.pos(this.coords), utils.cursors.EW), this, cexEd.r));
      this.grabbers.push(new Grasp(new Grip(this.g, cexEd.b.pos(this.coords), utils.cursors.NS), this, cexEd.b));
      this.grabbers.push(new Grasp(new Grip(this.g, cexEd.l.pos(this.coords), utils.cursors.EW), this, cexEd.l));
      this.grabbers.push(new Grasp(new Grip(this.g, cexEd.t.pos(this.coords), utils.cursors.NS), this, cexEd.t));
    }

  } // CircleEx

  /*
   * ELLIPSE 
   */

  var ellEd = (function() {
     return { l : rctEd.l, r : rctEd.r,  t : rctEd.t,  b : rctEd.b };
   })(); // ellEd
  
  class Ellipse extends Rectangle {

    constructor(parent, alt) {
      super(parent, alt);
      this.type = utils.fgTypes.ELLIPSE;
      this.tracker = this.dom;
      this.tracker.classList.add(utils.clsNames.TRACKER);
      this.dom = document.createElementNS(utils.ns.SVG, 'ellipse');
      this.g.appendChild(this.dom);
    }
    
    drawEnd(point) {
      let rtn = super.drawEnd(point);
      if (rtn === 'done') {  // If canceled, whole group has already been removed including tracker 
        this.g.removeChild(this.tracker);
      }
      this.tracker = null;
      return rtn;
    }
  
    draw(coords) {
      let c = coords || this.coords;
      // Position tracker if it exists
      if (this.tracker != null) {
        this.tracker.setAttribute('x', c.x);
        this.tracker.setAttribute('y', c.y);
        this.tracker.setAttribute('width', c.width);
        this.tracker.setAttribute('height', c.height);
      }
      // Define ellipse
      let rx = Math.round(c.width/2),
          ry = Math.round(c.height/2);
      this.dom.setAttribute('cx', c.x + rx);
      this.dom.setAttribute('cy', c.y + ry);
      this.dom.setAttribute('rx', rx);
      this.dom.setAttribute('ry', ry);
    }

    createGrabbers() {
      this.grabbers.push(new Grasp(new Grip(this.g, ellEd.l.pos(this.coords), utils.cursors.EW), this, ellEd.l));
      this.grabbers.push(new Grasp(new Grip(this.g, ellEd.r.pos(this.coords), utils.cursors.EW), this, ellEd.r));
      this.grabbers.push(new Grasp(new Grip(this.g, ellEd.t.pos(this.coords), utils.cursors.NS), this, ellEd.t));
      this.grabbers.push(new Grasp(new Grip(this.g, ellEd.b.pos(this.coords), utils.cursors.NS), this, ellEd.b));
    }

  } // Ellipse

  /*
   * HEX (from RECTANGLE) 
   */

  var hexEd = (function() {

    const F = Math.sqrt(3), R = F/2;

    // GRABBER CONSTRAINTS

    function HREditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dxmin : -obj.coords.width,
                dxmax : Math.min(lims.dxmax, Math.round(-lims.dymin/R*2), Math.round(lims.dymax/R*2)),
                dymin : 0, dymax : 0 };
    }
    function HLEditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dxmax : obj.coords.width,
                dxmin : -Math.min(-lims.dxmin, Math.round(-lims.dymin/R*2), Math.round(lims.dymax/R*2)),
                dymin : 0, dymax : 0 };
    }
    function HTEditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dymax : obj.coords.heigth,
                dymin : -Math.min(-lims.dymin, Math.round(-lims.dxmin*F), Math.round(lims.dxmax*F)),
                dxmin : 0, dxmax : 0 };
    }
    function HBEditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dymin : -obj.coords.height,
                dymax : Math.min(lims.dymax, Math.round(-lims.dxmin*F), Math.round(lims.dxmax*F)),
                dxmin : 0, dxmax : 0 };
    }

    function VREditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dxmin : -obj.coords.width,
                dxmax : Math.min(lims.dxmax, Math.round(-lims.dymin*F), Math.round(lims.dymax*F)),
                dymin : 0, dymax : 0 };
    }
    function VLEditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dxmax : obj.coords.width,
                dxmin : -Math.min(-lims.dxmin, Math.round(-lims.dymin*F), Math.round(lims.dymax*F)),
                dymin : 0, dymax : 0 };
    }
    function VTEditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dymax : obj.coords.heigth,
                dymin : -Math.min(-lims.dymin, Math.round(-lims.dxmin/R*2), Math.round(lims.dxmax/R*2)),
                dxmin : 0, dxmax : 0 };
    }
    function VBEditCns(obj, wmax, hmax) {
      let lims = obj.moveDLims(wmax, hmax);
      return {  dymin : -obj.coords.heigth,
                dymax : Math.min(lims.dymax, Math.round(-lims.dxmin/R*2), Math.round(lims.dxmax/R*2)),
                dxmin : 0, dxmax : 0 };
    }

    // GRABBER EDITION

    function SmEdit(ds, s, b, ls, lb) {
      return [s, s-ds, b - Math.round(ds*R/2), ls + ds, lb + Math.round(ds*R)];
    }
    function BsEdit(db, b, s, lb, ls) {
      return [b, b-db, s - Math.round(db/F), lb + db, ls + Math.round(db/R)];
    }

    function HREdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [coords.x, , coords.y, coords.width, coords.height] = SmEdit(dx, coords.x, coords.y, coords.width, coords.height);
      return coords;
    }
    function HLEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [, coords.x, coords.y, coords.width, coords.height] = SmEdit(-dx, coords.x, coords.y, coords.width, coords.height);
      return coords;
    }
    function HTEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [, coords.y, coords.x, coords.height, coords.width] = BsEdit(-dy, coords.y, coords.x, coords.height, coords.width);
      return coords;
    }
    function HBEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [coords.y, , coords.x, coords.height, coords.width] = BsEdit(dy, coords.y, coords.x, coords.height, coords.width);
      return coords;
    }
    function VREdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [coords.x, , coords.y, coords.width, coords.height] = BsEdit(dx, coords.x, coords.y, coords.width, coords.height);
      return coords;
    }
    function VLEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [, coords.x, coords.y, coords.width, coords.height] = BsEdit(-dx, coords.x, coords.y, coords.width, coords.height);
      return coords;
    }
    function VTEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [, coords.y, coords.x, coords.height, coords.width] = SmEdit(-dy, coords.y, coords.x, coords.height, coords.width);
      return coords;
    }
    function VBEdit(obj, dx, dy)   {
      let coords = Object.create(obj.coords);
      [coords.y, , coords.x, coords.height, coords.width] = SmEdit(dy, coords.y, coords.x, coords.height, coords.width);
      return coords;
    }

    return {

      HREditCns, HLEditCns, HTEditCns, HBEditCns, VREditCns, VLEditCns, VTEditCns, VBEditCns,
      HREdit, HLEdit, HTEdit, HBEdit, VREdit, VLEdit, VTEdit, VBEdit,

      hl : { pos : rctEd.LPos, cns : HLEditCns, edt : HLEdit },
      hr : { pos : rctEd.RPos, cns : HREditCns, edt : HREdit },
      ht : { pos : rctEd.TPos, cns : HTEditCns, edt : HTEdit },
      hb : { pos : rctEd.BPos, cns : HBEditCns, edt : HBEdit },
      vl : { pos : rctEd.LPos, cns : VLEditCns, edt : VLEdit },
      vr : { pos : rctEd.RPos, cns : VREditCns, edt : VREdit },
      vt : { pos : rctEd.TPos, cns : VTEditCns, edt : VTEdit },
      vb : { pos : rctEd.BPos, cns : VBEditCns, edt : VBEdit }

    };

  })(); // hexEd
 
  class Hex extends Rectangle {
    
    constructor(parent, alt) {
      super(parent, alt);
      this.type = utils.fgTypes.HEXRCT;
      this.tracker = this.dom;
      this.tracker.classList.add(utils.clsNames.TRACKER);
      this.dom = document.createElementNS(utils.ns.SVG, 'polygon');
      this.dom.classList.add(utils.clsNames.HEX);
      this.g.appendChild(this.dom);
    }
    
    drawEnd(point) {
      let rtn = super.drawEnd(point);
      if (rtn === 'done') {  // If canceled, whole group has already been removed including tracker
        if (null != this.tracker) {
          this.g.removeChild(this.tracker);
        }
      }
      this.tracker = null;
      return rtn;
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
      if (point.x < this.start.x) { coords.x += dw; }
      if (point.y < this.start.y) { coords.y += dh; }
      return coords;
    }

    getSBPt(s, b, ls, lb) {
      let s1 = s + Math.round(ls/4), s2 = s + Math.round(3*ls/4), s3 = s + ls;
      let b1 = b + Math.round(lb/2), b2 = b + lb;
      return [ s1, b, s2, b, s3, b1, s2, b2, s1, b2, s, b1 ];
    }

    draw(coords) {
      let c = coords || this.coords;
      // Position tracker if it exists
      if (this.tracker != null) {
        this.tracker.setAttribute('x', c.x);
        this.tracker.setAttribute('y', c.y);
        this.tracker.setAttribute('width', c.width);
        this.tracker.setAttribute('height', c.height);
      }
      // Define hex
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
      let attrVal = pts.reduce(function(r, e) {
        return r + e.x + ' ' + e.y + ' ';
      }, '');
      this.dom.setAttribute('points', attrVal);
    }

    createGrabbers() {
      if (this.coords.width > this.coords.height) {
        this.grabbers.push(new Grasp(new Grip(this.g, hexEd.hl.pos(this.coords), utils.cursors.EW), this, hexEd.hl));
        this.grabbers.push(new Grasp(new Grip(this.g, hexEd.hr.pos(this.coords), utils.cursors.EW), this, hexEd.hr));
        this.grabbers.push(new Grasp(new Grip(this.g, hexEd.ht.pos(this.coords), utils.cursors.NS), this, hexEd.ht));
        this.grabbers.push(new Grasp(new Grip(this.g, hexEd.hb.pos(this.coords), utils.cursors.NS), this, hexEd.hb));
      } else {
        this.grabbers.push(new Grasp(new Grip(this.g, hexEd.vl.pos(this.coords), utils.cursors.EW), this, hexEd.vl));
        this.grabbers.push(new Grasp(new Grip(this.g, hexEd.vr.pos(this.coords), utils.cursors.EW), this, hexEd.vr));
        this.grabbers.push(new Grasp(new Grip(this.g, hexEd.vt.pos(this.coords), utils.cursors.NS), this, hexEd.vt));
        this.grabbers.push(new Grasp(new Grip(this.g, hexEd.vb.pos(this.coords), utils.cursors.NS), this, hexEd.vb));
      }
    }

  } // Hex

  /*
   * HEX (from DIAMETER) :  -- | [\ /] *2 
   */

  class HexEx extends Hex {
    
    constructor(parent, alt) {
      super(parent, alt);
      this.type = utils.fgTypes.HEXDTR;
      this.dom.classList.add(utils.clsNames.EXTENDED);
      this.g.removeChild(this.tracker);
      this.tracker = null;
    }

    drawMove(point, wmax, hmax) {
      this.setCoords(this.computeCoords(point, wmax, hmax)).redraw();
    }

    drawEnd(point, wmax, hmax) {
      this.setCoords(this.computeCoords(point, wmax, hmax)).redraw();
      if (0 == this.coords.width || 0 == this.coords.height) {
        this.drawCancel();
        return 'error';
      }
      return 'done';
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
          else if (tan > -L1) { type = 3; dy = 0; dx = coordsCeilOrth(dx, ys, hmax); }
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
      let coords = Object.create(this.coords);
      [dx, dy, type] = fixTilt(this.start.x, this.start.y, point.x, point.y, wmax, hmax);
      switch(type) {
      case 0:
        [coords.y, coords.x, coords.height, coords.width] = computeCoordsOrth(this.start.y, this.start.x, dy, dx);
        break;
      case 1:
      case 5:
        [coords.x, coords.y, coords.width, coords.height] = computeCoordsTilt(this.start.x, this.start.y, dx, dy);
        break;
      case 2:
      case 4:
        [coords.y, coords.x, coords.height, coords.width] = computeCoordsTilt(this.start.y, this.start.x, dy, dx);
        break;
      case 3:
        [coords.x, coords.y, coords.width, coords.height] = computeCoordsOrth(this.start.x, this.start.y, dx, dy);
        break;
      default:
      }
      return coords;
    }

  }

  /*
   * POLYGON 
   */

  var plgEd = (function() {

    function generateEditor( id ) {
      
      return {

        pos : function(coords) {
          return { x : coords[id].x, y : coords[id].y };
        },

        cns : function(obj, wmax, hmax) {
          return {  dxmin : -obj.coords[id].x, dxmax : wmax - obj.coords[id].x,
                    dymin : -obj.coords[id].y, dymax : hmax - obj.coords[id].y };
        },
        
        edt : function(obj, dx, dy) {
          let coords = obj.getCoords();
          coords[id].x += dx;
          coords[id].y += dy;
          return coords;
        }

      };
    }

    return { generateEditor };

  })(); // hexEd
 
  class Polygon extends Figure {

    constructor(parent, alt) {
      super(utils.fgTypes.POLYGON, parent);
      this.start = { x : 0, y : 0 };
      this.coords = [{ x : 0, y : 0}];
      this.dom = document.createElementNS(utils.ns.SVG, 'polyline');
      this.g.appendChild(this.dom);
      this.closeGap = 3;
    }

    drawStart(point) {
      this.coords[0].x = this.start.x = point.x;
      this.coords[0].y = this.start.y = point.y;
      this.coords.push({ x : point.x, y : point.y });
      this.redraw();
    }

    drawMove(point) {
      this.setCoords(this.computeCoords(point)).redraw();
    }

    drawEnd(point) {
      this.setCoords(this.computeCoords(point));
      if (this.closure(point)) {
        this.coords.pop();
        if (3 > this.coords.length) {
          this.drawCancel();
          return 'error';
        }
        let newDom = document.createElementNS(utils.ns.SVG, 'polygon');
        this.g.replaceChild(newDom, this.dom);
        this.dom = newDom;
        this.redraw();
        return 'done';
      }
      this.coords.push({ x : point.x, y : point.y });
      return 'continue';
    }

    closure(point) {
      let d = point.x - this.start.x;
      if (d < -this.closeGap || d > this.closeGap) {
        return false;
      }
      d = point.y - this.start.y;
      if (d < -this.closeGap || d > this.closeGap) {
        return false;
      }
      return true;
    }

    copyCoords(coords) {
      let rtn = [];
      coords.forEach(function(e) {
        rtn.push({ x : e.x, y : e.y })
      });
      return rtn;
    }

    getCoords() {
      return this.copyCoords(this.coords);
    }

    setCoords(coords) {
      this.coords.splice(0, this.coords.length);
      this.coords = this.copyCoords(coords);
      return this;
    }

    checkCoords(coords) {
      return (2 < coords.length) ? true : false;
    }

    computeCoords(point) {
      let coords = this.copyCoords(this.coords);
      let last = coords.length - 1;
      coords[last].x = point.x;
      coords[last].y = point.y;
      return coords;
    }

    moveCoords(dx, dy) {
      let rtn = this.copyCoords(this.coords);
      rtn.forEach(function(e) {
        e.x += dx;
        e.y += dy;
      });
      return rtn;
    }

    rotateStepCoords(direction, wmax, hmax) {
      return this.copyCoords(this.coords);
    }

    draw(coords) {
      let c = coords || this.coords;
      let attrVal = c.reduce(function(r, e) {
        return r + e.x + ' ' + e.y + ' ';
      }, '');
      this.dom.setAttribute('points', attrVal);
    }

    moveDLims(wmax, hmax) {
      let lims = this.coords.reduce(function(r, e) {
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

    createGrabbers() {
      for (let i = 0; i < this.coords.length; i++) {
        this.grabbers.push(new Grasp(new Grip(this.g, this.coords[i], utils.cursors.ALL), this, plgEd.generateEditor(i)));
      }
    }
 
    within(coords) {
      return this.coords.reduce(function(r, e) {
        return r && (e.x >= coords.x && e.x <= coords.x + coords.width && e.y >= coords.y && e.y <= coords.y + coords.height);
      }, true);
    }

  } // Polygon

  /*
   * GRIDDER
   */

  class Gridder {

    constructor(tracker, bond, parent) {
      this.tracker = tracker;
      this.bond = bond;
      this.bind();

      this.parent = parent;
      this.g = document.createElementNS(utils.ns.SVG, 'g');
      this.parent.appendChild(this.g);
      this.doms = [];
    }
    
    bind() {
      this.tracker.bonds.push(this.bond);
      this.tracker.dom.classList.add(utils.clsNames.GRIDSCOPE);
      this.bond.bonds.push(this.tracker);
      this.bond.dom.classList.add(utils.clsNames.GRIDBOND);
    }

    unbind() {
      this.bond.bonds.splice(this.bond.bonds.indexOf(this.tracker), 1);
      if (0 === this.bond.bonds.length) {
        this.bond.dom.classList.remove(utils.clsNames.GRIDBOND);
      }
    }

    remove() {
      this.parent.removeChild(this.g);
      this.parent = this.g = null;
      this.doms.splice(0, this.doms.length);
      this.tracker = this.bond = null;
    }

    draw(coords) {
      let c = coords || this.coords;
      let points = this.computePoints(coords);
console.log('#points computed: ' + points.length);
      // Define a table of start points
      // Move list in temporary list
      // If an elt start point match a list start point, transfer it to the definitive list and remove start point (processed)
      // If remaining start point,
      //    for any remaining elements, move it to a new start point and transfer it (processed)
      //    if no more remaining elets, create new elt for each remaining start point (processed)
      // If remaining elements, remove them
    }

  }

  class RectangleGridder extends Gridder {

    constructor(tracker, bond, parent) {
      super(tracker, bond, parent);
    }

    getBondDims() {
      let dims = { x : 0, y : 0, width : 0, height : 0 };
      if (this.bond.type === utils.fgTypes.CIRCLEDTR || this.bond.type == utils.fgTypes.CIRCLECTR) {
        dims.x = this.bond.coords.x - this.bond.coords.r;
        dims.y = this.bond.coords.y - this.bond.coords.r;
        dims.width = dims.height = this.bond.coords.r * 2;
      } else {
        dims.x = this.bond.coords.x;
        dims.y = this.bond.coords.y;
        dims.width = this.bond.coords.width;
        dims.height = this.bond.coords.height;
      }
      return dims;
    }

    computePoints(coords) {
      
      var computeStart = function(b, t, d) {
        let f = (b > t) ? 1 : -1;
        let n = Math.floor(Math.abs((b-t)/d));
        return b + f*n*d;
      } 

      let points = [];
      if (0 < this.tracker.coords.width && 0 < this.tracker.coords.height) {
        let dims = this.getBondDims();
        let xs = computeStart(dims.x, this.tracker.coords.x, dims.width);
        let nx = Math.floor((this.tracker.coords.x + this.tracker.coords.width - xs) / dims.width);
        let ys = computeStart(dims.y, this.tracker.coords.y, dims.height);
        let ny = Math.floor((this.tracker.coords.y + this.tracker.coords.height - ys) / dims.height);
        for(let j = 0; j < ny; j++) {
          let y = ys + j*dims.height;
          for(let i = 0; i < nx; i++) {
            points.push({ x : xs + i*dims.width, y : y });
          }
        }
        if (this.bond.type === utils.fgTypes.CIRCLEDTR || this.bond.type == utils.fgTypes.CIRCLECTR) {
          points.forEach(function(e) {
            e.x += this.bond.coords.r;
            e.y += this.bond.coords.r;
          });
        }
console.log('xs, ys, nx, ny : ' + xs + ' ' + ys + ' ' + nx + ' ' + ny);
      }
      return points;
    }

  }

  /*
   * RECTANGLE GRID
   */

  class RectangleGrid extends Rectangle {

    constructor(parent, alt, bond, gridParent) {
      super(parent, alt);
      this.type = utils.fgTypes.RECTANGLEGRID;
      this.grid = new RectangleGridder(this, bond, gridParent);
    }

    removeBonds() {
      let bond = this.bonds[0];
      this.grid.unbind();
      bond.dom.classList.remove(utils.clsNames.HIGHLIGHTED);
    }

    remove() {
      super.remove();
      this.grid.remove();
      this.grid = null;
    }

    draw(coords) {
      super.draw(coords);
      this.grid.draw(coords);
    }

  } // RectangleGrid

  /*
   * CIRCLE GRID
   */

  class CircleExGrid extends CircleEx {

    constructor(parent, alt, bond, gridParent) {
      super(parent, alt);
      this.grid = true;
      this.gridParent = gridParent;
      this.gg = document.createElementNS(utils.ns.SVG, 'g');
      this.gridParent.appendChild(this.gg);
      this.gDoms = [];
      this.bonds.push(bond);
      this.type = utils.fgTypes.CIRCLEDTRGRID;
      this.dom.classList.add(utils.clsNames.GRIDSCOPE);
      bond.bonds.push(this);
      bond.dom.classList.add(utils.clsNames.GRIDBOND);
    }

    removeBonds() {
      let bond = this.bonds[0];
      bond.bonds.splice(bond.bonds.indexOf(this), 1);
      if (0 === bond.bonds.length) {
        bond.dom.classList.remove(utils.clsNames.GRIDBOND);
      }
      bond.dom.classList.remove(utils.clsNames.HIGHLIGHTED);
    }

    remove() {
      super.remove();
      this.gridParent.removeChild(this.gg);
      this.gridParent = this.gg = null;
      this.gDoms.splice(0, this.gDoms.length);
    }

  } // CircleExGrid

  /*
   * HEX GRID
   */

  class HexExGrid extends HexEx {

    constructor(parent, alt, bond, gridParent) {
      super(parent, alt);
      this.grid = true;
      this.gridParent = gridParent;
      this.gg = document.createElementNS(utils.ns.SVG, 'g');
      this.gridParent.appendChild(this.gg);
      this.gDoms = [];
      this.bonds.push(bond);
      this.type = utils.fgTypes.HEXDTRGRID;
      this.dom.classList.add(utils.clsNames.GRIDSCOPE);
      bond.bonds.push(this);
      bond.dom.classList.add(utils.clsNames.GRIDBOND);
    }

    removeBonds() {
      let bond = this.bonds[0];
      bond.bonds.splice(bond.bonds.indexOf(this), 1);
      if (0 === bond.bonds.length) {
        bond.dom.classList.remove(utils.clsNames.GRIDBOND);
      }
      bond.dom.classList.remove(utils.clsNames.HIGHLIGHTED);
    }

    remove() {
      super.remove();
      this.gridParent.removeChild(this.gg);
      this.gridParent = this.gg = null;
      this.gDoms.splice(0, this.gDoms.length);
    }

  } // HexExGrid

  /* Data model */

  var mdl = (function() {

    var imgTypes = [
          'image/jpeg',
          'image/gif',
          'image/png'
        ],
        context = {
          mode : 'new',
          modified : false,
          filename : '',
          areas : []
        };
    
    function validateImgFile(f) {
      for(var i = 0; i < imgTypes.length; i++) {
        if(f.type === imgTypes[i]) {
          return true;
        }
      }
      return false;
    }

    return {

      isModified : function() {
        return context.modified;
      },

      reset : function() {
        context.filename = '';
        context.modified = false;
        context.areas.forEach(function(area) {
          area.remove();
        });
        context.areas.splice(0, context.areas.length);
        return this;
      },

      setFile : function(f) {
        if (validateImgFile(f)) {
          context.filename = f.name;
          context.modified = true;
          return true;
        }
        return false;
      },

      addArea : function(area) {
        context.areas.push(area);
        context.modified = true;
      },

      removeArea : function(area) {
        if(-1 != context.areas.indexOf(area)) {
          let bonds = [];
          if (!area.isGrid() &&
              area.hasBonds() &&
              (true == confirm("Deleting this element will automatically delete grid built from it.\nDo you still want to proceed to element deletion ?"))) {
            bonds = area.getBonds();
            bonds.forEach(function(e) {
              let j = context.areas.indexOf(e);
              e.remove();
              context.areas.splice(j, 1);
            });
            bonds.splice(0, bonds.length);
          }
          let i = context.areas.indexOf(area);
          area.remove();
          context.areas.splice(i, 1);
          context.modified = true;
        }
      },

      findArea : function(obj) {
        return context.areas.find(function(e) {
          return e.check(obj);
        });
      },
      
      forEachArea(f) {
        context.areas.forEach(f);
      }

    };

  })(); /* mdl */

  /* Workarea management */
  var wks = (function() {

    var doms = {
      wks       : $('wks-wrap'),
      aside     : $('tools'),
      footer    : $('footer'),
      workarea  : $('workarea'),
      container : $('container'),
      image     : $('img-display'),
      drawarea  : $('draw-area')
    };

    const states = {
      OPEN      : 'open',
      READY     : 'ready',
      DRAGGING  : 'dragging',
      DRAWING   : 'drawing',
      SELECTING : 'selecting',
      SELECTED  : 'selected',
      MOVING    : 'moving',
      MOVED     : 'moved',
      EDITING   : 'editing',
      EDITED    : 'edited'
    };

    var context = {
      mode : 'new',
      state : states.OPEN,
      offset : { x : 0, y : 0 }
    };

    function addWel(t, f) {
      doms.workarea.addEventListener(t, f, false);
    }

    function rmWel(t, f) {
      doms.workarea.removeEventListener(t, f, false);
    }

    /* viewport computes of workarea elements and coordinate offsets. */
    var viewport = (function() {
      return {

        setWorkingDims : function(w,h) {
          doms.drawarea.setAttribute('width', w);
          doms.drawarea.setAttribute('height', h);
          doms.container.style.width = w + 'px';
          doms.container.style.height = h + 'px';
          return this;
        },

        setViewDims : function() {
          var fc = doms.footer.getBoundingClientRect(),
              ac = doms.aside.getBoundingClientRect(),
              wc = doms.wks.getBoundingClientRect();
          var width = Math.floor(fc.right - (ac.right - ac.left) - wc.left - 5),
              height = Math.floor(fc.top - wc.top - 5);
          doms.workarea.style.width = width + 'px';
          doms.workarea.style.height = height + 'px';
          return this;
        },

        resize : function() {
          this.setViewDims()
              .computeOffset();
          return this;
        },

        computeOffset : function() {
          var coords = doms.container.getBoundingClientRect();
          context.offset.x = Math.round(coords.left + window.pageXOffset);
          context.offset.y = Math.round(coords.top + window.pageYOffset);
          return this;
        },

        computeCoords : function(x, y) {
          return {
            x : x - context.offset.x,
            y : y - context.offset.y
          };
        },

        isPointerInImage : function(x, y) {
          var coords = this.computeCoords(x, y);
          return (0 > coords.x || doms.image.width < coords.x || 0 > coords.y || doms.image.height < coords.y) ? false : true;
        }

      };
    })(); // viewport

    /* Images coordinates are set when moving within workarea. */
    var coordTracker = (function() {

      var enabled = false;

      function onWorkareaMove(e) {
        console.log('state : ' + context.state);
        e.preventDefault();
        ftr.coords.set(viewport.computeCoords(e.pageX, e.pageY));
      }

      function onWorkareaLeave(e) {
        e.preventDefault();
        ftr.coords.clear();
      }

      return {
        enable : function() {
          if (enabled) return;
          addWel('mousemove', onWorkareaMove);
          addWel('mouseleave', onWorkareaLeave);
          enabled = true;
        },
        disable : function() {
          if (!enabled) return;
          rmWel('mousemove', onWorkareaMove);
          rmWel('mouseleave', onWorkareaLeave);
          enabled = false;
        }
      };

    })(); // coordTracker

    /*
     * Dragging start with a mouse down on image and CTRL key
     * Dragging is active as long as the pointer is in the workarea and button is down
     * Dragging stop on mouse up or if a move w/o buttons down is caught
     * 
     * Dragging move and top listeners are installed only if a dragging is started.
     */

    var imageDragger = (function() {

      var enabled = false;

      function enter() {
        doms.workarea.classList.add(utils.clsNames.DRAGGING);
        addWel('mouseup', onImageDragStop);
        addWel('mousemove', onImageDragMove);
        tls.freeze();
        context.state = states.DRAGGING;
      } 

      function exit() {
        doms.workarea.classList.remove(utils.clsNames.DRAGGING);
        rmWel('mouseup', onImageDragStop);
        rmWel('mousemove', onImageDragMove);
        tls.release();
        context.state = states.READY;
      }

      function move(dx, dy) {
        doms.workarea.scrollLeft -= dx;
        doms.workarea.scrollTop  -= dy;
      }

      function onImageDragStart(e) {
        e.preventDefault();
        if (0 !== e.button || !e.ctrlKey) return;
        if (states.READY !== context.state) return;
        if (tls.modes.NONE !== tls.getDrawingMode()) return;
        if (!viewport.isPointerInImage(e.pageX, e.pageY)) return;
        if (app.areas.select.isAreaTargeted(e.target)) return;
        enter();
      }

      function onImageDragStop(e) {
        e.preventDefault();
        exit();
      }

      function onImageDragMove(e) {
        e.preventDefault();
        if (0 === e.buttons || 0 !== e.button || !e.ctrlKey) {
          exit();
        } else {
          move(e.movementX, e.movementY);
        }
      }

      return {
        enable : function() {
          if (enabled) return;
          addWel('mousedown', onImageDragStart);
          enabled = true;
        },
        disable : function() {
          if (!enabled) return;
          if (states.DRAGGING == context.state) {
            exit();
          }
          rmWel('mousedown', onImageDragStart);
          enabled = false;
        }
      };

    })(); // imageDragger

    /*
     * Drawing start with a click on image
     * Additional click add points to some drawing e.g. polygon
     * Drawing stop on dblclick
     * Drawing is canceled on ESC key pressed
     */

    var areaDrawer = (function () {

      var enabled = false;

      function enter() {
        doms.drawarea.classList.add(utils.clsNames.DRAWING);
        imageDragger.disable();
        areaMover.disable();
        areaEditor.disable();
        areaSelector.disable();
        rmWel('click', onDrawStart);
        addWel('click', onDrawEnd);
        addWel('mousemove', onDrawProgress);
        document.addEventListener('keydown', onDrawCancel);
        context.state = states.DRAWING;
      }

      function exit() {
        doms.drawarea.classList.remove(utils.clsNames.DRAWING);
        imageDragger.enable();
        areaMover.enable();
        areaEditor.enable();
        areaSelector.enable();
        rmWel('click', onDrawEnd);
        rmWel('mousemove', onDrawProgress);
        addWel('click', onDrawStart);
        document.removeEventListener('keydown', onDrawCancel);
        context.state = states.READY; // TODO: Edit data on selected area ? or edit in tools ?
      }

      function onDrawStart(e) {
        e.preventDefault();
        if (0 !== e.button) return;                               // Left button only
        if (states.READY !== context.state) return;               // Application state is default
        if (tls.modes.NONE === tls.getDrawingMode()) return;      // Drawing mode has been selected
        if (app.areas.select.isAreaTargeted(e.target)) return;    // No existing area to select
        if (!viewport.isPointerInImage(e.pageX, e.pageY)) return; // Pointer outside of image boundaries
        if (app.areas.draw.start(viewport.computeCoords(e.pageX, e.pageY), e.altKey)) {
          enter();
        }
      }

      function onDrawProgress(e) {
        e.preventDefault();
        app.areas.draw.move(viewport.computeCoords(e.pageX, e.pageY));
      }

      function onDrawEnd(e) {
        e.preventDefault();
        if (0 !== e.button) return;
        if (app.areas.draw.end(viewport.computeCoords(e.pageX, e.pageY))) {
          exit();
        }
      }

      function onDrawCancel(e) {
        e.preventDefault();
        if (utils.keyCodes.ESC === e.keyCode) {
          app.areas.draw.cancel();
          exit();
        }
      }

      return {
        enable : function() {
          if (enabled) return;
          addWel('click', onDrawStart);
          enabled = true;
        },
        disable : function() {
          if (!enabled) return;
          if (states.DRAWING === context.state) {
            app.areas.draw.cancel();
            exit();
          }
          rmWel('click', onDrawStart);
          enabled = false;
        }
      };

    })(); // areaDrawer

    /*
     * Area selection is achieved by clicking on existing area.
     * Simple click select the desired area unselecting others.
     * Holding shift key while clicking on existing areas achieves multiple selection (toggle effect).
     * ESC key unselect all selected areas.
     * DELETE key suppress all selected areas.
     */

    var areaSelector = (function() {
      
      var enabled = false;
      var ctxt = {
        moved : false,
        tracker : { start : { x : 0, y : 0 }, coords : { x : 0, y : 0, width : 0, height : 0 }, g : null, rct : null }
      }

      function enter() {
        doms.drawarea.classList.add(utils.clsNames.SELECTING);
        imageDragger.disable();
        areaDrawer.disable();
        areaMover.disable();
        areaEditor.disable();
        tls.freeze();
        rmWel('mousedown', onSelectStart);
        addWel('click', onSelectExit);
        addWel('mouseup', onSelectEnd);
        addWel('mousemove', onSelectProgress);
        document.removeEventListener('keydown', onKeyAction);
        context.state = states.SELECTING;
        ctxt.moved = false;
        ctxt.tracker.start.x = ctxt.tracker.start.y = 0;
        ctxt.tracker.coords.x = ctxt.tracker.coords.y = ctxt.tracker.coords.width = ctxt.tracker.coords.height = 0;
        ctxt.tracker.g = ctxt.tracker.rct = null;
      }

      function exit() {
        doms.drawarea.classList.remove(utils.clsNames.SELECTING);
        rmWel('click', onSelectExit);
        rmWel('mouseup', onSelectEnd);
        rmWel('mousemove', onSelectProgress);
        addWel('mousedown', onSelectStart);
        document.addEventListener('keydown', onKeyAction);
        imageDragger.enable();
        areaDrawer.enable();
        areaMover.enable();
        areaEditor.enable();
        tls.release();
        context.state = states.READY;
        ctxt.moved = false;
        ctxt.tracker.start.x = ctxt.tracker.start.y = 0;
        ctxt.tracker.coords.x = ctxt.tracker.coords.y = ctxt.tracker.coords.width = ctxt.tracker.coords.height = 0;
        ctxt.tracker.g = ctxt.tracker.rct = null;
      }

      function addTracker() {
        ctxt.tracker.g = document.createElementNS(utils.ns.SVG, 'g');
        doms.drawarea.appendChild(ctxt.tracker.g);
        ctxt.tracker.rct = document.createElementNS(utils.ns.SVG, 'rect');
        ctxt.tracker.g.appendChild(ctxt.tracker.rct);
        ctxt.tracker.rct.classList.add(utils.clsNames.TRACKER);
      }

      function removeTracker() {
        if (null != ctxt.tracker.g) {
          if (null != ctxt.tracker.rct) {
            ctxt.tracker.g.removeChild(ctxt.tracker.rct);
          }
          doms.drawarea.removeChild(ctxt.tracker.g);
        }
        ctxt.tracker.g = ctxt.tracker.rct = null;
      }

      function updateTracker() {
        if (null != ctxt.tracker.rct) {
          ctxt.tracker.rct.setAttribute('x', ctxt.tracker.coords.x);
          ctxt.tracker.rct.setAttribute('y', ctxt.tracker.coords.y);
          ctxt.tracker.rct.setAttribute('width', ctxt.tracker.coords.width);
          ctxt.tracker.rct.setAttribute('height', ctxt.tracker.coords.height);
        }
      }

      function onSelectStart(e) {
        e.preventDefault();
        if (0 !== e.button || states.READY !== context.state || e.ctrlKey || e.altKey) return; // Left button only
        if (tls.modes.NONE !== tls.getDrawingMode()) return;
        if (app.areas.edit.isGrabber(e.target)) return;
        if (app.areas.select.isAreaTargeted(e.target) && app.areas.select.isAreaSelected(e.target) && !e.shiftKey) return; // Is a move
        if (!e.shiftKey) {
          app.areas.select.areaUnselectAll();
        }
        enter();
        context.moved = false;
        let start = viewport.computeCoords(e.pageX, e.pageY);
        ctxt.tracker.start.x = start.x;
        ctxt.tracker.start.y = start.y;
        ctxt.tracker.coords.x = ctxt.tracker.coords.y = ctxt.tracker.coords.width = ctxt.tracker.coords.height = 0;
        addTracker();
      }

      function onSelectProgress(e) {
        e.preventDefault();
        if (0 === e.buttons || 0 !== e.button) {
          removeTracker();
          exit();
        } else if (states.SELECTING === context.state) {
          ctxt.moved = true;
          let point = viewport.computeCoords(e.pageX, e.pageY);
          ctxt.tracker.coords.width = Math.abs(point.x - ctxt.tracker.start.x);
          ctxt.tracker.coords.height = Math.abs(point.y - ctxt.tracker.start.y);
          ctxt.tracker.coords.x = (point.x < ctxt.tracker.start.x) ? point.x : ctxt.tracker.start.x;
          ctxt.tracker.coords.y = (point.y < ctxt.tracker.start.y) ? point.y : ctxt.tracker.start.y;
          updateTracker();
          app.areas.select.progress(ctxt.tracker.coords);
        }
      }

      function onSelectEnd(e) {
        e.preventDefault();
        if (states.SELECTING === context.state) {
          removeTracker();
          context.state = states.SELECTED;
        }
      }

      function onSelectExit(e) {
        e.preventDefault();
        if (!ctxt.moved) {
          if (app.areas.select.isAreaTargeted(e.target)) {
            if (!e.shiftKey) {
              app.areas.select.areaSelect(e.target);
            } else {
              app.areas.select.areaMultiSelect(e.target);
            }
          }
        }
        exit();
      }

      function onKeyAction(e) {
        e.preventDefault();
        switch(e.keyCode) {
        case utils.keyCodes.ESC:
          if (states.READY === context.state && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            app.areas.select.areaUnselectAll();
          }
          break;
        case utils.keyCodes.DEL:
          if (states.READY === context.state && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            app.areas.select.deleteSelection();
          }
          break;
        case utils.keyCodes.LEFT:
          if (states.READY === context.state && !e.shiftKey && (e.ctrlKey || e.metaKey)) {
            app.areas.rotate.step(utils.directions.RACLK);
          }
          break;
        case utils.keyCodes.RIGHT:
          if (states.READY === context.state && !e.shiftKey && (e.ctrlKey || e.metaKey)) {
            app.areas.rotate.step(utils.directions.RCLK);
          }
          break;
        default:
        }
      }

      return {
        enable : function() {
          if (enabled) return;
          addWel('mousedown', onSelectStart);
          document.addEventListener('keydown', onKeyAction);
          enabled = true;
        },
        disable : function() {
          if (!enabled) return;
          rmWel('mousedown', onSelectStart);
          document.removeEventListener('keydown', onKeyAction);
          enabled = false;
        }
      };

    })(); // areaSelector

    /*
     * Area moving starts by pressing mouse down on a selection of areas.
     * Moves are constrained so that moved figures remains in SVG container.
     * ESC key cancels selection move.
     */

    var areaMover = (function() {

      var enabled = false;

      function enter() {
        doms.drawarea.classList.add(utils.clsNames.MOVING);
        imageDragger.disable();
        areaDrawer.disable();
        areaEditor.disable();
        areaSelector.disable();
        tls.freeze();
        rmWel('mousedown', onMoveStart);
        addWel('click', onMoveExit);
        addWel('mouseup', onMoveEnd);
        addWel('mousemove', onMoveProgress);
        document.removeEventListener('keydown', onMoveStep);
        document.addEventListener('keydown', onMoveCancel);
        context.state = states.MOVING;
      }

      function exit() {
        doms.drawarea.classList.remove(utils.clsNames.MOVING);
        rmWel('click', onMoveExit);
        rmWel('mouseup', onMoveEnd);
        rmWel('mousemove', onMoveProgress);
        document.removeEventListener('keydown', onMoveCancel);
        addWel('mousedown', onMoveStart);
        document.addEventListener('keydown', onMoveStep);
        imageDragger.enable();
        areaDrawer.enable();
        areaEditor.enable();
        areaSelector.enable();
        tls.release();
        context.state = states.READY;
      }

      function onMoveStart(e) {
        e.preventDefault();
        if (0 !== e.button || e.shiftKey) return;  // Left button only
        if (states.READY != context.state) return;
        if (!app.areas.select.isAreaTargeted(e.target)) return;
        if (app.areas.select.isAreaSelected(e.target)) {
          app.areas.move.start(viewport.computeCoords(e.pageX, e.pageY));
          enter();
        }
      }
 
      function onMoveProgress(e) {
        e.preventDefault();
        if (0 === e.buttons || 0 !== e.button) {
          app.areas.move.cancel();
          exit();
        } else if (states.MOVING === context.state) {
          app.areas.move.progress(viewport.computeCoords(e.pageX, e.pageY));
        }
      }

      function onMoveEnd(e) {
        e.preventDefault();
        if (states.MOVING === context.state) {
          app.areas.move.end(viewport.computeCoords(e.pageX, e.pageY));
          context.state = states.MOVED;
        }
      }

      function onMoveExit(e) {
        e.preventDefault();
        exit();
      }

      function onMoveCancel(e) {
        e.preventDefault();
        if (utils.keyCodes.ESC === e.keyCode) {
          app.areas.move.cancel();
          context.state = states.MOVED;
        }
      }

      function onMoveStep(e) {
        e.preventDefault();
        switch(e.keyCode) {
        case utils.keyCodes.LEFT:
          if (states.READY === context.state && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            app.areas.move.step(-1, 0);
          }
          break;
        case utils.keyCodes.RIGHT:
          if (states.READY === context.state && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            app.areas.move.step(1, 0);
          }
          break;
        case utils.keyCodes.UP:
          if (states.READY === context.state && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            app.areas.move.step(0, -1);
          }
          break;
        case utils.keyCodes.DOWN:
          if (states.READY === context.state && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
            app.areas.move.step(0, 1);
          }
          break;
        default:
        }
      }

      return {
        enable : function() {
          if (enabled) return;
          addWel('mousedown', onMoveStart);
          document.addEventListener('keydown', onMoveStep);
          enabled = true;
        },
        disable : function() {
          if (!enabled) return;
          if (states.MOVING === context.state) {
            app.areas.move.cancel();
          }
          if (states.MOVING === context.state || states.MOVED === context.state) {
            exit();
          }
          rmWel('mousedown', onMoveStart);
          document.removeEventListener('keydown', onMoveStep);
          enabled = false;
        }
      };

    })(); // areaMover
 
    /*
     * Area editing starts by pressing mouse down on grabber of a selected area.
     * ESC key cancels selection editing.
     * Resizing cannot invert some figure dimension e.g. rectangle width becoming negative.
     * If reduced to 0, the are is removed.
     */

    var areaEditor = (function() {
      
      var enabled = false;

      function enter() {
        doms.drawarea.classList.add(utils.clsNames.EDITING);
        imageDragger.disable();
        areaDrawer.disable();
        areaMover.disable();
        areaSelector.disable();
        tls.freeze();
        rmWel('mousedown', onEditStart);
        addWel('click', onEditExit);
        addWel('mouseup', onEditEnd);
        addWel('mousemove', onEditProgress);
        document.addEventListener('keydown', onEditCancel);
        context.state = states.EDITING;
      }

      function exit() {
        doms.drawarea.classList.remove(utils.clsNames.EDITING);
        rmWel('click', onEditExit);
        rmWel('mouseup', onEditEnd);
        rmWel('mousemove', onEditProgress);
        document.removeEventListener('keydown', onEditCancel);
        addWel('mousedown', onEditStart);
        imageDragger.enable();
        areaDrawer.enable();
        areaMover.enable();
        areaSelector.enable();
        tls.release();
        context.state = states.READY;
      }

      function onEditStart(e) {
        e.preventDefault();
        if (0 !== e.button || e.shiftKey) return;  // Left button only
        if (states.READY != context.state) return;
        if (!app.areas.edit.isGrabber(e.target)) return;
        if (app.areas.edit.start(e.target, viewport.computeCoords(e.pageX, e.pageY))) {
          enter();
        }
      }

      function onEditProgress(e) {
        e.preventDefault();
        if (0 === e.buttons || 0 !== e.button) {
          app.areas.edit.cancel();
          exit();
        } else if (states.EDITING === context.state) {
          app.areas.edit.progress(viewport.computeCoords(e.pageX, e.pageY));
        }
      }

      function onEditEnd(e) {
        e.preventDefault();
        if (states.EDITING === context.state) {
          app.areas.edit.end(viewport.computeCoords(e.pageX, e.pageY));
          context.state = states.EDITED;
        }
      }

      function onEditExit(e) {
        e.preventDefault();
        exit();
      }

      function onEditCancel(e) {
        e.preventDefault();
        if (utils.keyCodes.ESC === e.keyCode) {
          app.areas.edit.cancel();
          context.state = states.EDITED;
        }
      }

      return {
        enable : function() {
          if (enabled) return;
          addWel('mousedown', onEditStart);
          enabled = true;
        },
        disable : function() {
          if (!enabled) return;
          if (states.EDITING === context.state) {
            app.areas.edit.cancel();
          }
          if (states.EDITING === context.state || states.EDITED === context.state) {
            exit();
          }
          rmWel('mousedown', onEditStart);
          enabled = false;
        }
      };

    })(); // areaEditor

    function hide(obj) {
      obj.style.display = 'none';
    }

    function show(obj) {
      obj.style.display = 'block';
    }

    function onLoadImage() {
      ftr.loading.hide();
      show(doms.aside);
      show(doms.workarea);
      viewport.setWorkingDims(doms.image.width, doms.image.height)
              .resize();
      context.state = states.READY;
      coordTracker.enable();
      imageDragger.enable();
      areaDrawer.enable();
      areaMover.enable();
      areaEditor.enable();
      areaSelector.enable();
    }

    return {

      init : function() {
        addWel('scroll', function(e) { viewport.computeOffset(); }, false );
        window.addEventListener('resize', function(e) { viewport.resize(); }, false);
        return this;
      },

      reset : function() {
        coordTracker.disable();
        imageDragger.disable();
        areaDrawer.disable();
        areaMover.disable();
        areaEditor.disable();
        areaSelector.disable();
        doms.image.src = '';
        hide(doms.workarea);
        hide(doms.aside);
        context.mode = 'new';
      },

      load : function(f) {
        ftr.loading.show();
        doms.image.onload = onLoadImage;
        doms.image.src = window.URL.createObjectURL(f);
        return this;
      }

    };

  })(); /* wks */

  /* Tool palette management */
  var tls = (function() {

    const doms = {
        btnHexDtr         : $('hex-d'),
        btnHexRct         : $('hex-r'),
        btnRectangle      : $('rectangle'),
        btnSquare         : $('square'),
        btnRhombus        : $('rhombus'),
        btnTriangleEql    : $('triangle-e'),
        btnTriangleIsc    : $('triangle-i'),
        btnTriangleRct    : $('triangle-r'),
        btnEllipse        : $('ellipse'),
        btnCircleDtr      : $('circle-d'),
        btnCircleCtr      : $('circle-c'),
        btnPolygon        : $('polygon'),

        btnHexDtrGrid     : $('hex-d-grid'),
        btnRectangleGrid  : $('rectangle-grid'),
        btnCircleDtrGrid  : $('circle-d-grid'),

        btnInnerGridScope : $('grid-scope-inner'),
        btnOuterGridScope : $('grid-scope-outer'),
        btnStdGridAlign   : $('grid-algn-std'),
        btnAltGridAlign   : $('grid-algn-alt')
    };

    const modes = utils.fgTypes;

    var context = {
        selected : null,
        mode : modes.NONE,
        allowGrid : false,
        freezed : true
    };

    function setDrawingMode() {
      switch(context.selected) {
      case doms.btnHexDtr:
        context.mode = modes.HEXDTR;
        break;
      case doms.btnHexRct:
        context.mode = modes.HEXRCT;
        break;
      case doms.btnRectangle:
        context.mode = modes.RECTANGLE;
        break;
      case doms.btnSquare:
        context.mode = modes.SQUARE;
        break;
      case doms.btnRhombus:
        context.mode = modes.RHOMBUS;
        break;
      case doms.btnTriangleEql:
        context.mode = modes.TRIANGLEEQL;
        break;
      case doms.btnTriangleIsc:
        context.mode = modes.TRIANGLEISC;
        break;
      case doms.btnTriangleRct:
        context.mode = modes.TRIANGLERCT;
        break;
      case doms.btnEllipse:
        context.mode = modes.ELLIPSE;
        break;
      case doms.btnCircleDtr:
        context.mode = modes.CIRCLEDTR;
        break;
      case doms.btnCircleCtr:
        context.mode = modes.CIRCLECTR;
        break;
      case doms.btnPolygon:
        context.mode = modes.POLYGON;
        break;

      case doms.btnHexDtrGrid:
        context.mode = modes.HEXDTRGRID;
        break;
      case doms.btnRectangleGrid:
        context.mode = modes.RECTANGLEGRID;
        break;
      case doms.btnCircleDtrGrid:
        context.mode = modes.CIRCLEDTRGRID;
        break;

      default:
        context.mode = modes.NONE;
      }
    }

    function isGridDrawingModeSelected() {
      let rtn = false;
      switch(context.selected) {
      case doms.btnHexDtrGrid:
      case doms.btnRectangleGrid:
      case doms.btnCircleDtrGrid:
        rtn = true;
        break;
      default:
      }
      return rtn;
    }

    function select(obj) {
      if (null != obj) {
        obj.classList.add(utils.clsNames.SELECTED);
      }
      context.selected = obj;
    }

    function unselect(obj) {
      if (obj != null) {
        obj.classList.remove(utils.clsNames.SELECTED);
      }
      context.selected = null;
    }

    function toggleSelect(obj) {
      var sel = (context.selected === obj) ? false : true;
      unselect(context.selected);
      if (sel) { select(obj); }
    }

    function toggleState(objFrom, objTo) {
      objFrom.style.display = 'none';
      objTo.style.display = 'inline';
    }

    function onDrawModeSelect(evt) {
      evt.preventDefault();
      toggleSelect(evt.target);
      setDrawingMode();
    }

    function onDrawGridModeSelect(evt) {
      evt.preventDefault();
      if(context.allowGrid) {
        toggleSelect(evt.target);
        setDrawingMode();
      }
    }

    function onDrawGridScopeSelect(evt) {
      evt.preventDefault();
      if(context.allowGrid) {
        if (evt.target === doms.btnInnerGridScope) {
          toggleState(doms.btnInnerGridScope, doms.btnOuterGridScope);
        } else {
          toggleState(doms.btnOuterGridScope, doms.btnInnerGridScope);
        }
      }
    }

    function onDrawGridAlignSelect(evt) {
      evt.preventDefault();
      if(context.allowGrid) {
        if (evt.target === doms.btnStdGridAlign) {
          toggleState(doms.btnStdGridAlign, doms.btnAltGridAlign);
        } else {
          toggleState(doms.btnAltGridAlign, doms.btnStdGridAlign);
        }
      }
    }

    function canGrid(obj) {
      let rtn = true;
      switch(obj.type) {
      case utils.fgTypes.NONE:
      case utils.fgTypes.HEXDTRGRID:
      case utils.fgTypes.RECTANGLEGRID:
      case utils.fgTypes.CIRCLEDTRGRID:
      case utils.fgTypes.POLYGON:
        rtn = false;
        break;
      default:
      }
      return rtn;
    }

    function gridEnable() {
      doms.btnHexDtrGrid.classList.remove(utils.clsNames.DISABLED);
      doms.btnRectangleGrid.classList.remove(utils.clsNames.DISABLED);
      doms.btnCircleDtrGrid.classList.remove(utils.clsNames.DISABLED);
      doms.btnInnerGridScope.classList.remove(utils.clsNames.DISABLED);
      doms.btnOuterGridScope.classList.remove(utils.clsNames.DISABLED);
      doms.btnStdGridAlign.classList.remove(utils.clsNames.DISABLED);
      doms.btnAltGridAlign.classList.remove(utils.clsNames.DISABLED);
    }

    function gridDisable() {
      doms.btnHexDtrGrid.classList.add(utils.clsNames.DISABLED);
      doms.btnRectangleGrid.classList.add(utils.clsNames.DISABLED);
      doms.btnCircleDtrGrid.classList.add(utils.clsNames.DISABLED);
      doms.btnInnerGridScope.classList.add(utils.clsNames.DISABLED);
      doms.btnOuterGridScope.classList.add(utils.clsNames.DISABLED);
      doms.btnStdGridAlign.classList.add(utils.clsNames.DISABLED);
      doms.btnAltGridAlign.classList.add(utils.clsNames.DISABLED);
    }

    return {

      init : function() {
        this.release();
      },

      reset : function() {
        toggleSelect(null);
        gridDisable();
        context.mode = modes.NONE;
        this.release();
      },

      getDrawingMode : function() {
        return context.mode;
      },
      
      freeze : function() {
        if (context.freezed) return;
        doms.btnHexDtr.removeEventListener('click', onDrawModeSelect, false);
        doms.btnHexRct.removeEventListener('click', onDrawModeSelect, false);
        doms.btnRectangle.removeEventListener('click', onDrawModeSelect, false);
        doms.btnSquare.removeEventListener('click', onDrawModeSelect, false);
        doms.btnRhombus.removeEventListener('click', onDrawModeSelect, false);
        doms.btnTriangleEql.removeEventListener('click', onDrawModeSelect, false);
        doms.btnTriangleIsc.removeEventListener('click', onDrawModeSelect, false);
        doms.btnTriangleRct.removeEventListener('click', onDrawModeSelect, false);
        doms.btnEllipse.removeEventListener('click', onDrawModeSelect, false);
        doms.btnCircleDtr.removeEventListener('click', onDrawModeSelect, false);
        doms.btnCircleCtr.removeEventListener('click', onDrawModeSelect, false);
        doms.btnPolygon.removeEventListener('click', onDrawModeSelect, false);
        doms.btnHexDtrGrid.removeEventListener('click', onDrawGridModeSelect, false);
        doms.btnRectangleGrid.removeEventListener('click', onDrawGridModeSelect, false);
        doms.btnCircleDtrGrid.removeEventListener('click', onDrawGridModeSelect, false);
        doms.btnInnerGridScope.removeEventListener('click', onDrawGridScopeSelect, false);
        doms.btnOuterGridScope.removeEventListener('click', onDrawGridScopeSelect, false);
        doms.btnStdGridAlign.removeEventListener('click', onDrawGridAlignSelect, false);
        doms.btnAltGridAlign.removeEventListener('click', onDrawGridAlignSelect, false);
        context.freezed = true;
      },

      release : function() {
        if (!context.freezed) return;
        doms.btnHexDtr.addEventListener('click', onDrawModeSelect, false);
        doms.btnHexRct.addEventListener('click', onDrawModeSelect, false);
        doms.btnRectangle.addEventListener('click', onDrawModeSelect, false);
        doms.btnSquare.addEventListener('click', onDrawModeSelect, false);
        doms.btnRhombus.addEventListener('click', onDrawModeSelect, false);
        doms.btnTriangleEql.addEventListener('click', onDrawModeSelect, false);
        doms.btnTriangleIsc.addEventListener('click', onDrawModeSelect, false);
        doms.btnTriangleRct.addEventListener('click', onDrawModeSelect, false);
        doms.btnEllipse.addEventListener('click', onDrawModeSelect, false);
        doms.btnCircleDtr.addEventListener('click', onDrawModeSelect, false);
        doms.btnCircleCtr.addEventListener('click', onDrawModeSelect, false);
        doms.btnPolygon.addEventListener('click', onDrawModeSelect, false);
        doms.btnHexDtrGrid.addEventListener('click', onDrawGridModeSelect, false);
        doms.btnRectangleGrid.addEventListener('click', onDrawGridModeSelect, false);
        doms.btnCircleDtrGrid.addEventListener('click', onDrawGridModeSelect, false);
        doms.btnInnerGridScope.addEventListener('click', onDrawGridScopeSelect, false);
        doms.btnOuterGridScope.addEventListener('click', onDrawGridScopeSelect, false);
        doms.btnStdGridAlign.addEventListener('click', onDrawGridAlignSelect, false);
        doms.btnAltGridAlign.addEventListener('click', onDrawGridAlignSelect, false);
        context.freezed = false;
      },

      isGridDrawingModeSelected,

      enableGridMode : function(obj) {
        if (!context.allowGrid && canGrid(obj)) {
          gridEnable();
          context.allowGrid = true;
        } else if (context.allowGrid && !canGrid(obj)) {
          if (isGridDrawingModeSelected()) {
            toggleSelect(null);
            context.mode = modes.NONE;
          }
          gridDisable();
          context.allowGrid = false;
        }
      },

      disableGridMode : function() {
        if (context.allowGrid) {
          if (isGridDrawingModeSelected()) {
            toggleSelect(null);
            context.mode = modes.NONE;
          }
          gridDisable();
          context.allowGrid = false;
        }
      },

      modes

    };

  })(); /* tools */

  /* Footer display management */
  var ftr = (function() {

    var doms = {
      info : $('selected-file'),
      cursor : $('coordinates'),
      load : $('load-indicator')
    };

    var coords = (function() {
      return {
        set : function(ci) { doms.cursor.innerHTML = 'x: ' + ci.x + ', ' + 'y: ' + ci.y; },
        clear : function() { doms.cursor.innerHTML = ''; }
      };
    })();

    var loading = (function() {
      return {
        show : function() { doms.load.style.display = 'inline'; },
        hide : function() { doms.load.style.display = 'none'; }
      };
    })();

    function clear() {
      while(doms.info.firstChild) {
        doms.info.removeChild(doms.info.firstChild);
      }
      doms.info.classList.remove('error');
      return this;
    }

    return {

      reset : function() {
        clear();
        var info = document.createElement('p');
        info.textContent = 'No image file selected';
        doms.info.appendChild(info);
        return this;
      },

      error : function(f) {
        clear();
        var info = document.createElement('p');
        info.textContent = 'No image file selected - ' + ((f == null) ? 'Too many files selected' : ( 'Selected file is not an image file: ' + f.name ));
        doms.info.classList.add('error');
        doms.info.appendChild(info);
        return this;
      },

      info : function(f) {
        clear();
        var output = [];
        output.push('<strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
            f.size, ' bytes, last modified: ',
            f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a');      
        var info = document.createElement('p');
        info.innerHTML = output.join(''); 
        var image = document.createElement('img');
        image.src = window.URL.createObjectURL(f);
        doms.info.appendChild(image);
        doms.info.appendChild(info);
        return this;
      },

      coords,
      loading

    };

  })(); /* footer */
  
  /* Menu management */
  var mnu = (function() {

    var doms = {
        newProjectBtn : $('new-project'),
        dropFileZone : $('drop-file-zone'),
        loadFileLbl : $('load-file-lbl'),
        loadFileInput : $('load-file')
    };

    function hide(obj) {
      obj.style.display = 'none';
    }

    function show(obj) {
      obj.style.display = 'inline';
    }

    function onNewProjectBtnClick(e) {
      e.preventDefault();
      app.newProject();
    }

    function onFileDragOver(e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    function onFileDragLeave(e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    function onFileDrop(e) {
      e.stopPropagation();
      e.preventDefault();
      app.processFileSelection(e.dataTransfer.files);
    }
    
    function onLoadFileInputChange(e) {
      e.preventDefault();
      app.processFileSelection(e.target.files);
    }
    
    return {

      init : function() {
        doms.newProjectBtn.addEventListener('click', onNewProjectBtnClick, false);
        doms.dropFileZone.draggable = true;
        doms.dropFileZone.addEventListener('dragover', onFileDragOver, false);
        doms.dropFileZone.addEventListener('dragleave', onFileDragLeave, false);
        doms.dropFileZone.addEventListener('drop', onFileDrop, false);
        doms.loadFileInput.addEventListener('change', onLoadFileInputChange, false);
        return this.reset();
      },

      reset : function() {
        doms.loadFileInput.style.opacity = '0';
        doms.loadFileInput.style.position = 'fixed';
        doms.loadFileInput.style.top = '-100em';
        doms.loadFileInput.value = '';
        show(doms.loadFileInput);
        show(doms.loadFileLbl);
        show(doms.dropFileZone);
        return this;
      },

      switchToEditMode : function() {
        hide(doms.dropFileZone)
        hide(doms.loadFileInput)
        hide(doms.loadFileLbl)
        return this;
      }

    };

  })(); /* mnu */

  /* Orchestrator */
  var app = (function() {

    /* Disable drag and drop on window */
    var dropFileZone = $('drop-file-zone');
    function preventWindowDrop(e) {
      if (e.target.id != dropFileZone) {
        e.preventDefault();
        e.dataTransfer.effectAllowed = "none";
        e.dataTransfer.dropEffect = "none";
      }
    }

    var areas = (function() {

      var doms = {
        drawarea : $('draw-area'),
        gridarea : $('grid-area')
      },
      context = {
        factory : {
          rectangle     : Rectangle,
          square        : Square,
          rhombus       : Rhombus,
          triangleIsc   : IsoscelesTriangle,
          triangleEql   : EquilateralTriangle,
          triangleRct   : RectangleTriangle,
          circleCtr     : Circle,
          circleDtr     : CircleEx,
          ellipse       : Ellipse,
          hexRct        : Hex,
          hexDtr        : HexEx,
          polygon       : Polygon,
          rectangleGrid : RectangleGrid,
          circleDtrGrid : CircleExGrid,
          hexDtrGrid    : HexExGrid
        },
        gen : null,
        selected : new MultiSelector(),
        lims : { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 },
        move : {
          origin : { x : 0, y : 0 }
        },
        edit : {
          action : 'none',
          origin : { x : 0, y : 0 }
        }
      };

      function create(alt, bond) {
        let ctor = context.factory[tls.getDrawingMode()];
        if (!ctor) {
          console.log('ERROR - Drawing mode not handled');
          return null;
        }
        return (null === bond) ? new ctor(doms.drawarea, alt) : new ctor(doms.drawarea, alt, bond, doms.gridarea);
      }

      var draw = (function() {

        return {

          start : function(pt, alt) {
            let bondElt = (tls.isGridDrawingModeSelected()) ? context.selected.get(0) : null; 
            context.selected.empty();
            context.gen = create(alt, bondElt);
            if (null == context.gen) {
              alert('Unable to draw selected area!');
              tls.disableGridMode();
              return false;
            }
            tls.freeze();
            context.gen.drawStart(pt);
            return true;
          },

          move : function(pt) {
            let width = doms.drawarea.getAttribute('width');
            let height = doms.drawarea.getAttribute('height');
            context.gen.drawMove(pt, width, height);
          },

          end : function(pt) {
            let complete = true;
            let width = doms.drawarea.getAttribute('width');
            let height = doms.drawarea.getAttribute('height');
            switch(context.gen.drawEnd(pt, width, height)) {
            case 'done':
              mdl.addArea(context.gen);
              context.selected.set(context.gen);
              tls.release();
              tls.enableGridMode(context.gen);
              context.gen = null;
              break;
            case 'error':
              alert('Invalid area dimensions!');
              tls.release();
              break;
            case 'continue':
            default:
              complete = false;
            }
            return complete;
          },

          cancel : function() {
            context.gen.drawCancel();
            context.gen = null;
            tls.release();
            tls.disableGridMode();
          }
          
        };

      })();

      var select = (function() {
        
        return {
          
          isAreaTargeted : function(obj) {
            if (!obj.parentNode) return false;
            if (obj.parentNode.tagName !== 'g') return false;
            if (obj.tagName !== 'rect' &&
                obj.tagName !== 'polygon' &&
                obj.tagName !== 'circle' &&
                obj.tagName !== 'ellipse') return false;
            if (obj.classList.contains(utils.clsNames.GRABBER)) return false;
            return true;
          },
          
          areaSelect : function(obj) {
            context.selected.set(mdl.findArea(obj));
            tls.enableGridMode(context.selected.get(0));
          },

          areaMultiSelect : function(obj) {
            context.selected.toggle(mdl.findArea(obj));
            if (context.selected.length() === 1) {
              tls.enableGridMode(context.selected.get(0));
            } else {
              tls.disableGridMode();
            }
          },

          isAreaSelected : function(obj) {
            return context.selected.has(mdl.findArea(obj));
          },
          
          areaUnselectAll : function() {
            context.selected.empty();
            tls.disableGridMode();
          },

          deleteSelection : function() {
            context.selected.sort(function(a,b) {
              // in order to delete grid before non-grid elements => avoid prompting when grid and bond are selected
              return (a.isGrid() ? -1 : 1);
            });
            context.selected.forEach(function(e) {
              mdl.removeArea(e);
            });
            context.selected.empty();
            tls.disableGridMode();
          },

          progress : function(coords) {
            mdl.forEachArea(function(e) {
              if (e.within(coords)) {
                if (!context.selected.has(e)) {
                  context.selected.toggle(e);
                }
              } else if (context.selected.has(e)) {
                context.selected.toggle(e);
              }
            });
            if (context.selected.length() === 1) {
              tls.enableGridMode(context.selected.get(0));
            } else {
              tls.disableGridMode();
            }
          }

        };

      })();

      var limits = (function() {
        
        return {

          reset() {
            context.lims.dxmin =
            context.lims.dxmax =
            context.lims.dymin =
            context.lims.dymax = 0;
          },

          compute4move() {
            let width = doms.drawarea.getAttribute('width');
            let height = doms.drawarea.getAttribute('height');
            let dlims = context.selected.reduce(function(r, e) {
              let l = e.moveDLims(width, height);
              if (r.dxmin < l.dxmin) r.dxmin = l.dxmin;
              if (r.dxmax > l.dxmax) r.dxmax = l.dxmax;
              if (r.dymin < l.dymin) r.dymin = l.dymin;
              if (r.dymax > l.dymax) r.dymax = l.dymax;
              return r;
            }, { dxmin : -1000000, dxmax : 1000000, dymin : -1000000, dymax : 1000000 });
            context.lims.dxmin = dlims.dxmin;
            context.lims.dxmax = dlims.dxmax;
            context.lims.dymin = dlims.dymin;
            context.lims.dymax = dlims.dymax;
          },

          compute4edit(action) {
            let width = doms.drawarea.getAttribute('width');
            let height = doms.drawarea.getAttribute('height');
            let dlims = context.selected.get(0).editDLims(action, width, height);
            context.lims.dxmin = dlims.dxmin;
            context.lims.dxmax = dlims.dxmax;
            context.lims.dymin = dlims.dymin;
            context.lims.dymax = dlims.dymax;
          },

          constrain(dx, dy) {
            let rtn = { dx : dx, dy : dy };
            if (dx < context.lims.dxmin) rtn.dx = context.lims.dxmin;
            if (dx > context.lims.dxmax) rtn.dx = context.lims.dxmax;
            if (dy < context.lims.dymin) rtn.dy = context.lims.dymin;
            if (dy > context.lims.dymax) rtn.dy = context.lims.dymax;
            return rtn;
          }

        };

      })();

      var move = (function() {
        
        function reset() {
          context.move.origin.x = 0;
          context.move.origin.y = 0;
          limits.reset();
        }

        return {
          
          start : function(pt) {
            context.move.origin.x = pt.x;
            context.move.origin.y = pt.y;
            limits.compute4move();
          },

          progress : function(pt) {
            let d = limits.constrain(pt.x - context.move.origin.x, pt.y - context.move.origin.y);
            context.selected.forEach(function(e) {
              e.dynamicMove(d.dx, d.dy);
            });
          },

          end : function(pt) {
            let d = limits.constrain(pt.x - context.move.origin.x, pt.y - context.move.origin.y);
            context.selected.forEach(function(e) {
              e.move(d.dx, d.dy);
            });
            reset();
          },

          cancel : function() {
            context.selected.forEach(function(e) {
              e.dynamicMove(0, 0);
            });
            reset();
          },

          step : function(dx, dy) {
            limits.compute4move();
            let d = limits.constrain(dx, dy);
            context.selected.forEach(function(e) {
              e.move(d.dx, d.dy);
            });
            reset();
          }

        };

      })();

      var edit = (function() {
        
        function reset() {
          context.edit.action = null;
          context.edit.origin.x = 0;
          context.edit.origin.y = 0;
        }

        return {

          isGrabber : function(obj) {
            return obj.classList.contains(utils.clsNames.GRABBER);
          },

          start : function(action, pt) {
            context.edit.action = action;
            context.edit.origin.x = pt.x;
            context.edit.origin.y = pt.y;
            limits.compute4edit(action);
            return context.selected.get(0).canEdit(action);
          },

          progress : function(pt) {
            let d = limits.constrain(pt.x - context.edit.origin.x, pt.y - context.edit.origin.y);
            context.selected.get(0).dynamicEdit(context.edit.action, d.dx, d.dy);
          },

          end : function(pt) {
            let d = limits.constrain(pt.x - context.edit.origin.x, pt.y - context.edit.origin.y);
            if (!context.selected.get(0).edit(context.edit.action, d.dx, d.dy)) {
              alert('Invalid area dimensions!');
            }
            reset();
          },

          cancel : function() {
            context.selected.get(0).dynamicMove(0,0);
            reset();
          }

        };

      })();

      var rotate = (function() {

        return {

          step : function(direction) {
            if (1 < context.selected.length()) {
              alert('Rotation is supported for a single selected area!');
              return;
            }
            let width = doms.drawarea.getAttribute('width');
            let height = doms.drawarea.getAttribute('height');
            if (!context.selected.get(0).rotateStep(direction, width, height)) {
              alert('ERROR - Rotation possibly makes area go beyond limits!');
            }
          }

        };

      })();

      return {
        draw, select, move, edit, rotate
      };

    })();

    window.addEventListener("dragenter", preventWindowDrop);
    window.addEventListener("dragover", preventWindowDrop);
    window.addEventListener("drop", preventWindowDrop);

    mnu.init();
    wks.init();
    tls.init();

    return {
      
      newProject : function() {
        if (!mdl.isModified() || confirm('Discard all changes?')) {
          ftr.reset();
          wks.reset();
          tls.reset();
          mnu.reset();
          mdl.reset();
        }
        return this;
      },

      processFileSelection : function(files) {
        var selFile = files[0];
        if (0 === files.length) {
          ftr.reset();
        } else if (1 < files.length) {
          ftr.error(null);
        } else if (mdl.setFile(selFile)) {
          mnu.switchToEditMode();
          ftr.info(selFile);
          wks.load(selFile);
        } else {
          ftr.error(selFile);
        }
        return this;
      },

      areas

    };
    
  })(); /* app */

})(); /* bhimc */