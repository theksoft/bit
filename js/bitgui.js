/**
 * Boardgame image tool (BiT) GUI Definition
 * https://github.com/theksoft/bit
 *
 * Copyright 2017 Herve Retaureau
 * Released under the MIT license
 */

var bitgui = (function(){

  'use strict'

  class TButton {

    constructor(c) {
      if (!c.element)
        throw new Error('ERROR[TButton] Element must be defined!')
      this._enabled = true
      this._element = c.element
      this._action = c.action || (() => {})
      this._element.addEventListener('click', this.onClick.bind(this), false)
    }

    isDisabled() {
      return !this._enabled;
    }

    disable() {
      this._element.classList.add('disabled')
      this._enabled = false
    }

    enable() {
      this._element.classList.remove('disabled')
      this._enabled = true
    }

    onClick(evt) {
      evt.preventDefault()
      if (this._enabled) {
        if (this._element !== evt.target)
          throw new Error('ERROR[TButton] Target clicked is not the expected element!')
        this._action()
      }
    }

  }

  class TState {

    constructor(c) {
      if (!c.element)
        throw new Error('ERROR[TState] Element must be defined!')
      this._enabled = true
      this._element = c.element
      this._down = false
      this._action = c.action || (() => {})
      this._element.addEventListener('mousedown', this.onDown.bind(this), false)
      this._element.addEventListener('mouseup', this.onUp.bind(this), false)
      this._element.addEventListener('mouseleave', this.onUp.bind(this), false)
    }

    reset() {
      this._down = false
    }

    isDisabled() {
      return !this._enabled;
    }

    disable() {
      this._element.classList.add('disabled')
      this._enabled = false
    }

    enable() {
      this._element.classList.remove('disabled')
      this._enabled = true
    }

    onDown(evt) {
      evt.preventDefault()
      if (this._enabled && !this._down) {
        if (this._element !== evt.target)
          throw new Error('ERROR[TButton] Target with mouse down is not the expected element!')
        this._action(true)
        this._down = true
      }
    }

    onUp(evt) {
      evt.preventDefault()
      if (this._enabled && this._down) {
        if (this._element !== evt.target)
          throw new Error('ERROR[TButton] Target with mouse up is not the expected element!')
        this._action(false)
        this._down = false
      }
    }

  }

  class TToggle {

    constructor(c) {
      if (!c.map || !c.map.reduce((a,e) => a && e.element && e.value, true))
        throw new Error('ERROR[TToggle] Element must be provided in a a toggle map!')
      if (-1 === c.map.findIndex(e => (e.value === c.initialValue)))
        throw new Error('ERROR[TToggle] Toggle initial value must be defined in toggle map!')
      this._enabled = true;
      this._map = c.map
      this._state = 0
      this._initialValue = c.initialValue
      this._displayMode = c.displayMode || 'inline'
      this._action = c.action || (() => {})
      this._map.forEach(e => {
        e.element.addEventListener('click', this.onClick.bind(this), false)
      })
      this.reset()
    }

    reset() {
      this._map.forEach((e,i) => {
        e.element.style.display = (this._initialValue === e.value) ? this._displayMode : 'none'
        if (e.value === this._initialValue)
          this._state = i
      })
    }

    _switchTo(next) {
      this._map[this._state].element.style.display = 'none'
      this._map[next].element.style.display = this._displayMode
      this._state = next
    }

    set value(v) {
      if (this._enabled) {
        const next = this._map.findIndex(e => (e.value === v))
        if (-1 === next)
          throw new Error('ERROR[TToggle] Provided value to set is not defined in toggle map!')
        this._switchTo(next)
      }
    }

    get value() {
      return this._map[this._state].value
    }

    isDisabled() {
      return !this._enabled;
    }

    disable() {
      this._map.forEach(e => e.element.classList.add('disabled'))
      this._enabled = false
    }

    enable() {
      this._map.forEach(e => e.element.classList.remove('disabled'))
      this._enabled = true
    }

    onClick(evt) {
      evt.preventDefault()
      if (this._enabled) {
        if (this._map[this._state].element !== evt.target)
          throw new Error('ERROR[TToggle] Target clicked is not part of the toggle map!')
        this._switchTo((this._state + 1) % this._map.length)
        this._action(this._map[this._state].value)
      }
    }

  }

  class TNumber {

    constructor(c) {
      if (!c.element)
        throw new Error('ERROR[TNumber] Element must be defined!')
      this._element = c.element
      this._initialValue = c.initialValue
      this._action = c.action || (() => {})
      this.reset()
      this._element.addEventListener('click', this.onClick.bind(this), false)
    }

    reset() {
      this._element.value = this._element.defaultValue = this._initialValue.toString()
    }

    get value() {
      return parseInt(this._element.value)
    }

    set value(v) {
      this._element.value = this._element.defaultValue = v.toString()
    }

    isDisabled() {
      return (this._element.disabled)
    }

    disable() {
      this._element.disabled = true
    }

    enable() {
      this._element.disabled = false
    }

    onClick(evt) {
      if (this._element !== evt.target)
        throw new Error('ERROR[TNumber] Target clicked is not the expected element!')
      const v = this.value;
      if (parseInt(this._element.defaultValue) !== v) {
        this._element.defaultValue = v.toString()
        this._action(v)
      }
    }

  }

  class TRadioToggles {

    constructor(c) {
      if (!c.map || !c.map.reduce((a,e) => a && e.element && e.value, true))
        throw new Error('ERROR[TRadioToggles] Element must be provided in a toggle map!')
      this._enabled = true;
      this._map = c.map
      this._state = 0
      this._initialValue = c.initialValue
      this._noneValue = c.noneValue || 'none'
      this._selectClass = c.selectClass || 'selected'
      this._action = c.action || (() => {})
      this._map.forEach(e => {
        e.enabled = true;
        e.element.addEventListener('click', this.onClick.bind(this), false)
      })
      this.reset()
    }

    reset() {
      this._state = -1;
      this._map.forEach((e,i) => {
        if (e.value === this._initialValue) {
          e.element.classList.add(this._selectClass)
          this._state = i
        } else
          e.element.classList.remove(this._selectClass)
      })
    }

    isDisabled() {
      return !this._enabled;
    }

    disable(listValues) {
      if (listValues) {
        listValues.forEach(v => {
          const m = this._map.find(e => e.value === v)
          if (!m)
            throw new Error('ERROR[TRadioToggles] A provided value cannot be found in the radio toggle map!')
          m.element.classList.remove(this._selectClass)
          m.element.classList.add('disabled')
          m.enabled = false 
        })
      } else {
        this._map.forEach(e => {
          e.element.classList.remove(this._selectClass)
          e.element.classList.add('disabled')
        })
        this._enabled = false
      }
      if (-1 !== this._state && this._map[this._state].element.classList.contains('disabled'))
        this._state = -1;
    }

    enable(listValues) {
      if (listValues) {
        listValues.forEach(v => {
          const t = this._map.find(e => e.value === v)
          if (!t)
            throw new Error('ERROR[TRadioToggles] A provided value cannot be found in the radio toggle map!')
          t.element.classList.remove('disabled')
          t.enabled = true
        })
      } else {
        this._map.forEach(e => e.element.classList.remove('disabled'))
        this._enabled = true
      }
    }

    _unselect() {
      if (-1 !== this._state)
        this._map[this._state].element.classList.remove(this._selectClass)
    }

    onClick(evt) {
      evt.preventDefault()
      if (this._enabled) {
        const i = this._map.findIndex(e => (e.element === evt.target))
        if (-1 === i)
          throw new Error('ERROR[TRadioToggles] Target clicked cannot be found in the radio toggle map!')
        const t = this._map[i];
        if (t.enabled) {
          if (!t.element.classList.toggle(this._selectClass))
            this._state = -1
          else {
            this._unselect()
            this._state = i;
          }
          this._action(this.value)
        }
      }
    }

    get value() {
      return (-1 !== this._state) ? this._map[this._state].value : this._noneValue;
    }

    set value(v) {
      if (this._enabled) {
        const i = this._map.findIndex(e => (v === e.value))
        if (-1 === i || (this._state !== i && this._map[i].enabled)) {
          this._unselect()
          this._state = i
          if (-1 !== i)
            this._map[i].element.classList.add(this._selectClass)
        }
      }
    }

  }

  class MousePositionTracker {

    constructor(c) {
      if (!c.trackedElement || !c.displayElement)
        throw new Error('ERROR[MousePositionTracker] Mouse position tracker must be configured with a tracked element and a display element!')
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

  class ContainerMask {

    constructor(c) {
      if (!c.containerElement || !c.maskElement)
        throw new Error('ERROR[ContainerMask] Elements masking and to mask must be configured!')
      this._container = c.containerElement
      this._mask = c.maskElement
      this._mask.style.position = 'absolute'
      this._mask.style.border = '0'
      this._mask.style.margin = '0'
      this._mask.style.padding = '0'
    }

    maskElement() {
      const r = this._container.getBoundingClientRect()
      this._mask.style.display = 'block'
      this._mask.style.width = r.width + 'px'
      this._mask.style.height = r.height + 'px'
      this._mask.style.left = r.left + 'px'
      this._mask.style.top = r.top + 'px'
      this._mask.style.zIndex = (parseInt(this._container.style.zIndex) + 1).toString()
    }

    unmaskElement() {
      this._mask.style.display = 'none'
    }

  }

  class LocalProjectStore {

    constructor( appKey ) {
      this._appKey = appKey
    }

    _getAppStore() {
      return JSON.parse(window.localStorage.getItem(this._appKey) || '{}');
    }

    _setAppStore(s) {
      window.localStorage.setItem(this._appKey, JSON.stringify(s));      
    }

    write(projectName, value) {
      let s = this._getAppStore();
      s[projectName] = value;
      this._setAppStore(s);
    }

    read(projectName) {
      return this._getAppStore()[projectName];
    }

    remove(projectName) {
      let s = this._getAppStore();
      delete s[projectName];
      this._setAppStore(s);
    }

    list() {
      return Object.keys(this._getAppStore());
    }

    reset() {
      window.localStorage.removeItem(this._appKey);
    }

  }

  /*
   * EXPORTS
   */

  return {
    TButton, TToggle, TState, TRadioToggles,
    TNumber,
    MousePositionTracker, ContainerMask,
    LocalProjectStore
  }

}()); // GUI definitions