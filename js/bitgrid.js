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

  /*
   * RECTANGLE GRID 
   */

  class GridRectangle extends bitarea.Rectangle {
    
    constructor(parent, bond) {
      super(parent, false);
      this.bindTo(bond);
      this.type = types.GRIDRECTANGLE;
      this.grid = true;
    }

    bindTo(bond) {
      super.bindTo(bond, clsQualifiers.GRIDSCOPE);
      bond.bindTo(this, clsQualifiers.GRIDBOND);
    }

    unbindFrom(bond) {
      bond = bond || this.bonds[0];
      if (bond !== this.bonds[0]) {
        throw new Error('Error managing bond element(s)');
      }
      super.unbindFrom(bond, clsQualifiers.GRIDSCOPE)
      bond.unbindFrom(this, clsQualifiers.GRIDBOND);
    }

    unbindAll() {
      this.unbindFrom();
    }

  } // RECTANGLE GRID

  return {
    GridRectangle
  };

})(); /* BIT Grid Area Definition */
