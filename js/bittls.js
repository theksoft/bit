/**
 * Boardgame image tool (BiT) Tools Definition
 * https://github.com/theksoft/bit
 *
 * Copyright 2017 Herve Retaureau
 * Released under the MIT license
 */

var bittls = (function(){

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

    get element() {
      return this._element
    }

    isDisabled() {
      return !this._enabled
    }

    disable() {
      this._element.classList.add('disabled')
      this._enabled = false
    }

    enable() {
      this._element.classList.remove('disabled')
      this._enabled = true
    }

    freeze() {
      this._enabled = false
    }

    release() {
      this._enabled = !this._element.classList.contains('disabled')
    }

    tryAction() {
      if (this._enabled)
        this._action()
    }

    onClick(evt) {
      evt.preventDefault()
      this.tryAction()
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

    get element() {
      return this._element
    }

    reset() {
      this._down = false
    }

    isDisabled() {
      return !this._enabled
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
        this._action(true)
        this._down = true
      }
    }

    onUp(evt) {
      evt.preventDefault()
      if (this._enabled && this._down) {
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
      return !this._enabled
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
      return !this._enabled
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

  class MouseStateMachine {

    constructor(c, g) {
      if (!c.element)
        throw new Error('ERROR[MouseStateMachine] Mouse state machine must be configured with a valid element!')
      this._element = c.element
      this._translate = c.translate || ((x, y) => new bitgeo.Point(x,y))
      this._startOnPress = c.startOnPress || false
      this._trigger = c.trigger || (() => false)
      this._start = c.onStart || (() => true)
      this._progress = c.onProgress || (() => {})
      this._end = c.onEnd || (() => true)
      this._exit = c.onExit || (() => {})
      this._cancel = c.onCancel || (() => {})
      this._state = 'inactive'
      this._enabled = true
      this.onTryStart = this._onTryStart.bind(this);
      this.onProgress = this._onProgress.bind(this);
      this.onCheckEnd = this._onCheckEnd.bind(this);
      this.onExit = this._onExit.bind(this);
      this.onCheckCancel = this._onCheckCancel.bind(this);
      this._element.addEventListener((c.startOnPress) ? 'mousedown' : 'click', this.onTryStart, false)
      this._g = g
      if (g && !g.group.contains(this))
        g.group.add([{ machine : this, state : g.state }])
    }

    _activate() {
      if (this._startOnPress) {
        this._element.removeEventListener('mousedown', this.onTryStart, false)
        this._element.addEventListener('mouseup', this.onCheckEnd, false)
        this._element.addEventListener('click', this.onExit, false)
        this._element.addEventListener('mousemove',this.onProgress, false)
      } else {
        this._element.removeEventListener('click', this.onTryStart, false)
        this._element.addEventListener('click', this.onCheckEnd, false)
        this._element.addEventListener('mousemove',this.onProgress, false)
      }
      document.addEventListener('keydown', this.onCheckCancel, false)
      if (this._g)
        this._g.group.activate(this)
    }

    _inactivate() {
      document.removeEventListener('keydown', this.onCheckCancel, false)
      if (this._startOnPress) {
        this._element.removeEventListener('mousemove',this.onProgress, false)
        this._element.removeEventListener('click', this.onExit, false)
        this._element.removeEventListener('mouseup', this.onCheckEnd, false)
        this._element.addEventListener('mousedown', this.onTryStart, false)
      } else {
        this._element.removeEventListener('mousemove',this.onProgress, false)
        this._element.removeEventListener('click', this.onCheckEnd, false)
        this._element.addEventListener('click', this.onTryStart, false)
      }
      if (this._g)
        this._g.group.inactivate(this)
    }

    _onTryStart(e) {
      e.preventDefault()
      if (!this._trigger(e)) return
      if (0 === e.button) {
        if (this._start(this._translate(e.pageX, e.pageY), e, this._element)) {
          this._activate()
          this._state = 'active'
        }
      }
    }

    _onProgress(e) {
      e.preventDefault()
      if (this._startOnPress && (Math.floor(e.buttons/2)*2 === e.buttons)) {
        this._cancel(this._element)
        this._inactivate()
        this._exit(this._element)
        this._state = 'inactive'
      }
      if ('active' === this._state)
        this._progress(this._translate(e.pageX, e.pageY), e, this._element)
    }


    _onCheckEnd(e) {
      e.preventDefault()
      if ('active' === this._state) {
        if (!this._startOnPress && !(0 === e.button)) return
        if (this._end(this._translate(e.pageX, e.pageY), e, this._element)) {
          this._state = 'done'
          if (!this._startOnPress) {
            this._inactivate()
            this._exit(this._element)
            this._state = 'inactive'
          }
        }
      }
    }
  
    _onExit(e) {
      e.preventDefault()
      e.stopImmediatePropagation()
      this._inactivate()
      this._exit(this._element)
      this._state = 'inactive'
    }

    _onCheckCancel(e) {
      e.preventDefault()
      if ('Escape' === e.key) {
        this._cancel(this._element)
        this._state = 'done'
        if (!this._startOnPress) {
          this._inactivate();
          this._exit(this._element)
          this._state = 'inactive'
        }
      }
    }

    enable() {
      if (!this._enabled) {
        this._element.addEventListener((this._startOnPress) ? 'mousedown' : 'click', this.onTryStart, false)
        this._enabled = true;
      }
    }

    disable() {
      if (this._enabled) {
        if ('active' === this._state) {
          this._cancel(this._element)
          this._state = 'done';
        }
        if ('done' === this._state) {
          this._inactivate()
          this._state = 'inactive'
        }
        this._element.removeEventListener((this._startOnPress) ? 'mousedown' : 'click', this.onTryStart, false)
        this._enabled = false
      }
    }

  }

  class MouseStateMachineRadioGroup {

    constructor(list, noneState) {
      this._list = list || []
      this._state = this._noneState = noneState
    }
    
    inactivate(skip) {
      this._list.forEach(e => { if (e.machine !== skip) e.machine.enable() })
      this._state = this._noneState
    }

    activate(skip) {
      this._list.forEach(e => {
        if (e.machine !== skip) e.machine.disable()
        else this._state = e.state
      })
    }

    enable() {
      this.inactivate()
    }

    disable() {
      this.activate()
    }

    contains(item) {
      return this._list.find(e => (e.machine === item))
    }

    add(itemList) {
      itemList.forEach(e => this._list.push(e))
    }

    ready() {
      return (this._noneState === this._state)
    }

    get state() {
      return this._state
    }

    set state(s) {
      const enableAll = (s === this._noneState)
      this._list.forEach(e => {
        if (!enableAll && e.state !== s)
          e.machine.disable()
        else
          e.machine.enable()
      })
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
      this.onMove = this._onMove.bind(this)
      this.onLeave = this._onLeave.bind(this)
    }

    _onMove(e) {
      const p = this._translate(e.pageX, e.pageY)
      this._display.innerHTML = 'x: ' + p.x + ', y: ' + p.y
    }

    _onLeave(e) {
      this._display.innerHTML = ''
    }

    enable() {
      if (!this._enabled) {
        this._tracked.addEventListener('mousemove', this.onMove, false)
        this._tracked.addEventListener('mouseleave', this.onLeave, false)
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
      if (!appKey)
        throw new Error('ERROR[LocalProjectStore] Application name must be defined!')
      this._appKey = appKey
    }

    _getAppStore() {
      return JSON.parse(window.localStorage.getItem(this._appKey) || '{}')
    }

    _setAppStore(s) {
      try {
        window.localStorage.setItem(this._appKey, JSON.stringify(s))
      } catch(e) {
        alert('[ERROR] ' + e.message)
        return false
      }
      return true
    }

    write(projectName, value) {
      let s = this._getAppStore()
      s[projectName] = value
      if (!this._setAppStore(s)) {
        delete s[projectName]
        return false
      }
      return true
    }

    read(projectName) {
      return this._getAppStore()[projectName]
    }

    remove(projectName) {
      let s = this._getAppStore()
      delete s[projectName]
      this._setAppStore(s)
    }

    get list() {
      return Object.keys(this._getAppStore())
    }

    reset() {
      window.localStorage.removeItem(this._appKey)
    }

  }

  class DialogForm {

    constructor(c) {
      let e;
      this._form = c.form
      this._textRecipients = c.textRecipients || []
      this._keyHandler = c.keyHandler || (() => {})
      this.onKeyAction = this._onKeyAction.bind(this)
      this._textRecipients.forEach(e => e.addEventListener('keydown', e => { if ('Escape' !== e.key) e.stopPropagation() }, false))
      e = c.form.querySelector('.close');
      if (e) e.addEventListener('click', this._onCloseClick.bind(this), false)
      e = c.form.querySelector('.cancel');
      if (e) e.addEventListener('click', this._onCancelClick.bind(this), false)
    }

    show() {
      document.addEventListener('keydown', this.onKeyAction, false)
      this._form.style.display = 'block'
    }

    close() {
      document.removeEventListener('keydown', this.onKeyAction, false)
      this._form.style.display = 'none'
    }

    _onCancel() {
      this.close()
    }

    _onClose() {
      this.close()
    }

    _onCancelClick(e) {
      e.preventDefault()
      this._onCancel()
    }

    _onCloseClick(e) {
      e.preventDefault()
      this._onClose()
    }

    _onKeyAction(e) {
      if('Escape' === e.key) {
        e.preventDefault()
        this._onCancel()
      } else
        this._keyHandler(e)
    }

  }

  function selectFiles(accept, multiple) {
    return new Promise((resolve, reject) => {
      let input = document.createElement('input')
      input.type = 'file'
      input.style.display = 'none'
      input.setAttribute('accept', accept)
      if (!multiple) {
        input.addEventListener('change', e => { if (e.target.files.length) resolve(e.target.files[0]) }, false)
      } else {
        input.setAttribute('multiple', true)
        input.addEventListener('change', e => { if (e.target.files.length) resolve(e.target.files) }, false)
      }
      input.click()
    })
  }

  function readFileDataUrl(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = e => reject(e)
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(file)
    })
  }

  function readFileText(file) {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onerror = e => reject(e)
      reader.onload = () => resolve(reader.result)
      reader.readAsText(file)
    })
  }

  function _saveAs(getURL, releaseURL, filename) {
    let url, a
    url = getURL()
    a = document.createElement('a')
    document.body.appendChild(a)
    a.style.display = 'none'
    a.href = url
    a.download = filename
    a.onClick = e => {
      document.body.removeChild(e)
      releaseURL(url)
    }
    a.click()
  }

  function saveUrlAs(url, filename) {
    _saveAs(() => url, () => {}, filename)
  }

  function saveDataAs(data, filename, mime) {
    let blob, url, a
    blob = new Blob([data], {type: mime || 'application/octet-stream'})
    _saveAs(() => window.URL.createObjectURL(blob), u => window.URL.revokeObjectURL(u), filename)
  }

  function saveObjectAs(object, filename) {
    saveDataAs(JSON.stringify(object), filename, 'application/json')
  }

  function selectText(node) {
    if (document.body.createTextRange) {
      const range = document.body.createTextRange()
      range.moveToElementText(node)
      range.select()
    } else if (window.getSelection) {
      const selection = window.getSelection()
      const range = document.createRange()
      range.selectNodeContents(node)
      selection.removeAllRanges()
      selection.addRange(range)
    } else {
      console.warn("ERROR: Could not select text in node - Unsupported browser!")
    }
  }

  function unselect() {
    if (window.getSelection) {
      window.getSelection().removeAllRanges()
    } else {
      console.warn("ERROR: Could not clear selection - Unsupported browser!")
    }
  }

  function copyText(node) {
    node.select()
    document.execCommand('Copy')
  }

  function copySelectedText() {
    document.execCommand('Copy')
  }

  function loadImage(node, url) {
    return new Promise((resolve, reject) => {
      let cleanup = () => node.onload = node.onerror = () => {}
      node.onload = () => { cleanup(); resolve() }
      node.onerror = e => { cleanup(); reject(new Error('Unable to load image')) }
      node.src = url
    })
  }

  /*
   * EXPORTS
   */

  return {
    // Classes
    TButton, TToggle, TState, TRadioToggles,
    TNumber,
    MouseStateMachine, MouseStateMachineRadioGroup,
    MousePositionTracker, ContainerMask,
    LocalProjectStore, DialogForm,
    // Functions
    selectFiles, readFileDataUrl, readFileText, saveUrlAs, saveDataAs, saveObjectAs,
    selectText, unselect, copyText, copySelectedText,
    loadImage
  }

}());
