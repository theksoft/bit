/**
 * Boardgame image tool (BiT) GUI Definition
 * https://github.com/theksoft/bit
 *
 * Copyright 2017 Herve Retaureau
 * Released under the MIT license
 */

var bitgui = (function(){

  'use strict'

  class MousePositionTracker {

    constructor(c) {
      if (!c.trackedElement || !c.displayElement)
        throw new Error('ERROR: Mouse position tracker must be configured with a tracked element and a display element!')
      this._tracked = c.trackedElement;
      this._display = c.displayElement;
      this._translate = c.translate || ((x, y) => new bitgeo.Point(x,y))
      this._enabled = false
    }

    onMove(e) {
      const p = this._translate(e.pageX, e.pageY)
      this._display.innerHTML = 'x: ' + p.x + ', y: ' + p.y
    }

    onLeave(e) {
      this._display.innerHTML = ''
    }

    enable() {
      if (!this._enabled) {
        this._tracked.addEventListener('mousemove', this.onMove.bind(this), false)
        this._tracked.addEventListener('mouseleave', this.onLeave.bind(this), false)
        this._enabled = true
      }
    }

    disable() {
      if (this._enabled) {
        this._tracked.removeEventListener('mousemove', this.onMove, false)
        this._tracked.removeEventListener('mouseleave', this.onLeave, false)
        this._enabled = false
      }
    }

  }

  /*
   * EXPORTS
   */

  return {
    MousePositionTracker
  }

}()); // GUI definitions