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

  // FIGURE EDITOR

  class Figure {

    constructor(fig) {
      if (this.constructor == Figure.constructor) {
        throw new Error('Invalid Figure generator constructor call: abstract class');
      }
      this.figure = fig;
    }

    is(fig) {
      return (fig === this.figure) ? true : false;
    }

    markSelected() {
      if (this.figure) {
        this.figure.addClass(clsStatus.SELECTED);
//        this.createGrabbers();
//        this.bonds.forEach(function(e) {
//          e.dom.classList.add(utils.clsNames.HIGHLIGHTED);
//        });
      }
    }

    markUnselected() {
      if (this.figure) {
        this.figure.removeClass(clsStatus.SELECTED);
//        this.destroyGrabbers();
//        this.bonds.forEach(function(e) {
//          e.dom.classList.remove(utils.clsNames.HIGHLIGHTED);
//        });
      }
    }

    enableEdition() {
/*      this.grabbers.forEach(function(e) {
        e.enable();
      });*/
    }

    disableEdition() {
/*      this.grabbers.forEach(function(e) {
        e.disable();
      });*/
    }

    getFigure() {
      return this.figure;
    }

    computeMoveDLims(wmax, hmax) {
      console.log('computeMoveDLims() not defined - ' + wmax + 'x' + hmax);
      return { dxmin : 0, dxmax : 0, dymin : 0, dymax : 0 };
    }

    computeMoveCoords(dx, dy) {
      console.log('computeMoveCoords() not defined');
      return this.figure.getCoords();
    }

    drawToOffset(dx, dy) {
      this.figure.redraw(this.computeMoveCoords(dx, dy));
    }

    moveToOffset(dx, dy) {
      this.figure.setCoords(this.computeMoveCoords(dx, dy));
      this.figure.redraw();
    }

  }

  /*
   * RECTANGLE EDITOR
   */

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

  }

  /*
   * EDITOR FACTORY
   */

  var factory = {
    rectangle : Rectangle
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

/*
    get(id) {
      return this.selection[id];
    }
    
    length() {
      return this.selection.length;
    }
*/

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

  class Mover {

    constructor(selector) {
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

  }

  return {
    clsStatus,
    MultiSelector, Mover
  };

})(); /* bitedit */
