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

  }

  /*
   * RECTANGLE EDITOR
   */

  class Rectangle extends Figure {

    constructor(fig) {
      super(fig);
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

/*
    forEach(f) {
      return this.selection.forEach(f);
    }

    sort(f) {
      return this.selection.sort(f);
    }

    reduce(f, i) {
      return this.selection.reduce(f, i);
    }
*/
  } // MULTI-SELECTOR

  return {
    clsStatus,
    MultiSelector
  };

})(); /* bitedit */
