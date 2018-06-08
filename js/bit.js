/**
 * Boardgame image tool (BiT)
 * https://github.com/theksoft/bit
 *
 * Copyright 2017 Herve Retaureau
 * Released under the MIT license
 */

var bit = (function() {
  'use strict';

  function $(s) { return document.getElementById(s); }

  var utils = (function() {

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
      GRIDRECTANGLE : 'gridRectangle',
      GRIDCIRCLE    : 'gridCircle',
      GRIDHEX       : 'gridHex'
    };

    const clsActions = {
      DRAGGING      : 'dragging',
      DRAWING       : 'drawing',
      TRACKING      : 'tracking',
      MOVING        : 'moving',
      EDITING       : 'editing'
    };

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

    return {

      leftButton : e => (0 === e.button) ? true : false,
      leftButtonHeld : e => Math.floor(e.buttons/2)*2 !== e.buttons ? true : false,
      noMetaKey : e => (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) ? true : false,
      ctrlKey : e => (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) ? true : false,
      ctrlMetaKey : e => ((e.ctrlKey || e.metaKey) && !e.altKey && !e.shiftKey) ? true : false,
      ctrlMetaShiftKey : e => ((e.ctrlKey || e.metaKey) && !e.altKey && e.shiftKey) ? true : false,
      selectText, unselect,
      fgTypes,
      clsActions

    };

  })();
  
  /*
   * DATA MODEL MANAGEMENT
   */

  class Model {

    constructor() {
      this._modified = false
      this._imgTypes = ['image/jpeg', 'image/gif', 'image/png']
      this._file = { dataURL : '', filename : '', type : '', size : 0 }
      this._info = { name: '', alt : '' }
      this._image = { width : 0, height : 0 }
      this._areas = []
      this.checkImgFile = this._checkImgFile.bind(this)
    }

    reset() {
      this._modified = false
      this._file.dataURL = this._file.filename = this._file.type = ''
      this._file.size = 0
      this._info.name = this._info.alt = ''
      this._image.width = this._image.height = 0
      this._areas.sort((a,b) => a.isGrid ? -1 : 1)
      this._areas.forEach(e => e.remove())
      this._areas.splice(0, this._areas.length)
    }

    get modified() {
      return this._modified
    }

    set modified(v) {
      this._modified = (v) ? true : false
    }

    _checkImgFile(f) {
      return this._imgTypes.includes(f.type)
    }

    set file(f) {
      if (!this._checkImgFile(f))
        throw new Error('ERROR[Model] ' + f.type + ' Invalid image file type!')
      var reader = new FileReader()
      reader.addEventListener('load', () => this._file.dataURL = reader.result, false)
      reader.readAsDataURL(f)
      this._file.filename = f.name
      this._file.type = f.type
      this._file.size = f.size
    }

    get filename() {
      return this._file.filename; 
    }

    set info(data) {
      this._info.name = data.name
      this._info.alt = data.alt
    }

    get info() {
      return Object.assign({}, this._info)
    }

    get areas() {
      return this._areas.slice()
    }

    forEachArea(f) {
      return this._areas.forEach(f)
    }

    addArea(area) {
      this._areas.push(area)
    }

    addAreas(areas) {
      areas.forEach(e => this._areas.push(e))
    }

    removeArea(area) {
      if(-1 != this._areas.indexOf(area)) {
        if (!area.isGrid && area.hasBonds()) {
          if (false == confirm("Deleting this element will automatically delete grid built from it.\nDo you still want to proceed to element deletion ?")) {
            return
          }
          let bonds = area.copyBonds()
          bonds.forEach(e => {
            let j = this._areas.indexOf(e)
            e.remove()
            this._areas.splice(j, 1)
          })
          bonds.splice(0, bonds.length)
        }
        let i = this._areas.indexOf(area)
        area.remove()
        this._areas.splice(i, 1)
      }
    }

    findArea(obj) {
      return this._areas.find(e => e.is(obj))
    }

    freezeGridArea(grid, areas, specialize) {
      if (!grid.isGrid ||
          false === confirm("Freezing this element will automatically delete grid dependencies and generate independent elements.\nDo you still want to proceed to grid freeze ?")) {
        return false
      }
      let i = this._areas.indexOf(grid)
      grid.freezeTo(areas, specialize)
      grid.remove()
      this._areas.splice(i, 1)
      areas.forEach(e => this._areas.push(e))
      return true;
    }

    toStore(a2s) {
      let rtn = {}
      rtn.dataURL = this._file.dataURL
      rtn.name = this._info.name
      rtn.alt = this._info.alt
      rtn.filename = this._file.filename
      rtn.type = this._file.type
      rtn.size = this._file.size
      rtn.areas = []
      this._areas.sort((a,b) => a.isGrid ? 1 : -1)
      this._areas.forEach((e,i,a) => rtn.areas.push(a2s(e, i, a)))
      return rtn
    }
    
    fromStore(project, s2a) {
      this._modified = false
      this._file.dataURL = project.dataURL
      this._info.name = project.name
      this._info.alt = project.alt
      this._file.filename = project.filename
      this._file.type = project.type
      this._file.size = project.size
      this._areas = []
      project.areas.forEach((e,i) => this._areas.push(s2a(e, i, this._areas)))
      return true;
    }

    toClipboard(selected, a2c) {
      let rtn = {}
      rtn.areas = []
      this._areas.sort((a,b) => a.isGrid ? 1 : -1)
      this._areas.forEach((e,i,a) => rtn.areas.push(a2c(e, i, a)))
      rtn.selected = []
      selected.forEach((e) => rtn.selected.push(this._areas.indexOf(e)))
      rtn.basic = selected.reduce((a,e) => a && !e.isGrid, true)
      return rtn
    }

    fromClipboard(c, c2a, deep) {
      let area, copied = [];
      if (c.basic || (!deep && !c.unsafe)) {
        c.selected.forEach(e => {
          area = c2a(c.areas[e], e, this._areas)
          copied.push(area)
        })
      } else {
        // Deep copy - include grid bonds if not originally selected
        let insert, index, deep
        deep = c.selected.slice().sort((a,b) => c.areas[a].isGrid ? 1 : -1)
        insert = deep.findIndex(e => c.areas[e].isGrid)
        c.selected.forEach(e => {
          area = c.areas[e]
          if (area.isGrid) {
            index = deep.indexOf(area.bonds[0])
            if (-1 === index) {
              deep.splice(insert, 0, area.bonds[0])
              index = insert++
            }
            area.bonds[0] = index
          }
        })
        deep.forEach((e,i) => {
          c.areas[e].index = i
          area = c2a(c.areas[e], i, copied)
          copied.push(area)
        });
      }
      return copied
    }

  }

  /*
   * STORE
   */

  class Store extends bittls.LocalProjectStore {
    constructor(c) {
      super('BiT')
      this._workspace = c.workspace
      this.a2s = this._a2s.bind(this)
      this.s2a = this._s2a.bind(this)
    }
    _a2s(area, index, areas) {
      return area.toRecord(index, areas)
    }
    _s2a(stored, index, areas) {
      let area
      if (index !== stored.index || index != areas.length) {
        console.log('ERROR - Corrupted stored record with bad index')
        return null
      }
      area = (!stored.isGrid)
          ? bitarea.createFromRecord(stored, this._workspace.getParent())
          : bitgrid.createFromRecord(stored, this._workspace.getParent(), this._workspace.getGridParent(), areas)
      return area
    }
  }

  /*
   * PSEUDO-CLIPBOARD MANAGEMENT 
   */

  class Clipboard {

    constructor(c) {
      this._workspace = c.workspace
      this._copyOffset = c.copyOffset
      this._data = null
      this._basic = true
      this._unsafe = false
      this._offset = 0
      this.a2c = this._a2c.bind(this)
      this.c2a = this._c2a.bind(this)
    }

    get offset() {
      return this._offset
    }

    set data(c) {
      this._data = JSON.stringify(c)
      this._basic = c.basic
      this._unsafe = false
      this._offset = 0
      c = null
    }

    get data() {
      let c = JSON.parse(this._data || '{}')
      c.unsafe = this._unsafe
      this._offset += this._copyOffset
      return c
    }

    isCopyUnsafe() {
      return this._unsafe
    }

    setCopyUnsafe() {
      if (!this._basic) this._unsafe = true
    }

    _a2c(area, index, areas) {
      return area.toRecord(index, areas)
    }

    _c2a(record, index, areas) {
      let area
      if (index !== record.index || index > areas.length) {
        console.log('ERROR - Corrupted clipboard record with bad index')
        return null
      }
      area = (!record.isGrid)
          ? bitarea.createFromRecord(record, this._workspace.getParent())
          : bitgrid.createFromRecord(record, this._workspace.getParent(), this._workspace.getGridParent(), areas)
      return area
    }

  }

  /*
   * WORKAREA MANAGEMENT
   */

  const states = {
    OPEN      : 'open',
    READY     : 'ready',
    DRAGGING  : 'dragging',
    DRAWING   : 'drawing',
    SELECTING : 'selecting',
    MOVING    : 'moving',
    EDITING   : 'editing',
    PREVIEW   : 'preview'
  };

  // VIEWPORT COMPUTATION 
  // Workarea elements size and coordinate offsets.

  class Viewport {

    constructor(c) {
      this._wks = c.wks
      this._footer = c.footer
      this._aside = c.aside
      this._container = c.container
      this._workarea = c.workarea
      this._drawarea = c.drawarea
      this._gridarea = c.gridarea
      this._image = c.image
      this._offset = new bitgeo.Point()
      this.translateCoords = this.computeCoords.bind(this)
      c.workarea.addEventListener('scroll', this.computeOffset.bind(this), false)
      window.addEventListener('resize', this.resize.bind(this), false)
    }

    setWorkingDims(w,h) {
      this._drawarea.setAttribute('width', w)
      this._drawarea.setAttribute('height', h)
      this._gridarea.setAttribute('width', w)
      this._gridarea.setAttribute('height', h)
      this._container.style.width = w + 'px'
      this._container.style.height = h + 'px'
      return this
    }

    setViewDims() {
      let fc, ac, wc, width, height
      fc = this._footer.getBoundingClientRect()
      wc = this._wks.getBoundingClientRect()
      ac = this._aside.getBoundingClientRect()
      width = Math.floor(fc.right - (ac.right - ac.left) - wc.left - 5)
      height = Math.floor(fc.top - wc.top - 5)
      this._workarea.style.width = width + 'px'
      this._workarea.style.height = height + 'px'
      return this
    }

    resize() {
      this.setViewDims()
          .computeOffset()
      return this
    }

    computeOffset() {
      const coords = this._container.getBoundingClientRect()
      this._offset.x = Math.round(coords.left + window.pageXOffset)
      this._offset.y = Math.round(coords.top + window.pageYOffset)
      return this
    }

    computeCoords(x,y) {
      const p = new bitgeo.Point(x - this._offset.x, y - this._offset.y)
      return p.coords
    }

    isPointerInImage(x, y) {
      const coords = this.computeCoords(x, y)
      return (0 > coords.x || 0 > coords.y || this._image.width < coords.x || this._image.height < coords.y) ? false : true
    }

  }

  // BACKGROUND IMAGE DRAGGER
  // Dragging start with a mouse down on image and CTRL key
  // Dragging is active as long as the pointer is in the workarea and button is down
  // Dragging stop on mouse up or if a move w/o buttons down is caught
  // Dragging move and top listeners are installed only if an image drag is started.
  
  class ImageDragger extends bittls.MouseStateMachine {
    constructor(c) {
      super({
        startOnPress : true,
        element : c.workarea,
        translate : c.viewport.translateCoords,
        trigger : e => {
          return (this._g.group.ready() && !this._handlers.prevent(e) && utils.ctrlKey(e) && this._viewport.isPointerInImage(e))
        },
        onStart : (p,e,w) => {
          w.classList.add(utils.clsActions.DRAGGING)
          this._handlers.onStart()
          return true
        },
        onProgress : (p,e,w) => {
          w.scrollLeft -= e.movementX
          w.scrollTop  -= e.movementY
        },
        onExit : w => {
          w.classList.remove(utils.clsActions.DRAGGING)
          this._handlers.onExit()
        }
      }, { group : c.group, state : states.DRAGGING })
      this._handlers = c.handlers
      this._viewport = c.viewport
    }
  }
  
  // AREA DRAWER MANAGEMENT
  // Drawing start with a click on image
  // Additional click add points to some drawing e.g. polygon
  // Drawing stop on further click if drawer asserts it
  // Drawing is canceled on ESC key pressed

  class AreaDrawer extends bittls.MouseStateMachine {
    constructor(c) {
      super({
        startOnPress : false,
        element : c.workarea,
        translate : c.viewport.translateCoords,
        trigger : e => {
          return (this._g.group.ready() && !this._handlers.prevent(e) && this._viewport.isPointerInImage(e))
        },
        onStart : (p,e) => {
          if (this._handlers.onStart(this._drawarea, p, e.altKey, this._gridarea)) {
            this._drawarea.classList.add(utils.clsActions.DRAWING)
            return true
          }
          return false
        },
        onProgress : p => this._handlers.onProgress(this._drawarea, p),
        onEnd : p => this._handlers.onEnd(this._drawarea, p),
        onExit : () => this._drawarea.classList.remove(utils.clsActions.DRAWING),
        onCancel : () => this._handlers.onCancel()
      }, { group : c.group, state : states.DRAWING })
      this._handlers = c.handlers
      this._viewport = c.viewport
      this._drawarea = c.drawarea
      this._gridarea = c.gridarea
    }
  }
  
  // AREA SELECTOR
  // Area selection is achieved by clicking on existing area.
  // Simple click select the desired area unselecting others.
  // Holding shift key while clicking on existing areas achieves multiple selection (toggle effect).
  // ESC key unselect all selected areas.
  // DELETE key suppress all selected areas.
  
  class AreaSelector extends bittls.MouseStateMachine {

    constructor(c) {
      super({
        startOnPress : true,
        element : c.workarea,
        translate : c.viewport.translateCoords,
        trigger : e => {
          return (this._g.group.ready() && !this._handlers.preventTracking(e))
        },
        onStart : (p,e) => {
          this._handlers.onTrackStart(this._drawarea, p)
          this._drawarea.classList.add(utils.clsActions.TRACKING)
          return true;
        },
        onProgress : p => this._handlers.onTrackProgress(p),
        onEnd : () => this._handlers.onTrackEnd(),
        onExit : () => {
          this._handlers.onTrackExit()
          this._drawarea.classList.remove(utils.clsActions.TRACKING)
        },
        onCancel : () => this._handlers.onTrackCancel()
      }, { group : c.group, state : states.SELECTING })
      this._handlers = c.handlers
      this._viewport = c.viewport
      this._drawarea = c.drawarea
      this.onSelect = this._onSelect.bind(this)
      this.onKeyAction = this._onKeyAction.bind(this)
    }

    _activate() {
      this._element.removeEventListener('click', this.onSelect)
      document.removeEventListener('keydown', this.onKeyAction, false)
      super._activate()
    }

    _inactivate() {
      this._element.addEventListener('click', this.onSelect)
      document.addEventListener('keydown', this.onKeyAction, false)
      super._inactivate()
    }

    enable() {
      if (!this._enabled) {
        super.enable()
        this._element.addEventListener('click', this.onSelect)
        document.addEventListener('keydown', this.onKeyAction, false)
      }
    }

    disable() {
      if (this._enabled) {
        super.disable()
        this._element.removeEventListener('click', this.onSelect)
        document.removeEventListener('keydown', this.onKeyAction, false)
      }
    }

    _onSelect(e) {
      e.preventDefault()
      if (!this._g.group.ready() || this._handlers.preventSelect(e)) return
      this._handlers.onSelect(e.target, e.shiftKey)
    }

    _onKeyAction(e) {
      e.preventDefault()
      switch(e.key) {
      case 'Escape':
        if (this._g.group.ready() && utils.noMetaKey(e))
          this._handlers.onUnselectAll()
        break
      case 'Delete':
        if (this._g.group.ready() && utils.noMetaKey(e))
          this._handlers.onDeleteAll()
        break
      case 'a':
        if (this._g.group.ready() && utils.ctrlMetaKey(e))
          this._handlers.onSelectAll()
        break
      case 'F8':
        if (this._g.group.ready() && utils.ctrlMetaKey(e))
          this._handlers.onFreeze()
        break
      case 'c':
        if (this._g.group.ready() && utils.ctrlMetaKey(e))
          this._handlers.onCopySelection()
        break
      case 'v':
      case 'V':
        if (this._g.group.ready()) {
          let deepCopy = utils.ctrlMetaShiftKey(e)
          if (utils.ctrlMetaKey(e) || deepCopy)
            this._handlers.onPasteSelection(deepCopy)
        }
        break
      default:
      }
    }
    
  }

  // AREA MOVER
  // Area moving starts by pressing mouse down on a selection of areas.
  // Moves are constrained so that moved figures remains in SVG container.
  // ESC key cancels selection move.

  class AreaMover extends bittls.MouseStateMachine {

    constructor(c) {
      super({
        startOnPress : true,
        element : c.workarea,
        translate : c.viewport.translateCoords,
        trigger : e => {
          return (this._g.group.ready() && !this._handlers.prevent(e) && utils.noMetaKey(e))
        },
        onStart : (p,e) => {
          this._handlers.onStart(this._drawarea, p)
          this._drawarea.classList.add(utils.clsActions.MOVING)
          return true;
        },
        onProgress : p => this._handlers.onProgress(p),
        onEnd : p => this._handlers.onEnd(p),
        onExit : () => {
          this._handlers.onExit();
          this._drawarea.classList.remove(utils.clsActions.MOVING)
        },
        onCancel : () => this._handlers.onCancel()
      }, { group : c.group, state : states.MOVING })
      this._handlers = c.handlers
      this._viewport = c.viewport
      this._drawarea = c.drawarea
      this.onMoveStep = this._onMoveStep.bind(this)
    }

    _activate() {
      document.removeEventListener('keydown', this.onMoveStep)
      super._activate()
    }

    _inactivate() {
      document.addEventListener('keydown', this.onMoveStep)
      super._inactivate()
    }

    enable() {
      if (!this._enabled) {
        super.enable()
        document.addEventListener('keydown', this.onMoveStep)
      }
    }

    disable() {
      if (this._enabled) {
        super.disable()
        document.removeEventListener('keydown', this.onMoveStep)
      }
    }

    _onMoveStep(e) {
      e.preventDefault()
      switch(e.key) {
      case 'ArrowLeft':
        if (this._g.group.ready()) {
          if (utils.noMetaKey(e))
            this._handlers.onStep(this._drawarea, -1, 0)
          else if (utils.ctrlKey(e))
            this._handlers.onRotate(this._drawarea, bitedit.directions.RACLK)
        }
        break
      case 'ArrowRight':
        if (this._g.group.ready()) {
          if (utils.noMetaKey(e))
            this._handlers.onStep(this._drawarea, 1, 0)
          else if (utils.ctrlKey(e))
            this._handlers.onRotate(this._drawarea, bitedit.directions.RCLK)
        }
        break
      case 'ArrowUp':
        if (this._g.group.ready() && utils.noMetaKey(e))
          this._handlers.onStep(this._drawarea, 0, -1)
        break
      case 'ArrowDown':
        if (this._g.group.ready() && utils.noMetaKey(e))
          this._handlers.onStep(this._drawarea, 0, 1)
        break
      default:
      }
    }
    
  }

  // AREA EDITOR
  // Area editing starts by pressing mouse down on grabber of a selected area.
  // ESC key cancels selection editing.
  // Resizing cannot invert some figure dimension e.g. rectangle width becoming negative.

  class AreaEditor extends bittls.MouseStateMachine {
    constructor(c) {
      super({
        startOnPress : true,
        element : c.workarea,
        translate : c.viewport.translateCoords,
        trigger : e => {
          return (this._g.group.ready() && !this._handlers.prevent(e) && utils.noMetaKey(e))
        },
        onStart : (p,e) => {
          this._handlers.onStart(this._drawarea, e.target, p);
          this._drawarea.classList.add(utils.clsActions.EDITING);
          return true;
        },
        onProgress : p => this._handlers.onProgress(p),
        onEnd : p => this._handlers.onEnd(p),
        onExit : () => {
          this._handlers.onExit();
          this._drawarea.classList.remove(utils.clsActions.EDITING);
        },
        onCancel : () => this._handlers.onCancel()
      }, { group : c.group, state : states.EDITING })
      this._handlers = c.handlers
      this._viewport = c.viewport
      this._drawarea = c.drawarea
    }
  }

  // WORKSPACE FOR GRAPHIC OPERATIONS

  class Workspace {

    constructor(c) {
      const doms = {
        wks       : $('wks-wrap'),
        aside     : $('tools'),
        footer    : $('footer'),
        workarea  : $('workarea'),
        container : $('container'),
        image     : $('img-display'),
        drawarea  : $('draw-area'),
        gridarea  : $('grid-area'),
        coords    : $('coordinates')
      }
      this._doms = doms
      this._ftr = c.ftr
      this._group = new bittls.MouseStateMachineRadioGroup([], states.READY)
      this._group.state = states.OPEN
      this._viewport = new Viewport ({
        wks : doms.wks, footer : doms.footer, aside : doms.aside, container : doms.container,
        workarea : doms.workarea, drawarea : doms.drawarea, gridarea : doms.gridarea,
        image : doms.image
      })
      this._coordTracker = new bittls.MousePositionTracker({
        trackedElement: doms.workarea,
        displayElement : doms.coords,
        translate : this._viewport.translateCoords
      })
      this._imageDragger = new ImageDragger({
        workarea : doms.workarea,
        viewport : this._viewport, handlers : c.handlers.dragger, group : this._group
      })
      this._areaDrawer = new AreaDrawer({
        workarea : doms.workarea, drawarea : doms.drawarea, gridarea : doms.gridarea,
        viewport : this._viewport, handlers : c.handlers.drawer, group : this._group
      })
      this._areaSelector = new AreaSelector({
        workarea : doms.workarea, drawarea : doms.drawarea,
        viewport : this._viewport, handlers : c.handlers.selector, group : this._group
      })
      this._areaMover = new AreaMover({
        workarea : doms.workarea, drawarea : doms.drawarea,
        viewport : this._viewport, handlers : c.handlers.mover, group : this._group
      })
      this._areaEditor = new AreaEditor({
        workarea : doms.workarea, drawarea : doms.drawarea,
        viewport : this._viewport, handlers : c.handlers.editor, group : this._group
      })
    }

    _hide(obj) { obj.style.display = 'none' }
    _show(obj) { obj.style.display = 'block' }

    _onLoadImage() {
      this._ftr.loading.hide()
      this._ftr.infoUpdate(this._doms.image.naturalWidth, this._doms.image.naturalHeight)
      this._show(this._doms.aside)
      this._show(this._doms.workarea)
      this._viewport.setWorkingDims(this._doms.image.width, this._doms.image.height)
                    .resize()
      this._coordTracker.enable()
      this._group.enable()
    }

    ready() {
      return this._group.ready()
    }

    reset() {
      this._coordTracker.disable()
      this._group.disable()
      this._group.state = states.OPEN
      this._doms.image.src = ''
      this._hide(this._doms.workarea)
      this._hide(this._doms.aside)
      this._show(this._doms.drawarea)
      this._show(this._doms.gridarea)
    }

    load(f) {
      this._ftr.loading.show()
      this._doms.image.onload = this._onLoadImage.bind(this)
      this._doms.image.src = window.URL.createObjectURL(f)
      return this
    }

    loadEx(p) {
      this._ftr.loading.show()
      this._doms.image.onload = this._onLoadImage.bind(this)
      this._doms.image.src = p.dataURL
      return this
    }

    switchToPreview() {
      this._hide(this._doms.drawarea)
      this._hide(this._doms.gridarea)
      this._group.disable()
      this._group.state = states.PREVIEW
      this._viewport.setWorkingDims(this._doms.image.width, this._doms.image.height)
                    .resize()
      return { container : this._doms.container, image : this._doms.image }
    }

    switchToEdit() {
      this._show(this._doms.drawarea)
      this._show(this._doms.gridarea)
      this._group.enable()
      this._viewport.setWorkingDims(this._doms.image.width, this._doms.image.height)
                    .resize()
    }
    
    release() {
      this._coordTracker.enable()
      this._group.enable()
    }

    freeze() {
      this._coordTracker.disable()
      this._group.disable()
    }

    getParent() {
      return this._doms.drawarea
    }

    getGridParent() {
      return this._doms.gridarea
    }
    
    getDims() {
      return { width : this._doms.image.width, height : this._doms.image.height }
    }

  }

  /*
   * TOOLS PALETTE MANAGEMENT 
   */

  class AreaProperties {

    constructor(c) {
      this._inputs = [
        { dom : c.doms.href,  prop  : bitmap.properties.HREF },
        { dom : c.doms.alt,   prop  : bitmap.properties.ALT },
        { dom : c.doms.title, prop  : bitmap.properties.TITLE },
        { dom : c.doms.id,    prop  : bitmap.properties.ID }
      ]
      this._btns = {
        save : { dom : c.doms.btnPropsSave, action : c.handlers.onPropsSave },
        restore : { dom : c.doms.btnPropsRestore, action : c.handlers.onPropsRestore }
      }
      this._btns.save.dom.addEventListener('click', this._onSave.bind(this), false)
      this._btns.restore.dom.addEventListener('click', this._onRestore.bind(this), false)
      this._inputs.forEach(e => {
        e.dom.addEventListener('input', this._onInput.bind(this), false)
        e.dom.addEventListener('keydown', this._onKey.bind(this), false)
      })
    }

    blur() {
      this._inputs.forEach(e => e.dom.blur())
    }

    reset() {
      this._inputs.forEach(e => e.dom.defaultValue = e.dom.value = "...")
    }

    display(obj) {
      let props = obj.areaProperties
      this._inputs.forEach(e => e.dom.defaultValue = e.dom.value = props[e.prop] || "")
    }

    enable(obj) {
      this._inputs.forEach(e => e.dom.disabled = false)
      this.display(obj)
      this._btns.save.dom.disabled = this._btns.restore.dom.disabled = true
    }

    disable() {
      this._inputs.forEach(e => {
        e.dom.defaultValue = e.dom.value = "..."
        e.dom.blur()
        e.dom.disabled = true
      })
      this._btns.save.dom.disabled = this._btns.restore.dom.disabled = true
    }

    save(obj, p) {
      obj.areaProperties = p
      this._inputs.forEach(e => e.dom.defaultValue = e.dom.value);
      this._btns.save.dom.disabled = this._btns.restore.dom.disabled = true;
    }

    restore(obj) {
      this.display(obj);
      this._btns.save.dom.disabled = this._btns.restore.domdisabled = true;
    }

    _onKey(e) {
      e.stopPropagation()
    }

    _onInput(e) {
      let d = this._inputs.reduce( (a,e) => a && (e.dom.defaultValue === e.dom.value), true)
      this._btns.save.dom.disabled = this._btns.restore.dom.disabled = d;
    }

    _onSave(e) {
      let p = {}
      this._inputs.forEach(e => p[e.prop] = e.dom.value)
      this._btns.save.action(p)
      e.preventDefault()
    }

    _onRestore(e) {
      this._btns.restore.action()
      e.preventDefault()
    }

  }

  class Tools {

    constructor(c) {

      this._gridModes = [
        utils.fgTypes.GRIDHEX,
        utils.fgTypes.GRIDRECTANGLE,
        utils.fgTypes.GRIDCIRCLE
      ]

      this._noPattern = [
        utils.fgTypes.NONE,
        utils.fgTypes.GRIDRECTANGLE,
        utils.fgTypes.GRIDHEX,
        utils.fgTypes.GRIDCIRCLE,
        utils.fgTypes.POLYGON
      ]

      this._handlers = c.handlers
      this._gParam = true
      this._scope = bitgrid.scopes.INNER
      this._align = bitgrid.aligns.STANDARD
      this._space = 0
      this._order = bitgrid.orders.TOPLEFT
      this._allowGrid = false
      this._freezed = true

      this._disabler = new bittls.ContainerMask({
        containerElement : $('tools'),
        maskElement : document.querySelector('#tools .mask')
      })

      this._drawMode = new bittls.TRadioToggles({
        map : [
          { element : $('hex-d'),           value : utils.fgTypes.HEXDTR },
          { element : $('hex-r'),           value : utils.fgTypes.HEXRCT },
          { element : $('rectangle'),       value : utils.fgTypes.RECTANGLE },
          { element : $('square'),          value : utils.fgTypes.SQUARE },
          { element : $('rhombus'),         value : utils.fgTypes.RHOMBUS },
          { element : $('triangle-e'),      value : utils.fgTypes.TRIANGLEEQL },
          { element : $('triangle-i'),      value : utils.fgTypes.TRIANGLEISC },
          { element : $('triangle-r'),      value : utils.fgTypes.TRIANGLERCT },
          { element : $('ellipse'),         value : utils.fgTypes.ELLIPSE },
          { element : $('circle-d'),        value : utils.fgTypes.CIRCLEDTR },
          { element : $('circle-c'),        value : utils.fgTypes.CIRCLECTR },
          { element : $('polygon'),         value : utils.fgTypes.POLYGON },
          { element : $('hex-grid'),        value : utils.fgTypes.GRIDHEX },
          { element : $('rectangle-grid'),  value : utils.fgTypes.GRIDRECTANGLE },
          { element : $('circle-grid'),     value : utils.fgTypes.GRIDCIRCLE }
        ],
        noneValue : utils.fgTypes.NONE,
        initialValue : utils.fgTypes.NONE,
        action : (() => { this._props.blur() }).bind(this)
      })

      this._gridPrms = {
        gridScope : new bittls.TToggle({
          map : [
            { element : $('grid-scope-inner'),  value : bitgrid.scopes.INNER },
            { element : $('grid-scope-outer'),  value : bitgrid.scopes.OUTER }
          ],
          initialValue : this._scope,
          action : this._onGridScopeChange.bind(this)
        }),
        gridAlign : new bittls.TToggle({
          map : [ 
            { element : $('grid-algn-std'),     value : bitgrid.aligns.STANDARD },
            { element : $('grid-algn-alt'),     value : bitgrid.aligns.ALT_HORIZONTAL },
            { element : $('grid-algn-alt2'),    value : bitgrid.aligns.ALT_VERTICAL }
          ],
          initialValue : this._align,
          action : this._onGridAlignChange.bind(this)
        }),
        gridSpace : new bittls.TNumber({
          element : $('grid-space'),
          initialValue : this._space,
          action : this._onGridSpaceChange.bind(this)
        }),
        gridOrder : new bittls.TToggle({
          map : [ 
            { element : $('grid-order-tl'),     value : bitgrid.orders.TOPLEFT },
            { element : $('grid-order-lt'),     value : bitgrid.orders.LEFTTOP },
            { element : $('grid-order-lb'),     value : bitgrid.orders.LEFTBOTTOM },
            { element : $('grid-order-bl'),     value : bitgrid.orders.BOTTOMLEFT },
            { element : $('grid-order-br'),     value : bitgrid.orders.BOTTOMRIGHT },
            { element : $('grid-order-rb'),     value : bitgrid.orders.RIGHTBOTTOM },
            { element : $('grid-order-rt'),     value : bitgrid.orders.RIGHTTOP },
            { element : $('grid-order-tr'),     value : bitgrid.orders.TOPRIGHT }
          ],
          initialValue : this._order,
          action : this._onGridOrderChange.bind(this)
        }),
        showOrder : new bittls.TState({
          element : $('show-order'), 
          action : this._onShowOrder.bind(this)
        }) 
      }

      this._props = new AreaProperties({
        doms : {
          href            : $('href-prop'),
          alt             : $('alt-prop'),
          title           : $('title-prop'),
          id              : $('id-prop'),
          btnPropsSave    : $('area-props-save'),
          btnPropsRestore : $('area-props-restore')
        },
        handlers : {
          onPropsSave     : c.handlers.onPropsSave,
          onPropsRestore  : c.handlers.onPropsRestore
        }
      })

      this._layoutBtns = {
        resize      : new bittls.TButton({ element : $('resize'),       action : c.handlers.onResize }),
        alignLeft   : new bittls.TButton({ element : $('align-left'),   action : c.handlers.onAlignLeft }),
        alignTop    : new bittls.TButton({ element : $('align-top'),    action : c.handlers.onAlignTop }),
        alignRight  : new bittls.TButton({ element : $('align-right'),  action : c.handlers.onAlignRight }),
        alignBottom : new bittls.TButton({ element : $('align-bottom'), action : c.handlers.onAlignBottom }),
        alignCenterHorizontally : new bittls.TButton({ element : $('align-center-h'), action : c.handlers.onAlignCenterHorizontally }),
        alignCenterVertically   : new bittls.TButton({ element : $('align-center-v'), action : c.handlers.onAlignCenterVertically })
      }

      this.release()
    }

    get drawMode()  { return this._drawMode.value }
    clearDrawMode() { this._drawMode.value = utils.fgTypes.NONE }
    none()          { return (utils.fgTypes.NONE === this._drawMode.value) ? true : false }
    isGridDrawModeSelected() { return (this._gridModes.find(e => (e === this._drawMode.value))) }

    get gridScope() { return this._scope }
    get gridAlign() { return this._align }
    get gridSpace() { return this._space }
    get gridOrder() { return this._order }

    blurAreaProps()     { this._props.blur() }
    resetAreaProps()    { this._props.reset() }
    disableAreaProps()  { this._props.disable() }
    displayAreaProps(e) { this._props.display(e) }
    saveAreaProps(e,p)  { this._props.save(e,p) }
    restoreAreaProps(e) { this._props.restore(e) }

    reset() {
      this._drawMode.disable(this._gridModes)
      this._drawMode.value = utils.fgTypes.NONE
      this._allowGrid = false
      Object.values(this._gridPrms).forEach(e => e.reset())
      this._gParam = true
      this._space = 0
      this._scope = this._gridPrms.gridScope.value
      this._align = this._gridPrms.gridAlign.value
      this._order = this._gridPrms.gridOrder.value
      this._props.disable()
      this.release()
    }

    freeze() {
      if (this._freezed) return;
      this._props.blur();
      this._disabler.maskElement();
      this._freezed = true;
    }

    release() {
      if (!this._freezed) return;
      this._props.blur();
      this._disabler.unmaskElement();
      this._freezed = false;
    }

    enableGridTools(obj) {
      this._enableGridMode(obj)
      this._updateGridParams(obj)
      this._props.enable(obj)
    }

    disableGridTools() {
      this._disableGridMode()
      this._updateGridParams()
      this._props.disable()
    }

    _setGridScope(v) { this._gridPrms.gridScope.value = v || this._scope }
    _setGridAlign(v) { this._gridPrms.gridAlign.value = v || this._align }
    _setGridSpace(v) { this._gridPrms.gridSpace.value = (v === 0) ? 0 : (v || this._space) }
    _setGridOrder(v) { this._gridPrms.gridOrder.value = v || this._order }

    _canGrid(obj) { return (this._noPattern.find(e => (e === obj.type))) ? false : true }
    
    _enableGridMode(obj) {
      if (!this._allowGrid && this._canGrid(obj)) {
        this._drawMode.enable(this._gridModes);
        this._allowGrid = true;
      } else if (this._allowGrid && !this._canGrid(obj)) {
        this._drawMode.disable(this._gridModes);
        this._allowGrid = false;
      }
    }

    _disableGridMode() {
      if (this._allowGrid) {
        this._drawMode.disable(this._gridModes);
        this._allowGrid = false;
      }
    }

   _updateGridParams(obj) {
      if (obj && obj.isGrid) {
        this._gParam = false
        this._setGridScope(obj.gridScope)
        this._setGridAlign(obj.gridAlign)
        this._setGridSpace(obj.gridSpace)
        this._setGridOrder(obj.gridOrder)
      } else {
        this._gParam = true
        this._setGridScope()
        this._setGridAlign()
        this._setGridSpace()
        this._setGridOrder()
      }
    }
    
     _onGridScopeChange(v) {
       this._props.blur()
       if (this._gParam)
         this._scope = v
       this._handlers.onGridScopeChange(v)
     }
    
     _onGridAlignChange(v) {
       this._props.blur()
       if (this._gParam)
         this._align = v
       this._handlers.onGridAlignChange(v)
     }
    
     _onGridSpaceChange(v) {
       this._props.blur()
       if (this._gParam)
         this._space = v
       this._handlers.onGridSpaceChange(v)
     }
    
     _onGridOrderChange(v) {
       this._props.blur()
       if (this._gParam)
         this._order = v
       this._handlers.onGridOrderChange(v)
     }
    
     _onShowOrder(v) {
       this._props.blur()
       this._handlers.onShowOrder(v)
     }

  }

  /*
   * FOOTER DISPLAY MANAGEMENT
   */

  class Footer {

    constructor() {
      this._doms = {
        info : $('selected-file'),
        load : $('load-indicator')
      }
    }

    _clear() {
      while(this._doms.info.firstChild) {
        this._doms.info.removeChild(this._doms.info.firstChild)
      }
      this._doms.info.classList.remove('error')
      return this
    }

    reset() {
      this._clear()
      let info = document.createElement('p')
      info.textContent = 'No image file selected'
      this._doms.info.appendChild(info)
      return this
    }

    error(f) {
      this._clear();
      let info = document.createElement('p')
      info.textContent = 'No image file selected - ' + ((f == null) ? 'Too many files selected' : ( 'Selected file is not an image file: ' + f.name ))
      this._doms.info.classList.add('error')
      this._doms.info.appendChild(info)
      return this
    }

    info(f) {
      this._clear()
      let output = []
      output.push('<strong>', escape(f.name), '</strong> (', f.type || 'n/a', ') - ',
          f.size, ' bytes, last modified: ',
          f.lastModified ? (new Date(f.lastModified)).toLocaleDateString() : 'n/a')
      let info = document.createElement('p')
      info.innerHTML = output.join('')
      let image = document.createElement('img')
      image.src = window.URL.createObjectURL(f)
      this._doms.info.appendChild(image)
      this._doms.info.appendChild(info)
      return this
    }

    errorEx(p) {
      this._clear()
      let info = document.createElement('p')
      info.textContent = 'Project "' + p.name + '" / Image "' + p.filename + '" - Corrupted record!'
      this._doms.info.classList.add('error')
      this._doms.info.appendChild(info)
      return this
    }

    infoEx(p) {
      this._clear()
      let output = []
      output.push('<strong>', escape(p.filename), '</strong> (', p.type || 'n/a', ') - ',
          p.size, ' bytes, last modified: n/a')
      let info = document.createElement('p')
      info.innerHTML = output.join('')
      let image = document.createElement('img')
      image.src = p.dataURL
      this._doms.info.appendChild(image)
      this._doms.info.appendChild(info)
      return this
    }

    infoUpdate(width, height) {
      this._doms.info.lastChild.innerHTML += ' - ' + width + 'x' + height + ' px'
    }

    get loading() {
      return {
        show : () => this._doms.load.style.display = 'inline',
        hide : () => this._doms.load.style.display = 'none'
      };
    }

  }

  /*
   * MAP PROJECT MANAGER
   */

  class ProjectManagerDialog extends bittls.DialogForm {

    constructor(c) {
      super({ form : $('project-manager') })
      this._model = c.model
      this._store = c.store
      this._handlers = c.handlers
      this._canClear = true
      this._doms = {
        list      : document.querySelector('#project-manager .project-list'),
        deleteBtn : document.querySelector('#project-manager .delete'),
        clearBtn  : document.querySelector('#project-manager .clear')
      }
      this._doms.deleteBtn.addEventListener('click', this._onDelete.bind(this), false)
      this._doms.clearBtn.addEventListener('click', this._onClear.bind(this), false)
    }

    _fill() {
      let canClearAll, content, flag
      canClearAll = true
      content = ''
      this._store.list.forEach(e => {
        flag = ''
        if (e === this._model.info.name) {
          flag = ' disabled'
          canClearAll = false
        }
        content += '<option value="' + e + '"' + flag + '>' + e + '</option>'
      });
      this._doms.list.innerHTML = content
      return canClearAll
    }

    _onClose() {
      this._doms.list.innerHTML = ''
      this._handlers.onClose()
      super._onClose()
    }

    _onCancel() {
      this._onClose()
    }

    _onDelete(e) {
      let i, sel
      e.preventDefault()
      sel = []
      for (i = 0; i < this._doms.list.options.length; i++) {
        if (this._doms.list.options[i].selected)
          sel.push(this._doms.list.options[i].value)
      }
      sel.forEach(e => this._store.remove(e))
      this._fill()
    }

    _onClear(e) {
      e.preventDefault();
      if (this._canClear) {
        this._store.reset()
        this._fill()
      }
    }

   show() {
      this._canClear = this._fill()
      this._doms.clearBtn.disabled = !this._canClear
      super.show()
    }

  }

  /*
   *  MAP PROJECT CREATOR
   */

  class ProjectCreatorDialog extends bittls.DialogForm {

    constructor(c) {
      super({
        form : $('project-creator'),
        textRecipients : [$('map-name'), $('map-alt')]
      })
      this._handlers = c.handlers
      this._file = null
      this._filename = ''
      this._doms = {
        btnSet        : document.querySelector('#project-creator .create'),
        dropZone      : $('image-drop-zone'),
        imagePreview  : document.querySelector('#project-creator .preview'),
        inImageFile   : $('load-image-file'),
        inMapName     : $('map-name'),
        inMapAlt      : $('map-alt')
      }

      this._doms.btnSet.addEventListener('click', this._onSetClick.bind(this), false)
      this._doms.dropZone.draggable = true
      this._doms.dropZone.addEventListener('dragover', this._onDragEvent, false)
      this._doms.dropZone.addEventListener('dragleave', this._onDragEvent, false)
      this._doms.dropZone.addEventListener('drop', this._onDrop.bind(this), false)
      this._doms.inImageFile.addEventListener('change', this._onImageFileChange.bind(this), false)
      this._doms.inMapName.addEventListener('input', this._onNameInput.bind(this), false)
      this.reset()
    }

    _clear() {
      this._doms.imagePreview.style.display = 'none'
      this._doms.imagePreview.src = ''
      this._doms.dropZone.classList.remove('error')
      this._doms.btnSet.disabled = true
      this._file = null
      this._filename = ''
    }

    _error(e) {
      e.classList.add('error')
    }

    _validate() {
      return (this._doms.inMapName.value !== '' && this._filename !== '')
    }

    _processFiles(files) {
      this._clear()
      if (1 < files.length || 0 == files.length || !this._handlers.checkFile(files[0])) {
        this._error(this._doms.dropZone)
        this._doms.btnSet.disabled = true
      } else {
        this._file = files[0]
        this._filename = window.URL.createObjectURL(this._file)
        this._doms.imagePreview.src = this._filename
        this._doms.imagePreview.style.display = 'block'
        this._doms.btnSet.disabled = !this._validate()
      }
    }

    _onDragEvent(e) {
      e.stopPropagation()
      e.preventDefault()
    }
    
    _onDrop(e) {
      e.stopPropagation()
      e.preventDefault()
      this._processFiles(e.dataTransfer.files)
      this._doms.inImageFile.value = ''
    }

    _onImageFileChange(e) {
      e.preventDefault()
      this._processFiles(e.target.files)
    }

    _onNameInput(e) {
      this._doms.btnSet.disabled = !this._validate()
    }

    _onCancel() {
      this._clear()
      this._handlers.onClose()
      super._onCancel()
    }

    _onClose() {
      this._onCancel()
    }

    _onSetClick(e) {
      e.preventDefault()
      if(this._validate()) {
        let data = {
          filename  : this._filename,
          file      : this._file,
          name      : this._doms.inMapName.value,
          alt       : this._doms.inMapAlt.value
        }
        if (!this._handlers.onNewMap(data))
          console.log('ERROR - Invalid input management')
        this._onClose()
      } else {
        if (this._doms.inMapName.value === '')
          this._error(this._doms.inMapName)
        else
          this._error(this._doms.dropZone)
      }
    }

    reset() {
      this._clear()
      this._doms.inImageFile.value = this._doms.inImageFile.defaultValue = ''
      this._doms.inMapName.value = this._doms.inMapName.defaultValue = ''
      this._doms.inMapAlt.value = this._doms.inMapAlt.defaultValue = ''
    }

  }

  /*
   * MAP PROJECT LOADER 
   */

  class ProjectLoaderDialog extends bittls.DialogForm {

    constructor(c) {
      super({
        form : $('project-loader')
      })
      this._handlers = c.handlers
      this._store = c.store
      this._doms = {
        list          : document.querySelector('#project-loader .project-list'),
        btnLoad       : document.querySelector('#project-loader .select'),
        imagePreview  : document.querySelector('#project-loader .preview')
      }
      this._doms.btnLoad.addEventListener('click', this._onLoadClick.bind(this), false);
      this._doms.list.addEventListener('input', this._onSelect.bind(this), false);
    }

    _fill() {
      let content = '';
      this._store.list.forEach(e => content += '<option value="' + e + '">' + e + '</option>' );
      this._doms.list.innerHTML = content;
    }

    _loadPreview() {
      let project;
      project = this._store.read(this._doms.list.options[this._doms.list.selectedIndex].value);
      this._doms.imagePreview.src = project.dataURL;
    }

    _clear() {
      this._doms.imagePreview.style.display = 'none'
      this._doms.imagePreview.src = ''
      this._doms.list.innerHTML = ''
      this._doms.btnLoad.disabled = true
    }

    _reset() {
      this._clear()
      this._fill()
      if (this._doms.list.length > 0) {
        this._doms.btnLoad.disabled = false
        this._loadPreview();
        this._doms.imagePreview.style.display = 'block'
      }
    }

    _onCancel() {
      super._onCancel()
      this._clear()
      this._handlers.onClose()
    }

    _onClose() {
      this._onCancel()
    }

    _onSelect(e) {
      this._loadPreview()
    }

    _onLoadClick(e) {
      let value;
      e.preventDefault();
      value = this._doms.list.options[this._doms.list.selectedIndex].value;
      super._onClose()
      this._clear()
      this._handlers.onLoadMap(value)
    }

    show() {
      this._reset()
      super.show()
    }

  }

  /*
   * MAP CODE DISPLAY
   */

  class CodeGeneratorDialog extends bittls.DialogForm {

    constructor(c) {
      super({
        form : $('project-code'),
        keyHandler : e => this._keyAction(e)
      })
      this._handlers = c.handlers
      this._doms = {
        code        : $('code-result'),
        btnSelect   : document.querySelector('#project-code .select'),
        btnClear    : document.querySelector('#project-code .clear')
      }
      this._doms.btnSelect.addEventListener('click', this._onSelectClick.bind(this), false);
      this._doms.btnClear.addEventListener('click', this._onClearClick.bind(this), false);
    }

    _reset() {
      this._doms.code.innerHTML = '';
    }

    _onClose() {
      super._onClose()
      this._reset()
      this._handlers.onClose()
    }

    _onCancel() {
      this._onClose()
    }

    _onSelectClick(e) {
      e.preventDefault()
      utils.selectText(this._doms.code)
    }

    _onClearClick(e) {
      e.preventDefault()
      utils.unselect()
    }

    _keyAction(e) {
      if('a' === e.key && utils.ctrlMetaKey(e)) {
        e.preventDefault()
        utils.selectText(this._doms.code)
      }
    }

    show(s) {
      this._reset()
      this._doms.code.innerHTML = s
      super.show()
    }

  }

  /*
   * HTML CODE LOADER
   */

  class HtmlLoaderDialog extends bittls.DialogForm {

    constructor(c) {
      super({
        form : $('code-loader'),
        textRecipients : [$('input-code')]
      })
      this._handlers = c.handlers
      this._doms = {
        btnLoad    : document.querySelector('#code-loader .select'),
        btnClear   : document.querySelector('#code-loader .clear'),
        code       : $('input-code')
      }
      this._doms.btnLoad.addEventListener('click', this._onLoadClick.bind(this), false)
      this._doms.btnClear.addEventListener('click', this._onClearClick.bind(this), false)
      this._doms.code.addEventListener('input', this._onCodeInput.bind(this), false)
    }

    _clear() {
      this._doms.btnLoad.disabled = true
    }

    _reset() {
      this._clear()
      if (this._doms.code.value != '')
        this._doms.btnLoad.disabled = false
    }

    _onClose() {
      this._clear()
      this._handlers.onClose()
      super._onClose()
    }

    _onCancel() {
      this._onClose()
    }
 
    _onCodeInput(e) {
      this._doms.btnLoad.disabled = (this._doms.code.value === '');
    }

    _onLoadClick(e) {
      e.preventDefault()
      this._clear()
      super._onClose()
      this._handlers.onLoadCode(this._doms.code.value);
    }

    _onClearClick(e) {
      e.preventDefault()
      this._doms.code.value = ''
      this._doms.btnLoad.disabled = true
    }

    show() {
      this._reset()
      super.show()
    }

  }

  /*
   * HELP DISPLAY
   */

  class HelpDialog extends bittls.DialogForm {

    constructor(c) {
      super({
        form : $('help-display')
      })
      this._handlers = c.handlers
    }

    _onClose() {
      this._handlers.onClose()
      super._onClose()
    }

    _onCancel() {
      this._onClose()
    }

  }

  /*
   * MENU MANAGEMENT
   */

  class Menu {

    constructor(c) {
      this._btns = Object.assign({}, {
        newProject    : new bittls.TButton({ element : $('new-project'),    action : c.handlers.onNewProject }),
        preview       : new bittls.TButton({ element : $('preview'),        action : (() => c.handlers.onPreview(this._btns.preview.element.classList.toggle('selected'))).bind(this) }),
        saveProject   : new bittls.TButton({ element : $('save-project'),   action : c.handlers.onSaveProject }),
        loadProject   : new bittls.TButton({ element : $('load-project'),   action : c.handlers.onLoadProject }),
        closeProject  : new bittls.TButton({ element : $('close-project'),  action : c.handlers.onCloseProject }),
        cleanProjects : new bittls.TButton({ element : $('clean-projects'), action : c.handlers.onCleanProjects }),
        generate      : new bittls.TButton({ element : $('generate'),       action : c.handlers.onGenerateCode }),
        loadHTML      : new bittls.TButton({ element : $('load-html'),      action : c.handlers.onLoadHTML }),
        help          : new bittls.TButton({ element : $('help'),           action : c.handlers.onHelp })
      })
      this._btns.closeProject.disable()
      this._btns.saveProject.disable()
      this._btns.preview.disable()
      this._btns.generate.disable()
      this._btns.loadHTML.disable()
      this.onKeyAction = this._onKeyAction.bind(this)
      document.addEventListener('keydown', this.onKeyAction, false);
      document.addEventListener('keydown', this.onCheckHelp.bind(this), false);
      return this.reset();
    }

    canSave() {
      this._btns.saveProject.enable()
    }
    
    preventSave() {
      this._btns.saveProject.disable()
    }

    release() {
      Object.values(this._btns).forEach(e => e.release())
      document.addEventListener('keydown', this.onKeyAction, false);
    }

    freeze() {
      Object.values(this._btns).forEach(e => e.freeze())
      document.removeEventListener('keydown', this.onKeyAction, false);
    }

    _onKeyAction(e) {
      switch(e.key) {
      case 'm':
        if (utils.ctrlMetaKey(e)) {
          e.preventDefault()
          this._btns.newProject.tryAction()
        }
        break
      case 'l':
        if (utils.ctrlMetaKey(e)) {
          e.preventDefault()
          this._btns.loadProject.tryAction()
        }
        break
      case 's':
        if (utils.ctrlMetaKey(e)) {
          e.preventDefault()
          this._btns.saveProject.tryAction()
        }
        break
      case 'x':
        if (utils.ctrlMetaKey(e)) {
          e.preventDefault()
          this._btns.closeProject.tryAction()
        }
        break
      case 'p':
        if (utils.ctrlMetaKey(e)) {
          e.preventDefault()
          this._btns.preview.tryAction()
        }
        break
      case 'g':
        if (utils.ctrlMetaKey(e)) {
          e.preventDefault()
          this._btns.generate.tryAction()
        }
        break
      case 'Escape':
        if(this._btns.preview.element.classList.contains('selected')) {
          e.preventDefault()
          this._btns.preview.tryAction()
        }
        break
      default:
      }
    }

    onCheckHelp(e) {
      e.preventDefault()
      if ('F1' === e.key)
        this._btns.help.tryAction()
    }

    reset() {
      this._btns.closeProject.disable()
      this._btns.saveProject.disable()
      this._btns.preview.element.classList.remove('selected')
      this._btns.preview.disable()
      this._btns.generate.disable()
      this._btns.loadHTML.disable()
      document.addEventListener('keydown', this.onKeyAction, false);
      return this;
    }

    switchToEditMode() {
      this._btns.closeProject.enable()
      this._btns.preview.enable()
      this._btns.preview.element.classList.remove('selected')
      this._btns.generate.enable()
      this._btns.loadHTML.enable()
      return this;
    }

  }

  /*
   * APPLICATION
   */

  // APPLICATION - MENU HANDLERS

  class AppMenuHandlers {

    constructor(app) {
      this._app = app
      this._mapper = new bitmap.Mapper()
    }

    _onNewProject() {
      if (!this._app.model.modified || confirm('Discard all changes?')) {
        this._app.footer.reset()
        this._app.workspace.reset()
        this._app.tools.reset()
        this._app.menu.reset()
        this._app.model.reset()
        this._app.creator.reset()
        this._app.creator.show()
        this._app.freeze()
      }
    }

    _onPreview(activated) {
      if (activated) {
        let t
        this._app.tools.freeze()
        t = this._app.workspace.switchToPreview()
        this._mapper.displayPreview(t.container, t.image, this._app.model.areas, this._app.model.info)
      } else {
        this._app.workspace.switchToEdit()
        this._mapper.cancelPreview()
        this._app.tools.release()
      }
    }

    _onLoadProject() {
      if (!this._app.model.modified || confirm('Discard all changes?')) {
        this._app.footer.reset()
        this._app.workspace.reset()
        this._app.tools.reset()
        this._app.menu.reset()
        this._app.model.reset()
        this._app.creator.reset()
        this._app.opener.show()
        this._app.freeze()
      }
    }

    _onSaveProject() {
      this._app.store.write(this._app.model.info.name, this._app.model.toStore(this._app.store.a2s))
      this._app.setUnmodified()
    }

    _onCloseProject() {
      if (!this._app.model.modified || confirm('Discard all changes?')) {
        this._app.footer.reset()
        this._app.workspace.reset()
        this._app.tools.reset()
        this._app.menu.reset()
        this._app.model.reset()
      }
    }

    _onCleanProjects() {
      this._app.manager.show()
      this._app.freeze()
    }

    _onGenerateCode() {
      this._app.generator.show(bitmap.Mapper.getHtmlString(this._app.model.filename, this._app.model.info, this._app.model.areas));
      this._app.freeze()
    }

    _onLoadHTML() {
      this._app.loader.show()
      this._app.freeze()
    }

    _onHelp() {
      this._app.helper.show()
      this._app.freeze()
    }

    get handlers() {
      return {
        onNewProject    : this._onNewProject.bind(this),
        onPreview       : this._onPreview.bind(this),
        onLoadProject   : this._onLoadProject.bind(this),
        onSaveProject   : this._onSaveProject.bind(this),
        onCloseProject  : this._onCloseProject.bind(this),
        onCleanProjects : this._onCleanProjects.bind(this),
        onGenerateCode  : this._onGenerateCode.bind(this),
        onLoadHTML      : this._onLoadHTML.bind(this),
        onHelp          : this._onHelp.bind(this)
      }
    }

  }

  // APPLICATION - PROJECTS HANDLERS

  class AppProjectHandlers {

    constructor(app) {
      this._app = app
    }

    _onClose() {
      this._app.release()
    }

    _onNewMap(data) {
      let rtn = false
      try {
        this._app.model.file = data.file
        this._app.model.info = data
        this._app.menu.switchToEditMode()
        this._app.footer.info(data.file)
        this._app.workspace.load(data.file)
        this._app.setModified(true)
        rtn = true
      } catch (e) {
        console.log(e.message)
        this._app.footer.error(data.file)
      } finally {
        this._app.release()
        return rtn
      }
    }

    _onLoadMap(name) {
      let rtn, project;
      rtn = false;
      project = this._app.store.read(name);
      this._app.footer.infoEx(project);
      this._app.workspace.loadEx(project);
      if(this._app.model.fromStore(project, this._app.store.s2a)) {
        this._app.aTooler.managePropsDisplay(this._app.model.areas)
        this._app.menu.switchToEditMode()
        this._app.setUnmodified(true)
        rtn = true
      } else {
        this._app.footer.errorEx(project)
      }
      this._app.release()
      return rtn
    }

    _onLoadCode(code) {
      let areas, rtn
      areas = []
      rtn = false
      if (code) {
        bitmap.Mapper.loadHtmlString(code).forEach(r => areas.push(bitarea.createFromRecord(r, this._app.workspace.getParent())))
        if (areas.length > 0) {
          this._app.model.addAreas(areas)
          this._app.aTooler.managePropsDisplay(this._app.model.areas)
          this._app.setModified(true)
          this._app.aSelector.unselectAll()
          this._app.aSelector.selectSubset(areas)
          rtn = true
        }
      }
      this._app.release()
      return rtn
    }

    get handlers() {
      return {
        onClose     : this._onClose.bind(this),
        onNewMap    : this._onNewMap.bind(this),
        onLoadMap   : this._onLoadMap.bind(this),
        onLoadCode  : this._onLoadCode.bind(this)
      }
    }

  }

  // APPLICATION - WORKSPACE HANDLERS

  class AppDragHandlers {

    constructor(app) {
      this._app = app
    }

    _prevent(e) {
      if (!this._app.tools.none()) return true
      if (this._app.model.findArea(e.target)) return true
      return false
    }

    _onStart(e) {
      this._app.tools.freeze()
    }

    _onExit(e) {
      this._app.tools.release()
    }

    get handlers() {
      return {
        prevent : this._prevent.bind(this),
        onStart : this._onStart.bind(this),
        onExit  : this._onExit.bind(this)
      }
    }

  }

  class AppDrawHandlers {

    constructor(app) {
      this._app = app
      this._factory = {
        'rectangle'     : bitgen.Rectangle,
        'square'        : bitgen.Square,
        'rhombus'       : bitgen.Rhombus,
        'circleCtr'     : bitgen.Circle,
        'circleDtr'     : bitgen.CircleEx,
        'ellipse'       : bitgen.Ellipse,
        'triangleIsc'   : bitgen.IsoscelesTriangle,
        'triangleEql'   : bitgen.EquilateralTriangle,
        'triangleRct'   : bitgen.RectangleTriangle,
        'hexRct'        : bitgen.Hex,
        'hexDtr'        : bitgen.HexEx,
        'polygon'       : bitgen.Polygon
      }
      this._gridFactory = {
        'gridRectangle' : bitgen.GridRectangle,
        'gridCircle'    : bitgen.GridCircle,
        'gridHex'       : bitgen.GridHex
      }
      this._generator   = null
    }

    _create(parent, alt) {
      const figGen = this._factory[this._app.tools.drawMode]
      if (!figGen) {
        console.log('ERROR - Drawing mode not handled')
        return null
      }
      return new figGen(parent, false, alt)
    }
  
    _createGrid(parent, bond, gridParent) {
      let figGen = this._gridFactory[this._app.tools.drawMode]
      if (!figGen) {
        console.log('ERROR - Grid drawing mode not handled')
        return null
      }
      return new figGen(
        parent, bond, gridParent,
        this._app.tools.gridScope, this._app.tools.gridAlign, this._app.tools.gridSpace, this._app.tools.gridOrder
      )
    }
  
    _prevent(e) {
      if (e.ctrlKey || e.shiftKey) return true
      if (this._app.tools.none()) return true
      if (this._app.model.findArea(e.target)) return true
      return false
    }
  
    _onStart(parent, pt, alt, gridParent) {
      let bondElt = (this._app.tools.isGridDrawModeSelected()) ? this._app.aSelector.first.figure : null
      this._app.aSelector.empty()
      this._generator = (null === bondElt)
                        ? this._create(parent, alt)
                        : this._createGrid(parent, bondElt, gridParent)
      if (null == this._generator) {
        alert('Unable to draw selected area!')
        this._app.tools.disableGridTools()
        return false
      }
      this._app.tools.freeze()
      this._app.tools.disableAreaProps()
      this._generator.start(pt)
      return true
    }
  
    _onProgress(parent, pt) {
      const width = parent.getAttribute('width'),
            height = parent.getAttribute('height')
      this._generator.progress(pt, width, height)
    }
  
    _onEnd(parent, pt) {
      let complete = true
      const width = parent.getAttribute('width'),
            height = parent.getAttribute('height')
      switch(this._generator.end(pt, width, height)) {
      case 'done':
        let fig = this._generator.figure
        this._app.model.addArea(fig)
        this._app.setModified(true)
        this._app.aSelector.select(fig)
        this._app.tools.release()
        this._app.aTooler.managePropsDisplay([fig])
        this._generator = null
        break
      case 'error':
        alert('Invalid area dimensions!')
        this._app.tools.release()
        break;
      case 'continue':
      default:
        complete = false
      }
      return complete
    }
  
    _onCancel() {
      this._generator.cancel()
      this._generator = null
      this._app.tools.release()
      this._app.tools.disableGridTools()
    }

    get handlers() {
      return {
        prevent     : this._prevent.bind(this),
        onStart     : this._onStart.bind(this),
        onProgress  : this._onProgress.bind(this),
        onEnd       : this._onEnd.bind(this),
        onCancel    : this._onCancel.bind(this)
      }
    }

  }

  class AppSelectHandlers {

    constructor(app) {
      this._app = app
      this._selected = new bitedit.MultiSelector()
      this._tracker = null
    }

    _updateGridTools() {
      this._app.tools.blurAreaProps()
      if (this._selected.length === 1) {
        this._app.tools.enableGridTools(this._selected.get(0).figure)
      } else {
        this._app.tools.disableGridTools()
      }
    }

    isAreaSelected(area) {
      return this._selected.has(this._app.model.findArea(area))
    }

    _areaSelect(area) {
      this._app.tools.blurAreaProps()
      this._selected.set(this._app.model.findArea(area))
      this._selected.get(0).highlight()
      this._app.tools.enableGridTools(this._selected.get(0).figure)
    }

    _areaMultiSelect(area) {
      if (this._selected.length > 0)
        this._selected.get(0).trivialize()
      this._selected.toggle(this._app.model.findArea(area))
      if (this._selected.length > 0)
        this._selected.get(0).highlight()
      this._updateGridTools()
    }

    _computeSelection(coords) {
      this._app.model.forEachArea(e => {
        if (e.within(coords)) {
          if (!this._selected.has(e)) {
            this._selected.toggle(e)
          }
        } else if (this._selected.has(e)) {
          this._selected.toggle(e)
        }
      })
      this._updateGridTools()
    }

    _areaSelectAll() {
      if (this._selected.length > 0)
        this._selected.get(0).trivialize()
      this._selected.empty()
      this._app.model.forEachArea(e => this._selected.add(e))
      if (this._selected.length > 0)
        this._selected.get(0).highlight()
      this._updateGridTools()
    }

    _areaUnselectAll() {
      let rtn = this._selected.length
      if (this._selected.length > 0)
        this._selected.get(0).trivialize()
      this._selected.empty()
      this._app.tools.disableGridTools()
      return rtn
    }

    _getSelectedCount() {
      return this._selected.length
    }

    _getSelected() {
      return this._selected.get(0)
    }

    _getSelectedList() {
      return this._selected.slice()
    }

    _empty() {
      return this._selected.empty()
    }

    _select(figure) {
      this._selected.set(figure)
      this._selected.get(0).highlight()
      this._app.tools.enableGridTools(figure)
    }

    _selectSubset(figures) {
      figures.forEach(e => this._selected.add(e))
      if (this._selected.length > 0)
        this._selected.get(0).highlight()
      this._updateGridTools()
    }

    _preventSelect(e) {
      if (e.ctrlKey || e.metaKey || e.altKey) return true
      if (!this._app.model.findArea(e.target)) return true
      if (this.isAreaSelected(e.target) && !e.shiftKey) return true // is a move
      return false
    }

    _onSelect(target, shiftKey) {
      if (!shiftKey)
        this._areaSelect(target)
      else
        this._areaMultiSelect(target)
    }

    _onSelectAll() {
      this._areaSelectAll()
    }

    _onUnselectAll() {
      if (!this._areaUnselectAll())
        this._app.tools.clearDrawMode()
    }

    _preventTracking(e) {
      if (!this._app.tools.none()) return true
      if (!utils.noMetaKey(e)) return true
      if (this._app.model.findArea(e.target)) return true
      if (bitedit.isGrip(e.target)) return true
      return false
    }

    _onTrackStart(parent, pt, unselect) {
      this._areaUnselectAll()
      this._tracker = new bitgen.Tracker(parent)
      this._tracker.start(pt)
      this._app.tools.freeze()
    }

    _onTrackProgress(pt) {
      this._tracker.progress(pt)
      this._computeSelection(this._tracker.coords)
    }

    _onTrackEnd() {
      if (null != this._tracker) {
        this._tracker.cancel();
        this._tracker = null;
      }
      if (this._selected.length > 0)
        this._selected.get(0).highlight()
    }
    
    _onTrackExit() {
      if (this._selected.length > 0)
        this._selected.get(0).highlight()
      this._app.tools.release()
    }

    _onTrackCancel() {
      if (null != this._tracker) {
        this._tracker.cancel()
        this._tracker = null
      }
      this._areaUnselectAll()
      this._app.tools.release();
    }

    _onDeleteAll() {
      this._selected.sort((a,b) => a.figure.isGrid ? -1 : 1)
      this._selected.forEach(e => this._app.model.removeArea(e.figure))
      this._selected.empty()
      this._app.tools.disableGridTools()
      this._app.setModified(true)
    }

    _onFreeze() {
      if (this._selected.length === 1) {
        let newSel = [];
        if (this._app.model.freezeGridArea(this._selected.get(0).figure, newSel, bitmap.Mapper.specializeProperties)) {
          this._selected.get(0).trivialize()
          this._selected.empty()
          newSel.forEach(e => this._selected.add(e))
          if (this._selected.length > 0)
            this._selected.get(0).highlight()
          this._updateGridTools()
          newSel = null
          this._app.setModified(true)
        }
      }
    }

    _onCopy() {
      if (this._selected.length < 1) return;
      this._app.clipboard.data = this._app.model.toClipboard(this._selected.reduce((a,e) => { a.push(e.figure); return a; }, []), this._app.clipboard.a2c)
    }

    _onPaste(forceDeepCopy) {
      let areas
      if (this._app.clipboard.isCopyUnsafe() && !confirm('Areas have been added or deleted and grid references may have been altered. Only a deep copy including grid references can be done.\nPerform a deep copy?'))
        return
      areas = this._app.model.fromClipboard(this._app.clipboard.data, this._app.clipboard.c2a, forceDeepCopy)
      if (areas.length > 0) {
        this._app.model.addAreas(areas)
        this._app.aTooler.managePropsDisplay(areas)
        this._app.setModified()
        this._areaUnselectAll()
        this._selectSubset(areas)
        this._app.aMover.handlers.onStep(this._app.workspace.getParent(), this._app.clipboard.offset, this._app.clipboard.offset)
      }
      this._app.setModified()
    }

    get count()         { return this._getSelectedCount() }
    get first()         { return this._getSelected() }
    get list()          { return this._getSelectedList() }
    select(figure)      { return this._select(figure) }
    selectSubset(area)  { return this._selectSubset(areas) }
    empty()             { return this._empty() }
    unselectAll()       { return this._areaUnselectAll() }
    
    get handlers() {
      return {
        preventSelect     : this._preventSelect.bind(this),
        onSelect          : this._onSelect.bind(this),
        onSelectAll       : this._onSelectAll.bind(this),
        onUnselectAll     : this._onUnselectAll.bind(this),
        preventTracking   : this._preventTracking.bind(this),
        onTrackStart      : this._onTrackStart.bind(this),
        onTrackProgress   : this._onTrackProgress.bind(this),
        onTrackEnd        : this._onTrackEnd.bind(this),
        onTrackExit       : this._onTrackExit.bind(this),
        onTrackCancel     : this._onTrackCancel.bind(this),
        onDeleteAll       : this._onDeleteAll.bind(this),
        onFreeze          : this._onFreeze.bind(this),
        onCopySelection   : this._onCopy.bind(this),
        onPasteSelection  : this._onPaste.bind(this)
      }
    }

  }

  class AppMoveHandlers {

    constructor(app) {
      this._app = app
      this._mover = new bitedit.Mover()
    }

    _prevent(e) {
      if (!this._app.model.findArea(e.target)) return true
      if (!this._app.aSelector.isAreaSelected(e.target)) return true
      return false
    }

    _onStart(parent, pt) {
      const width = parent.getAttribute('width'),
            height = parent.getAttribute('height'),
            selected = this._app.aSelector.list
      selected.sort((a,b) => a.figure.isGrid ? -1 : 1)
      this._mover.start(selected, pt, width, height)
      this._app.tools.freeze()
    }

    _onProgress(pt) {
      this._mover.progress(pt)
    }

    _onEnd(pt) {
      this._mover.end(pt)
      this._app.setModified()
    }

    _onExit(e) {
      this._app.tools.release()
    }

    _onCancel() {
      this._mover.cancel();
      this._app.tools.release();
    }

    _onStep(parent, dx, dy) {
      const width = parent.getAttribute('width'),
            height = parent.getAttribute('height')
      this._mover.step(this._app.aSelector.list, dx, dy, width, height)
      this._app.setModified()
    }

    _onRotate(parent, direction) {
      if (1 < this._app.aSelector.count) {
        alert('Rotation is supported for a single selected area!')
        return
      }
      const width = parent.getAttribute('width'),
            height = parent.getAttribute('height')
      if (!this._app.aSelector.first.rotate(direction, width, height))
        alert('ERROR - Rotation possibly makes area go beyond limits!')
      else
        this._app.setModified()
    }

    get handlers() {
      return {
        prevent     : this._prevent.bind(this),
        onStart     : this._onStart.bind(this),
        onProgress  : this._onProgress.bind(this),
        onEnd       : this._onEnd.bind(this),
        onExit      : this._onExit.bind(this),
        onCancel    : this._onCancel.bind(this),
        onStep      : this._onStep.bind(this),
        onRotate    : this._onRotate.bind(this)
      }
    }

  }

  class AppEditHandlers {

    constructor(app) {
      this._app = app
      this._editor = new bitedit.Editor()
    }

    _prevent(e) {
      if (0 === this._app.aSelector.count) return true
      if (!this._app.aSelector.first.isEditable(e.target)) return true
      return false
    }

    _onStart(parent, target, pt) {
      const width = parent.getAttribute('width'),
            height = parent.getAttribute('height')
      this._editor.start(this._app.aSelector.first, target, pt, width, height)
      this._app.tools.freeze()
    }

    _onProgress(pt) {
      this._editor.progress(pt)
    }

    _onEnd(pt) {
      this._editor.end(pt)
      this._app.setModified()
    }

    _onExit(e) {
      this._app.tools.release()
    }

    _onCancel() {
      this._editor.cancel()
      this._app.tools.release()
    }

    get handlers() {
      return {
        prevent     : this._prevent.bind(this),
        onStart     : this._onStart.bind(this),
        onProgress  : this._onProgress.bind(this),
        onEnd       : this._onEnd.bind(this),
        onExit      : this._onExit.bind(this),
        onCancel    : this._onCancel.bind(this),
      }
    }

  }

  // APPLICATION - TOOLS HANDLERS

  class AppToolHandlers {

    constructor(app) {
      this._app = app
      this._order = new bitedit.Order()
      this._sizer = new bitedit.Sizer()
      this._aligner = new bitedit.Aligner()
    }

    _onGridScopeChange(v) {
      if (this._app.aSelector.count === 1) {
        let area = this._app.aSelector.first.figure
        if (area.isGrid) {
          area.gridScope = v
          this._app.setModified()
        }
      }
    }
    
    _onGridAlignChange(v) {
      if (this._app.aSelector.count === 1) {
        let area = this._app.aSelector.first.figure
        if (area.isGrid) {
          area.gridAlign = v
          this._app.setModified()
        }
      }
    }
    
    _onGridSpaceChange(v) {
      if (this._app.aSelector.count === 1) {
        let area = this._app.aSelector.first.figure
        if (area.isGrid) {
          area.gridSpace = v
          this._app.setModified()
        }
      }
    }
    
    _onShowOrder(bShow) {
      if (bShow) {
        let list, fig
        if (this._app.aSelector.count === 1) {
          fig = this._app.aSelector.first.figure
          list = (fig.isGrid) ? [fig] : fig.copyBonds()
          list.forEach(g => this._order.display(g.areas))
        }
      } else {
        this._order.hide()
      }
    }
    
    _onGridOrderChange(v) {
      if (this._app.aSelector.count === 1) {
        let area = this._app.aSelector.first.figure
        if (area.isGrid) {
          area.gridOrder = v
          this._app.setModified()
        }
      }
    }
    
    _onPropsSave(p) {
      this._app.tools.saveAreaProps(this._app.aSelector.first.figure, p)
      this._app.setModified()
    }
    
    _onPropsRestore() {
      this._app.tools.restoreAreaProps(this._app.aSelector.first.figure)
    }
    
    _onResize() {
      if (1 < this._app.aSelector.count) {
        let d = this._app.workspace.getDims()
        let r = this._app.aSelector.first.figure.rect
        if (!this._sizer.checkBoundaries(this._app.aSelector.list, r.width, r.height, d.width, d.height))
          alert('Resizing selected elements makes at least one of them outside of image boudaries!')
        else
          this._sizer.resize(this._app.aSelector.list, r.width, r.height)
      }
    }
    
    _onAlignCenterHorizontally() {
      if (1 < this._app.aSelector.count) {
        let d = this._app.workspace.getDims()
        let r = this._app.aSelector.first.figure.rect
        let cy = Math.round(r.y + r.height/2)
        if (!this._aligner.checkVerticalBoundaries(this._app.aSelector.list, cy, d.height))
          alert('Aligning horizontally selected elements makes at least one of them outside of image boudaries!')
        else
          this._aligner.alignHorizontally(this._app.aSelector.list, cy)
      }
    }
    
    _onAlignCenterVertically() {
      if (1 < this._app.aSelector.count) {
        let d = this._app.workspace.getDims()
        let r = this._app.aSelector.first.figure.rect
        let cx = Math.round(r.x + r.width/2)
        if (!this._aligner.checkHorizontalBoundaries(this._app.aSelector.list, cx, d.width))
          alert('Aligning vertically selected elements makes at least one of them outside of image boudaries!')
        else
          this._aligner.alignVertically(this._app.aSelector.list, cx)
      }
    }
    
    _onAlignLeft() {
      if (1 < this._app.aSelector.count) {
        let d = this._app.workspace.getDims()
        let r = this._app.aSelector.first.figure.rect
        if (!this._aligner.checkRightBoundaries(this._app.aSelector.list, r.x, d.width))
          alert('Aligning on left side selected elements makes at least one of them outside of image boudaries!')
        else
          this._aligner.alignLeft(this._app.aSelector.list, r.x)
      }
    }
    
    _onAlignTop() {
      if (1 < this._app.aSelector.count) {
        let d = this._app.workspace.getDims()
        let r = this._app.aSelector.first.figure.rect
        if (!this._aligner.checkBottomBoundaries(this._app.aSelector.list, r.y, d.height))
          alert('Aligning on top side selected elements makes at least one of them outside of image boudaries!')
        else
          this._aligner.alignTop(this._app.aSelector.list, r.y)
      }
    }
    
    _onAlignRight() {
      if (1 < this._app.aSelector.count) {
        let d = this._app.workspace.getDims()
        let r = this._app.aSelector.first.figure.rect
        if (!this._aligner.checkLeftBoundaries(this._app.aSelector.list, r.x + r.width))
          alert('Aligning on right side selected elements makes at least one of them outside of image boudaries!')
        else
          this._aligner.alignRight(this._app.aSelector.list, r.x + r.width)
      }
    }
    
    _onAlignBottom() {
      if (1 < this._app.aSelector.count) {
        let d = this._app.workspace.getDims()
        let r = this._app.aSelector.first.figure.rect
        if (!this._aligner.checkTopBoundaries(this._app.aSelector.list, r.y + r.height))
          alert('Aligning on bottom side selected elements makes at least one of them outside of image boudaries!')
        else
          this._aligner.alignBottom(this._app.aSelector.list, r.y + r.height)
      }
    }

    get handlers() {
      return {
        onGridScopeChange         : this._onGridScopeChange.bind(this),
        onGridAlignChange         : this._onGridAlignChange.bind(this),
        onGridSpaceChange         : this._onGridSpaceChange.bind(this),
        onShowOrder               : this._onShowOrder.bind(this),
        onGridOrderChange         : this._onGridOrderChange.bind(this),
        onPropsSave               : this._onPropsSave.bind(this),
        onPropsRestore            : this._onPropsRestore.bind(this),
        onResize                  : this._onResize.bind(this),
        onAlignCenterHorizontally : this._onAlignCenterHorizontally.bind(this),
        onAlignCenterVertically   : this._onAlignCenterVertically.bind(this),
        onAlignLeft               : this._onAlignLeft.bind(this),
        onAlignTop                : this._onAlignTop.bind(this),
        onAlignRight              : this._onAlignRight.bind(this),
        onAlignBottom             : this._onAlignBottom.bind(this)
      }
    }

    _onAreaEnter(e) {
      if (this._app.aSelector.count === 0) {
        this._app.tools.displayAreaProps(this._app.model.findArea(e.target))
      }
    }
    
    _onAreaLeave(e) {
      if (this._app.aSelector.count === 0) {
        this._app.tools.resetAreaProps()
      }
    }
    
    managePropsDisplay(areas) {
      areas.forEach(e => {
        e.dom.addEventListener('mouseover', this._onAreaEnter.bind(this), false)
        e.dom.addEventListener('mouseleave', this._onAreaLeave.bind(this), false)
      });
    }
    
  }

  // APPLICATION

  class Application {

    constructor() {

      window.addEventListener("dragenter", this._preventWindowDrop)
      window.addEventListener("dragover", this._preventWindowDrop)
      window.addEventListener("drop", this._preventWindowDrop)

      this._aMenu     = new AppMenuHandlers(this)
      this._aProjects = new AppProjectHandlers(this)
      this._aDragger  = new AppDragHandlers(this)
      this._aDrawer   = new AppDrawHandlers(this)
      this._aSelector = new AppSelectHandlers(this)
      this._aMover    = new AppMoveHandlers(this)
      this._aEditor   = new AppEditHandlers(this)
      this._aTooler   = new AppToolHandlers(this)

      this._model     = new Model()
      this._footer    = new Footer()
      this._menu      = new Menu({ handlers : this._aMenu.handlers })
      this._workspace = new Workspace({
        handlers : {
          dragger   : this._aDragger.handlers,
          drawer    : this._aDrawer.handlers,
          selector  : this._aSelector.handlers,
          mover     : this._aMover.handlers,
          editor    : this._aEditor.handlers
        },
        ftr : this._footer
      })
      this._tools     = new Tools({ handlers : this._aTooler.handlers })
      this._store     = new Store({ workspace : this._workspace })
      this._clipboard = new Clipboard({ workspace :  this._workspace, copyOffset : 10 })

      this._manager   = new ProjectManagerDialog({
        model : this._model,
        store : this._store,
        handlers : this._aProjects.handlers
      })
      this._creator   = new ProjectCreatorDialog({
        handlers : Object.assign({ checkFile : this._model.checkImgFile }, this._aProjects.handlers)
      })
      this._opener    = new ProjectLoaderDialog({
        store : this._store,
        handlers : this._aProjects.handlers
      })
      this._loader    = new HtmlLoaderDialog({ handlers : this._aProjects.handlers })
      this._generator = new CodeGeneratorDialog({ handlers : this._aProjects.handlers })
      this._helper    = new HelpDialog({ handlers : this._aProjects.handlers })

    }

    _preventWindowDrop(e) {
      if (e.target.id != $('file-drop-zone')) {
        e.preventDefault()
        e.dataTransfer.effectAllowed = "none"
        e.dataTransfer.dropEffect = "none"
      }
    }

    get aMenu()     { return this._aMenu }
    get aProjects() { return this._aProjects }
    get aDragger()  { return this._aDragger }
    get aDrawer()   { return this._aDrawer }
    get aSelector() { return this._aSelector }
    get aMover()    { return this._aMover }
    get aEditor()   { return this._aEditor }
    get aTooler()   { return this._aTooler }

    get model()     { return this._model }
    get store()     { return this._store }
    get clipboard() { return this._clipboard }
    get menu()      { return this._menu }
    get footer()    { return this._footer }
    get workspace() { return this._workspace }
    get tools()     { return this._tools }
    get manager()   { return this._manager }
    get creator()   { return this._creator }
    get opener()    { return this._opener }
    get loader()    { return this._loader }
    get generator() { return this._generator }
    get helper()    { return this._helper }

    setModified(unsafe) {
      this._model.modified = true
      this._menu.canSave()
      if (unsafe) this._clipboard.setCopyUnsafe()
    }

    setUnmodified(unsafe) {
      this._model.modified = false
      this._menu.preventSave()
      if (unsafe) this._clipboard.setCopyUnsafe()
    }

    freeze() {
      this._workspace.freeze()
      this._tools.freeze()
      this._menu.freeze()
    }

    release() {
      this._workspace.release()
      this._tools.release()
      this._menu.release()
    }

  }

  const theApp = new Application()

})(); /* BIT */
