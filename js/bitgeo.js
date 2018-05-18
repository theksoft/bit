/**
 * Boardgame image tool (BiT) Analytic Geometry Definition
 * https://github.com/theksoft/bit
 *
 * Copyright 2017 Herve Retaureau
 * Released under the MIT license
 */

var bitgeo = (function(){

  'use strict'
  
  class Point {
    constructor(x, y) {
      x = x || 0
      y = y || 0
      this._coord = { x : x, y : y }
    }
    get x() { return this._coords.x }
    set x(x) { this._coords.x = x }
    get y() { return this._coords.y }
    set y(y) { this._coords.x = x }
    get coords() { return Object.assign({}, this._coords) }
    set coords(c) { Object.assign(this._coords, c) }
  }

  /*
   * EXPORTS
   */

  return {
    Point
  }

}()); // Analytic geometry definitions