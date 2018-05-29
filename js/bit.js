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

  var mdl = (function() {

    var imgTypes = ['image/jpeg', 'image/gif', 'image/png'],
        context = {
          mode      : 'new',
          modified  : false,
          dataURL   : '',
          filename  : '',
          type      : '',
          size      : 0,
          name      : '',
          alt       : '',
          width     : 0,
          height    : 0,
          areas     : []
        };
    
    function validateImgFile(f) {
      for(var i = 0; i < imgTypes.length; i++) {
        if(f.type === imgTypes[i]) {
          return true;
        }
      }
      return false;
    }

    function reset() {
      context.mode = 'new';
      context.modified = false;
      context.dataURL = context.filename = context.type = '';
      context.size = 0;
      context.name = context.alt = '';
      context.width = context.height = 0;
      context.areas.sort((a,b) => a.isGrid ? -1 : 1);
      context.areas.forEach(e => e.remove());
      context.areas.splice(0, context.areas.length);
      return this;
    }

    function setFile(f) {
      var reader = new FileReader();
      if (validateImgFile(f)) {
        reader.addEventListener('load', () => context.dataURL = reader.result, false);
        reader.readAsDataURL(f);
        context.filename = f.name;
        context.type = f.type;
        context.size = f.size;
        return true;
      }
      return false;
    }

    function getFile() {
      return context.filename; 
    }

    function setInfo(data) {
      context.name = data.name;
      context.alt = data.alt;
    }

    function getInfo() {
      return { name : context.name, alt : context.alt };
    }

    function getAreas() {
      return context.areas.slice();
    }

    function addArea(area) {
      context.areas.push(area);
    }

    function addAreas(areas) {
      areas.forEach(e => context.areas.push(e));
    }

    function removeArea(area) {
      if(-1 != context.areas.indexOf(area)) {
        if (!area.isGrid && area.hasBonds()) {
          if (false == confirm("Deleting this element will automatically delete grid built from it.\nDo you still want to proceed to element deletion ?")) {
            return;
          }
          let bonds = area.copyBonds();
          bonds.forEach(e => {
            let j = context.areas.indexOf(e);
            e.remove();
            context.areas.splice(j, 1);
          });
          bonds.splice(0, bonds.length);
        }
        let i = context.areas.indexOf(area);
        area.remove();
        context.areas.splice(i, 1);
      }
    }

    function findArea(obj) {
      return context.areas.find(function(e) {
        return e.is(obj);
      });
    }

    function freezeGridArea(grid, areas, specialize) {
      if (!grid.isGrid ||
          false === confirm("Freezing this element will automatically delete grid dependencies and generate independent elements.\nDo you still want to proceed to grid freeze ?")) {
        return false;
      }
      let i = context.areas.indexOf(grid);
      grid.freezeTo(areas, specialize);
      grid.remove();
      context.areas.splice(i, 1);
      areas.forEach(e => context.areas.push(e));
      return true;
    }

    function toStore(a2s) {
      let rtn = {};
      rtn.dataURL = context.dataURL;
      rtn.name = context.name;
      rtn.alt = context.alt;
      rtn.filename = context.filename;
      rtn.type = context.type;
      rtn.size = context.size;
      rtn.areas = [];
      context.areas.sort((a,b) => a.isGrid ? 1 : -1);
      context.areas.forEach((e,i,a) => rtn.areas.push(a2s(e, i, a)));
      return rtn;
    }
    
    function fromStore(project, s2a) {
      context.modified = false;
      context.dataURL = project.dataURL;
      context.name = project.name;
      context.alt = project.alt;
      context.filename = project.filename;
      context.type = project.type;
      context.size = project.size;
      context.areas = [];
      project.areas.forEach((e,i) => context.areas.push(s2a(e, i, context.areas)));
      return true;
    }

    function toClipboard(selected, a2c) {
      let rtn = {};
      rtn.areas = [];
      context.areas.sort((a,b) => a.isGrid ? 1 : -1);
      context.areas.forEach((e,i,a) => rtn.areas.push(a2c(e, i, a)));
      rtn.selected = [];
      selected.forEach((e) => rtn.selected.push(context.areas.indexOf(e)));
      rtn.basic = selected.reduce((a,e) => a && !e.isGrid, true);
      return rtn;
    }

    function fromClipboard(c, c2a, deep) {
      let area, copied = [];
      if (c.basic || (!deep && !c.unsafe)) {
        c.selected.forEach(e => {
          area = c2a(c.areas[e], e, context.areas);
          copied.push(area);
        });
      } else {
        // Deep copy - include grid bonds if not originally selected
        let insert, index, deep;
        deep = c.selected.slice().sort((a,b) => c.areas[a].isGrid ? 1 : -1);
        insert = deep.findIndex(e => c.areas[e].isGrid);
        c.selected.forEach(e => {
          area = c.areas[e];
          if (area.isGrid) {
            index = deep.indexOf(area.bonds[0]);
            if (-1 === index) {
              deep.splice(insert, 0, area.bonds[0]);
              index = insert++;
            }
            area.bonds[0] = index;
          }
        });
        deep.forEach((e,i) => {
          c.areas[e].index = i;
          area = c2a(c.areas[e], i, copied);
          copied.push(area);
        });
      }
      return copied;
    }

    return {
      setModified : () => context.modified = true,
      setUnmodified : () => context.modified = false,
      isModified : () => context.modified,
      reset,
      validateImgFile, setFile, getFile,
      setInfo, getInfo,
      getAreas, addArea, addAreas, removeArea, findArea,
      forEachArea : f => context.areas.forEach(f),
      freezeGridArea,
      toStore, fromStore,
      toClipboard, fromClipboard
    };

  })(); /* DATA MODEL MANAGEMENT */

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
  let store = null;

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
  let clipboard = null;

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
          w.classList.add(utils.clsActions.DRAGGING);
          tls.freeze(); // TODO: to be transferred
          return true;
        },
        onProgress : (p,e,w) => {
          w.scrollLeft -= e.movementX;
          w.scrollTop  -= e.movementY;
        },
        onExit : w => {
          w.classList.remove(utils.clsActions.DRAGGING);
          tls.release(); // TODO: to be transferred
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
          this._handlers.onTrackStart(this._drawarea, p);
          this._drawarea.classList.add(utils.clsActions.TRACKING);
          return true;
        },
        onProgress : p => this._handlers.onTrackProgress(p),
        onEnd : () => this._handlers.onTrackEnd(),
        onExit : () => {
          this._handlers.onTrackExit();
          this._drawarea.classList.remove(utils.clsActions.TRACKING);
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
      document.removeEventListener('keydown', this.onKeyAction)
      super._activate()
    }

    _inactivate() {
      this._element.addEventListener('click', this.onSelect)
      document.addEventListener('keydown', this.onKeyAction)
      super._inactivate()
    }

    enable() {
      if (!this._enabled) {
        super.enable()
        this._element.addEventListener('click', this.onSelect)
        document.addEventListener('keydown', this.onKeyAction)
      }
    }

    disable() {
      if (this._enabled) {
        super.disable()
        this._element.removeEventListener('click', this.onSelect)
        document.removeEventListener('keydown', this.onKeyAction)
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
      this._doms = c.doms;
      this._ftr = c.ftr;
      this._group = new bittls.MouseStateMachineRadioGroup([], states.READY)
      this._group.state = states.OPEN
      this._viewport = new Viewport ({
        wks : c.doms.wks, footer : c.doms.footer, aside : c.doms.aside, container : c.doms.container,
        workarea : c.doms.workarea, drawarea : c.doms.drawarea, gridarea : c.doms.gridarea,
        image : c.doms.image
      })
      this._coordTracker = new bittls.MousePositionTracker({
        trackedElement: c.doms.workarea,
        displayElement : c.doms.coords,
        translate : this._viewport.translateCoords
      })
      this._imageDragger = new ImageDragger({
        workarea : c.doms.workarea,
        viewport : this._viewport, handlers : c.handlers.dragger, group : this._group
      })
      this._areaDrawer = new AreaDrawer({
        workarea : c.doms.workarea, drawarea : c.doms.drawarea, gridarea : c.doms.gridarea,
        viewport : this._viewport, handlers : c.handlers.drawer, group : this._group
      })
      this._areaSelector = new AreaSelector({
        workarea : c.doms.workarea, drawarea : c.doms.drawarea,
        viewport : this._viewport, handlers : c.handlers.selector, group : this._group
      })
      this._areaMover = new AreaMover({
        workarea : c.doms.workarea, drawarea : c.doms.drawarea,
        viewport : this._viewport, handlers : c.handlers.mover, group : this._group
      })
      this._areaEditor = new AreaEditor({
        workarea : c.doms.workarea, drawarea : c.doms.drawarea,
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
      return [this._doms.container, this._doms.image]
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

  let wks = null;

  /*
   * TOOLS PALETTE MANAGEMENT 
   */

  var tls = (function() {

    const modes = utils.fgTypes;
    const scopes = bitgrid.scopes;
    const aligns = bitgrid.aligns;
    const orders = bitgrid.orders;
    const properties = bitmap.properties;

    const inForm = [
      { dom : $('href-prop'),         prop  : properties.HREF },
      { dom : $('alt-prop'),          prop  : properties.ALT },
      { dom : $('title-prop'),        prop  : properties.TITLE },
      { dom : $('id-prop'),           prop  : properties.ID }
    ];

    const doms = {
      btnPropsSave    : $('area-props-save'),
      btnPropsRestore : $('area-props-restore')
    };

    var context = {
        handlers    : null,
        selected    : null,
        allowGrid   : false,
        freezed     : true,
        scope       : scopes.INNER,
        align       : aligns.STANDARD,
        order       : orders.TOPLEFT,
        space       : 0,
        gParam      : true
    };

    const disabler = new bittls.ContainerMask({
      containerElement : $('tools'),
      maskElement : document.querySelector('#tools .mask')
    });

    const gridModes = [
      modes.GRIDHEX,
      modes.GRIDRECTANGLE,
      modes.GRIDCIRCLE
    ];

    const noPattern = [
      utils.fgTypes.NONE,
      utils.fgTypes.GRIDRECTANGLE,
      utils.fgTypes.GRIDHEX,
      utils.fgTypes.GRIDCIRCLE,
      utils.fgTypes.POLYGON
    ];

    const drawMode = new bittls.TRadioToggles({
      map : [
        { element : $('hex-d'),           value : modes.HEXDTR },
        { element : $('hex-r'),           value : modes.HEXRCT },
        { element : $('rectangle'),       value : modes.RECTANGLE },
        { element : $('square'),          value : modes.SQUARE },
        { element : $('rhombus'),         value : modes.RHOMBUS },
        { element : $('triangle-e'),      value : modes.TRIANGLEEQL },
        { element : $('triangle-i'),      value : modes.TRIANGLEISC },
        { element : $('triangle-r'),      value : modes.TRIANGLERCT },
        { element : $('ellipse'),         value : modes.ELLIPSE },
        { element : $('circle-d'),        value : modes.CIRCLEDTR },
        { element : $('circle-c'),        value : modes.CIRCLECTR },
        { element : $('polygon'),         value : modes.POLYGON },
        { element : $('hex-grid'),        value : modes.GRIDHEX },
        { element : $('rectangle-grid'),  value : modes.GRIDRECTANGLE },
        { element : $('circle-grid'),     value : modes.GRIDCIRCLE }
      ],
      noneValue : modes.NONE,
      initialValue : modes.NONE,
      action : () => {
        blurAreaProps();
      }
    });

    const isGridDrawModeSelected = () => (gridModes.find(e => (e === drawMode.value)));
    const getDrawMode = () => drawMode.value;
    const clearDrawMode = () => drawMode.value = modes.NONE;
    const canGrid = obj => (noPattern.find(e => (e === obj.type))) ? false : true;
    function enableGridMode(obj) {
      if (!context.allowGrid && canGrid(obj)) {
        drawMode.enable(gridModes);
        context.allowGrid = true;
      } else if (context.allowGrid && !canGrid(obj)) {
        drawMode.disable(gridModes);
        context.allowGrid = false;
      }
    }

    function disableGridMode() {
      if (context.allowGrid) {
        drawMode.disable(gridModes);
        context.allowGrid = false;
      }
    }

    const gridScope = new bittls.TToggle({
      map : [
        { element : $('grid-scope-inner'),  value : scopes.INNER },
        { element : $('grid-scope-outer'),  value : scopes.OUTER }
      ],
      initialValue : context.scope,
      action : v => {
        blurAreaProps();
        if (context.gParam)
          context.scope = v;
        context.handlers.onGridScopeChange(v);
      }
    });
    const setGridScope = v => gridScope.value = v || context.scope;
    const getGridScope = () => context.scope;

    const gridAlign = new bittls.TToggle({
      map : [ 
        { element : $('grid-algn-std'),     value : aligns.STANDARD },
        { element : $('grid-algn-alt'),     value : aligns.ALT_HORIZONTAL },
        { element : $('grid-algn-alt2'),    value : aligns.ALT_VERTICAL }
      ],
      initialValue : context.align,
      action : v => {
        blurAreaProps();
        if (context.gParam)
          context.align = v;
        context.handlers.onGridAlignChange(v);
      }
    });
    const setGridAlign = v => gridAlign.value = v || context.align;
    const getGridAlign = () => context.align;

    const gridSpace = new bittls.TNumber({
      element : $('grid-space'),
      initialValue : context.space,
      action : v => {
        blurAreaProps();
        if (context.gParam)
          context.space = v;
        context.handlers.onGridSpaceChange(v);
      }
    });
    const setGridSpace = v => gridSpace.value = (v === 0) ? 0 : (v || context.space);
    const getGridSpace = () => context.space;

    const gridOrder = new bittls.TToggle({
      map : [ 
        { element : $('grid-order-tl'),     value : orders.TOPLEFT },
        { element : $('grid-order-lt'),     value : orders.LEFTTOP },
        { element : $('grid-order-lb'),     value : orders.LEFTBOTTOM },
        { element : $('grid-order-bl'),     value : orders.BOTTOMLEFT },
        { element : $('grid-order-br'),     value : orders.BOTTOMRIGHT },
        { element : $('grid-order-rb'),     value : orders.RIGHTBOTTOM },
        { element : $('grid-order-rt'),     value : orders.RIGHTTOP },
        { element : $('grid-order-tr'),     value : orders.TOPRIGHT }
      ],
      initialValue : context.order,
      action : v => {
        blurAreaProps();
        if (context.gParam)
          context.order = v;
        context.handlers.onGridOrderChange(v);
      }
    });
    const setGridOrder = v => gridOrder.value = v || context.order;
    const getGridOrder = () => context.order;

    const showOrder = new bittls.TState({
      element : $('show-order'), 
      action : v => {
        blurAreaProps();
        context.handlers.onShowOrder(v);
      }
    }); 

    function gridParamsReset() {
      gridScope.reset();
      gridAlign.reset();
      gridSpace.reset();
      gridOrder.reset();
      showOrder.reset();
    }

    function updateGridParams(obj) {
      if (obj && obj.isGrid) {
        context.gParam = false;
        setGridScope(obj.gridScope);
        setGridAlign(obj.gridAlign);
        setGridSpace(obj.gridSpace);
        setGridOrder(obj.gridOrder);
      } else {
        context.gParam = true;
        setGridScope();
        setGridAlign();
        setGridSpace();
        setGridOrder();
      }
    }

    var blurAreaProps = () => inForm.forEach(e => e.dom.blur());
    var onPropsKey = (e) => e.stopPropagation();
    var resetAreaProps = () => inForm.forEach(e => e.dom.defaultValue = e.dom.value = "...");

    function displayAreaProps(obj) {
      let props = obj.areaProperties;
      inForm.forEach(e => e.dom.defaultValue = e.dom.value = props[e.prop] || "");
    }

    function enableAreaProps(obj) {
      inForm.forEach(e => e.dom.disabled = false);
      displayAreaProps(obj);
      doms.btnPropsSave.disabled = doms.btnPropsRestore.disabled = true;
    }

    function disableAreaProps() {
      inForm.forEach(e => {
        e.dom.defaultValue = e.dom.value = "...";
        e.dom.blur();
        e.dom.disabled = true;
      });
      doms.btnPropsSave.disabled = doms.btnPropsRestore.disabled = true;
    }

    function onPropsInput(e) {
      let d = inForm.reduce( (a,e) => a && (e.dom.defaultValue === e.dom.value), true);
      doms.btnPropsSave.disabled = doms.btnPropsRestore.disabled = d;
    }

    function onPropsSave(e) {
      let p = {};
      inForm.forEach(e => p[e.prop] = e.dom.value);
      context.handlers.onPropsSave(p);
      e.preventDefault();
    }

    function onPropsRestore(e) {
      context.handlers.onPropsRestore();
      e.preventDefault();
    }

    function saveAreaProps(obj, p) {
      obj.areaProperties = p;
      inForm.forEach(e => e.dom.defaultValue = e.dom.value);
      doms.btnPropsSave.disabled = doms.btnPropsRestore.disabled = true;
    }

    function restoreAreaProps(obj) {
      displayAreaProps(obj);
      doms.btnPropsSave.disabled = doms.btnPropsRestore.disabled = true;
    }

    const resize = new bittls.TButton({
      element : $('resize'),
      action : () => context.handlers.onResize()
    });

    const alignLeft = new bittls.TButton({
      element : $('align-left'),
      action : () => context.handlers.onAlignLeft()
    });

    const alignTop = new bittls.TButton({
      element : $('align-top'),
      action : () => context.handlers.onAlignTop()
    });

    const alignRight = new bittls.TButton({
      element : $('align-right'),
      action : () => context.handlers.onAlignRight()
    });

    const alignBottom = new bittls.TButton({
      element : $('align-bottom'),
      action : () => context.handlers.onAlignBottom()
    });

    const alignCenterHorizontally = new bittls.TButton({
      element : $('align-center-h'),
      action : () => context.handlers.onAlignCenterHorizontally()
    });

    const alignCenterVertically = new bittls.TButton({
      element : $('align-center-v'),
      action : () => context.handlers.onAlignCenterVertically()
    });

    return {

      init : function(handlers) {
        context.handlers = handlers;
        this.release();
      },

      reset : function() {
        drawMode.disable(gridModes);
        drawMode.value = modes.NONE;
        context.allowGrid = false;
        gridParamsReset();
        context.gParam = true;
        context.space = 0;
        context.scope = gridScope.value;
        context.align = gridAlign.value;
        context.order = gridOrder.value;
        disableAreaProps();
        this.release();
      },

      getDrawMode, clearDrawMode,
      getGridScope,
      getGridAlign,
      getGridOrder,
      getGridSpace,
      
      none : () => modes.NONE === drawMode.value ? true : false,

      freeze : function() {
        if (context.freezed) return;
        doms.btnPropsSave.removeEventListener('click', onPropsSave, false);
        doms.btnPropsRestore.removeEventListener('click', onPropsRestore, false);
        inForm.forEach(e => {
          e.dom.removeEventListener('keydown', onPropsKey, false);
          e.dom.removeEventListener('input', onPropsInput, false)
          e.dom.blur();
        });
        disabler.maskElement();
        context.freezed = true;
      },

      release : function() {
        if (!context.freezed) return;
        doms.btnPropsSave.addEventListener('click', onPropsSave, false);
        doms.btnPropsRestore.addEventListener('click', onPropsRestore, false);
        inForm.forEach(e => {
          e.dom.addEventListener('input', onPropsInput, false)
          e.dom.addEventListener('keydown', onPropsKey, false)
        });
        disabler.unmaskElement();
        context.freezed = false;
      },

      isGridDrawModeSelected,

      enableGridTools : function(obj) {
        enableGridMode(obj);
        updateGridParams(obj);
        enableAreaProps(obj);
      },

      disableGridTools() {
        disableGridMode();
        updateGridParams();
        disableAreaProps();
      },

      blurAreaProps,
      resetAreaProps,
      disableAreaProps,
      saveAreaProps,
      restoreAreaProps,
      displayAreaProps,

      modes, scopes, aligns, orders

    };

  })(); /* TOOLS PALAETTE MANAGEMENT */

  /*
   * FOOTER DISPLAY MANAGEMENT
   */

  class Footer {

    constructor(c) {
      this._doms = c.doms
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
  let footer = null;

  /*
   * MAP PROJECT MANAGER
   */

  var prj = (function() {

    var doms = {
      projects  : $('project-manager'),
      list      : document.querySelector('#project-manager .project-list'),
      closeBtn  : document.querySelector('#project-manager .close'),
      deleteBtn : document.querySelector('#project-manager .delete'),
      clearBtn  : document.querySelector('#project-manager .clear')
    },
    context = {
      handlers : null,
      canClear : true
    };
    
    var hide = (obj) => obj.style.display = 'none';
    var show = (obj) => obj.style.display = 'block';

    function fill() {
      let canClearAll, content, flag;
      canClearAll = true;
      content = '';
      store.list().forEach(e => {
        flag = '';
        if (e === mdl.getInfo().name) {
          flag = ' disabled';
          canClearAll = false;
        }
        content += '<option value="' + e + '"' + flag + '>' + e + '</option>';
      });
      doms.list.innerHTML = content;
      return canClearAll;
    }

    function close() {
      hide(doms.projects);
      doms.list.innerHTML = '';
      context.handlers.onClose();
    }

    function onClose(e) {
      e.preventDefault();
      close();
    }

    function onDelete(e) {
      let i, sel;
      e.preventDefault();
      sel = [];
      for (i = 0; i < doms.list.options.length; i++) {
        if (doms.list.options[i].selected) {
          sel.push(doms.list.options[i].value);
        }
      }
      sel.forEach(e => store.remove(e));
      fill();
    }

    function onClear(e) {
      e.preventDefault();
      if (context.canClear) {
        store.reset();
        fill();
      }
    }

    function onKeyAction(e) {
      if('Escape' === e.key) {
        e.preventDefault();
        close();
      }
    }

    return {

      init : function(handlers) {
        context.handlers = handlers;
        doms.closeBtn.addEventListener('click', onClose, false);
        doms.deleteBtn.addEventListener('click', onDelete, false);
        doms.clearBtn.addEventListener('click', onClear, false);
        document.addEventListener('keydown', onKeyAction);
      },

      show : function() {
        context.canClear = fill();
        doms.clearBtn.disabled = !context.canClear;
        show(doms.projects);
      }

    };

  })(); /* MAP PROJECT MANAGEMENT */

  /*
   *  MAP PROJECT CREATOR
   */

  var ctr = (function() {

    var doms = {
      creator       : $('project-creator'),
      btnSet        : document.querySelector('#project-creator .create'),
      btnCancel     : document.querySelector('#project-creator .cancel'),
      dropZone      : $('image-drop-zone'),
      imagePreview  : document.querySelector('#project-creator .preview'),
      inImageFile   : $('load-image-file'),
      inMapName     : $('map-name'),
      inMapAlt      : $('map-alt')
    },
    context = {
      handlers : null,
      file     : null,
      filename : ''
    };

    var hide = (obj) => obj.style.display = 'none';
    var show = (obj) => obj.style.display = 'block';

    function validate() {
      return (doms.inMapName.value !== '' && context.filename !== '');
    }

    function processFiles(files) {
      clear();
      if (1 < files.length || 0 == files.length || !mdl.validateImgFile(files[0])) {
        error(doms.dropZone);
        doms.btnSet.disabled = true;
      } else {
        context.file = files[0];
        context.filename = window.URL.createObjectURL(context.file);
        doms.imagePreview.src = context.filename;
        show(doms.imagePreview);
        doms.btnSet.disabled = !validate();
      }
    }

    function clear() {
      hide(doms.imagePreview);
      doms.imagePreview.src = '';
      doms.dropZone.classList.remove('error');
      doms.btnSet.disabled = true;
      context.file = null;
      context.filename = '';
    }

    function close() {
      hide(doms.creator);
      clear();
      context.handlers.onClose();
    }

    function error(obj) {
      obj.classList.add('error');
    }

    function onDragOver(e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    function onDragLeave(e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    function onDrop(e) {
      e.stopPropagation();
      e.preventDefault();
      processFiles(e.dataTransfer.files);
      doms.inImageFile.value = '';
    }

    function onImageFileChange(e) {
      e.preventDefault();
      processFiles(e.target.files);
    }

    function onNameInput(e) {
      doms.btnSet.disabled = !validate();
    }

    function onSetClick(e) {
      e.preventDefault();
      if(validate()) {
        let data = {
          filename  : context.filename,
          file      : context.file,
          name      : doms.inMapName.value,
          alt       : doms.inMapAlt.value
        };
        if (!context.handlers.onNewMap(data)) {
          console.log('ERROR - Invalid input management');
        }
        hide(doms.creator);
        clear();
      } else {
        if (doms.inMapName.value === '') {
          error(doms.inMapName);
        } else {
          error(doms.dropZone);
        }
      }
    }

    function onCancelClick(e) {
      e.preventDefault();
      close();
    }

    function onKeyAction(e) {
      if('Escape' === e.key) {
        e.preventDefault();
        close();
      }
    }

    return {

      init : function(handlers) {
        context.handlers = handlers;
        doms.btnSet.addEventListener('click', onSetClick, false);
        doms.btnCancel.addEventListener('click', onCancelClick, false);
        doms.dropZone.draggable = true;
        doms.dropZone.addEventListener('dragover', onDragOver, false);
        doms.dropZone.addEventListener('dragleave', onDragLeave, false);
        doms.dropZone.addEventListener('drop', onDrop, false);
        doms.inImageFile.addEventListener('change', onImageFileChange, false);
        doms.inMapName.addEventListener('input', onNameInput, false);
        document.addEventListener('keydown', onKeyAction);
        return this.reset();
      },

      reset : function() {
        clear();
        doms.inImageFile.value = doms.inImageFile.defaultValue = '';
        doms.inMapName.value = doms.inMapName.defaultValue = '';  
        doms.inMapAlt.value = doms.inMapAlt.defaultValue = '';  
        return this;
      },

      show : function() {
        show(doms.creator);
      }

    }

  })(); /* MAP PROJECT CREATOR */

  /*
   * MAP PROJECT LOADER 
   */

  var ldr = (function() {

    var doms = {
      loader        : $('project-loader'),
      list          : document.querySelector('#project-loader .project-list'),
      btnLoad       : document.querySelector('#project-loader .select'),
      btnCancel     : document.querySelector('#project-loader .cancel'),
      imagePreview  : document.querySelector('#project-loader .preview')
    },
    context = {
      handlers : null
    };

    var hide = (obj) => obj.style.display = 'none';
    var show = (obj) => obj.style.display = 'block';

    function fill() {
      let content = '';
      store.list().forEach(e => content += '<option value="' + e + '">' + e + '</option>' );
      doms.list.innerHTML = content;
    }

    function loadPreview() {
      let project;
      project = store.read(doms.list.options[doms.list.selectedIndex].value);
      doms.imagePreview.src = project.dataURL;
    }

    function clear() {
      hide(doms.imagePreview);
      doms.imagePreview.src = '';
      doms.list.innerHTML = '';
      doms.btnLoad.disabled = true;
    }

    function reset() {
      clear();
      fill();
      if (doms.list.length > 0) {
        doms.btnLoad.disabled = false;
        loadPreview();
        show(doms.imagePreview);
      }
    }

    function close() {
      hide(doms.loader);
      clear();
      context.handlers.onClose();
    }

    function onSelect(e) {
      loadPreview();
    }

    function onLoadClick(e) {
      let value;
      e.preventDefault();
      value = doms.list.options[doms.list.selectedIndex].value;
      hide(doms.loader);
      clear();
      context.handlers.onLoadMap(value);
    }

    function onCancelClick(e) {
      e.preventDefault();
      close();
    }

    function onKeyAction(e) {
      if('Escape' === e.key) {
        e.preventDefault();
        close();
      }
    }

    return {

      init : function(handlers) {
        context.handlers = handlers;
        doms.btnLoad.addEventListener('click', onLoadClick, false);
        doms.btnCancel.addEventListener('click', onCancelClick, false);
        doms.list.addEventListener('input', onSelect, false);
        document.addEventListener('keydown', onKeyAction);
        return this;
      },

      show : function() {
        reset();
        show(doms.loader);
      }

    };

  })(); /* MAP PROJECT LOADER */

  /*
   * MAP CODE DISPLAY
   */

  var code = (function() {

    var doms = {
      codeViewer  : $('project-code'),
      code        : $('code-result'),
      btnSelect   : document.querySelector('#project-code .select'),
      btnClear    : document.querySelector('#project-code .clear'),
      btnClose    : document.querySelector('#project-code .close')
    },
    context = {
      handlers : null
    };

    var hide = (obj) => obj.style.display = 'none';
    var show = (obj) => obj.style.display = 'block';

    function close() {
      hide(doms.codeViewer);
      reset();
      context.handlers.onClose();
    }

    function onSelectClick(e) {
      e.preventDefault();
      utils.selectText(doms.code);
    }

    function onClearClick(e) {
      e.preventDefault();
      utils.unselect();
    }

    function onCloseClick(e) {
      e.preventDefault();
      close();
    }

    function onKeyAction(e) {
      switch(e.key) {
      case 'a':
        if (utils.ctrlMetaKey(e)) {
          e.preventDefault();
          utils.selectText(doms.code);
        }
        break;
      case 'Escape':
        e.preventDefault();
        close();
        break;
      default:
      }
    }

    function reset() {
      code.innerHTML = '';
    }

    return {

      init(handlers) {
        context.handlers = handlers;
        doms.btnSelect.addEventListener('click', onSelectClick, false);
        doms.btnClear.addEventListener('click', onClearClick, false);
        doms.btnClose.addEventListener('click', onCloseClick, false);
        document.addEventListener('keydown', onKeyAction);
        return this;
      },

      show : function(s) {
        reset();
        doms.code.innerHTML = s;
        show(doms.codeViewer);
      }

    };

  })();

  /*
   * HTML CODE LOADER
   */

  var htm = (function() {

    var doms = {
      codeLoader : $('code-loader'),
      btnLoad    : document.querySelector('#code-loader .select'),
      btnClear   : document.querySelector('#code-loader .clear'),
      btnCancel  : document.querySelector('#code-loader .cancel'),
      code       : $('input-code')
    },
    context = {
      handlers : null
    };

    var hide = (obj) => obj.style.display = 'none';
    var show = (obj) => obj.style.display = 'block';

    function clear() {
      doms.btnLoad.disabled = true;
    }

    function reset() {
      clear();
      if (doms.code.value != '') {
        doms.btnLoad.disabled = false;
      }
    }

    function close() {
      hide(doms.codeLoader);
      clear();
      context.handlers.onClose();
    }

    function onCodeInput(e) {
      doms.btnLoad.disabled = (doms.code.value === '');
    }

    function onLoadClick(e) {
      e.preventDefault();
      hide(doms.codeLoader);
      clear();
      context.handlers.onLoadCode(doms.code.value);
    }

    function onClearClick(e) {
      e.preventDefault();
      doms.code.value = '';
      doms.btnLoad.disabled = true;
    }

    function onCancelClick(e) {
      e.preventDefault();
      close();
    }

    function onKeyAction(e) {
      if('Escape' === e.key) {
        e.preventDefault();
        close();
      }
    }

    return {

      init : function(handlers) {
        context.handlers = handlers;
        doms.btnLoad.addEventListener('click', onLoadClick, false);
        doms.btnCancel.addEventListener('click', onCancelClick, false);
        doms.btnClear.addEventListener('click', onClearClick, false);
        doms.code.addEventListener('input', onCodeInput, false);
        document.addEventListener('keydown', onKeyAction);
      },

      show() {
        reset();
        show(doms.codeLoader);
      }

    };

  })();

  /*
   * help DISPLAY
   */

  var help = (function() {

    var doms = {
      help        : $('help-display'),
      btnClose    : document.querySelector('#help-display .close')
    },
    context = {
      handlers : null
    };

    var hide = (obj) => obj.style.display = 'none';
    var show = (obj) => obj.style.display = 'block';

    function close() {
      hide(doms.help);
      context.handlers.onClose();
    }

    function onCloseClick(e) {
      e.preventDefault();
      close();
    }

    function onKeyAction(e) {
      if('Escape' === e.key) {
        e.preventDefault();
        close();
      }
    }

    return {

      init(handlers) {
        context.handlers = handlers;
        doms.btnClose.addEventListener('click', onCloseClick, false);
        document.addEventListener('keydown', onKeyAction);
        return this;
      },

      show : function() {
        show(doms.help);
      }

    };

  })();

  /*
   * MENU MANAGEMENT
   */

  class Menu {

    constructor(c) {
      this._btns = Object.assign({}, {
        newProject    : new bittls.TButton({ element : c.doms.newProjectBtn,    action : c.handlers.onNewProject }),
        preview       : new bittls.TButton({ element : c.doms.previewBtn,       action : (() => c.handlers.onPreview(this._btns.preview.element.classList.toggle('selected'))).bind(this) }),
        saveProject   : new bittls.TButton({ element : c.doms.saveProjectBtn,   action : c.handlers.onSaveProject }),
        loadProject   : new bittls.TButton({ element : c.doms.loadProjectBtn,   action : c.handlers.onLoadProject }),
        cleanProjects : new bittls.TButton({ element : c.doms.cleanProjectsBtn, action : c.handlers.onCleanProjects }),
        generate      : new bittls.TButton({ element : c.doms.generateBtn,      action : c.handlers.onGenerateCode }),
        loadHTML      : new bittls.TButton({ element : c.doms.loadHTMLBtn,      action : c.handlers.onLoadHTML }),
        help          : new bittls.TButton({ element : c.doms.helpBtn,          action : c.handlers.onHelp })
      })
      this._btns.saveProject.disable()
      this._btns.preview.disable()
      this._btns.generate.disable()
      this._btns.loadHTML.disable()
      this.onKeyAction = this._onKeyAction.bind(this)
      document.addEventListener('keydown', this.onKeyAction);
      document.addEventListener('keydown', this.onCheckHelp.bind(this));
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
      document.addEventListener('keydown', this.onKeyAction);
    }

    freeze() {
      Object.values(this._btns).forEach(e => e.freeze())
      document.removeEventListener('keydown', this.onKeyAction);
    }

    _onKeyAction(e) {
      switch(e.key) {
      case 'm':
        if (utils.ctrlMetaKey(e)) {
          e.preventDefault()
          this._btns.newProject.tryAction()
        }
        break;
      case 'l':
        if (utils.ctrlMetaKey(e)) {
          e.preventDefault()
          this._btns.loadProject.tryAction()
        }
        break;
      case 's':
        if (utils.ctrlMetaKey(e)) {
          e.preventDefault()
          this._btns.saveProject.tryAction()
        }
        break;
      case 'p':
        if (utils.ctrlMetaKey(e)) {
          e.preventDefault()
          this._btns.preview.tryAction()
        }
        break;
      case 'g':
        if (utils.ctrlMetaKey(e)) {
          e.preventDefault()
          this._btns.generate.tryAction()
        }
        break;
      case 'Escape':
        if(this._btns.preview.element.classList.contains('selected')) {
          e.preventDefault()
          this._btns.preview.tryAction()
        }
        break;
      default:
      }
    }

    onCheckHelp(e) {
      e.preventDefault()
      if ('F1' === e.key)
        this._btns.help.tryAction()
    }

    reset() {
      this._btns.saveProject.disable()
      this._btns.preview.element.classList.remove('selected')
      this._btns.preview.disable()
      this._btns.generate.disable()
      this._btns.loadHTML.disable()
      document.addEventListener('keydown', this.onKeyAction);
      return this;
    }

    switchToEditMode() {
      this._btns.preview.enable()
      this._btns.preview.element.classList.remove('selected')
      this._btns.generate.enable()
      this._btns.loadHTML.enable()
      return this;
    }

  }
  let mnu = null;

  /*
   * APPLICATION
   */

  var app = (function() {

    var doms = {
      fileDropZone : $('file-drop-zone')
    };

    var setModified = unsafe => {
      mdl.setModified();
      mnu.canSave();
      if (unsafe) clipboard.setCopyUnsafe();
    };

    var setUnmodified = unsafe => {
      mdl.setUnmodified();
      mnu.preventSave();
      if (unsafe) clipboard.setCopyUnsafe();
    };

    function freeze() {
      wks.freeze();
      tls.freeze();
      mnu.freeze();
    }

    function release() {
      wks.release();
      tls.release();
      mnu.release();
    }

    function onAreaEnter(e) {
      if (selector.getCount() === 0) {
        tls.displayAreaProps(this);
      }
    }

    function onAreaLeave(e) {
      if (selector.getCount() === 0) {
        tls.resetAreaProps();
      }
    }

    var projects = (function() {

      var onClose = () => release();

      function onNewMap(data) {
        let rtn = false;
        if (mdl.setFile(data.file)) {
          mdl.setInfo(data);
          mnu.switchToEditMode();
          footer.info(data.file);
          wks.load(data.file);
          setModified(true);
          rtn = true;
        } else {
          footer.error(data.file);
        }
        release();
        return rtn;
      }

      function onLoadMap(name) {
        let rtn, project;
        rtn = false;
        project = store.read(name);
        footer.infoEx(project);
        wks.loadEx(project);
        if(mdl.fromStore(project, store.s2a)) {
          mdl.forEachArea(e => {
            e.dom.addEventListener('mouseover', onAreaEnter.bind(e), false);
            e.dom.addEventListener('mouseleave', onAreaLeave.bind(e), false);
          });
          mnu.switchToEditMode();
          setUnmodified(true);
          rtn = true;
        } else {
          footer.errorEx(project);
        }
        release();
        return rtn;
      }

      function onLoadCode(code) {
        let areas, rtn;
        areas = [];
        rtn = false;
        if (code) {
          bitmap.Mapper.loadHtmlString(code).forEach(r => areas.push(bitarea.createFromRecord(r, wks.getParent())));
          if (areas.length > 0) {
            mdl.addAreas(areas);
            areas.forEach(e => {
              e.dom.addEventListener('mouseover', onAreaEnter.bind(e), false);
              e.dom.addEventListener('mouseleave', onAreaLeave.bind(e), false);
            });
            setModified(true);
            selector.unselectAll();
            selector.selectSubset(areas);
            rtn = true;
          }
        }
        release();
        return rtn;
      }

      return {
        handlers : { onClose, onNewMap, onLoadMap, onLoadCode }
      };

    })();

    var menu = (function() {

      var _mapper = new bitmap.Mapper();
 
      function onNewProject() {
        if (!mdl.isModified() || confirm('Discard all changes?')) {
          footer.reset();
          wks.reset();
          tls.reset();
          mnu.reset();
          mdl.reset();
          ctr.reset();
          ctr.show();
          freeze();
        }
      }

      function onPreview(activated) {
        if (activated) {
          let c, i;
					tls.freeze();
          [c, i] = wks.switchToPreview();
          _mapper.displayPreview(c, i, mdl.getAreas(), mdl.getInfo());
        } else {
          wks.switchToEdit();
          _mapper.cancelPreview();
					tls.release();
        }
      }

      function onLoadProject() {
        if (!mdl.isModified() || confirm('Discard all changes?')) {
          footer.reset();
          wks.reset();
          tls.reset();
          mnu.reset();
          mdl.reset();
          ctr.reset();
          ldr.show();
          freeze();
        }
      }

      function onSaveProject() {
        store.write(mdl.getInfo().name, mdl.toStore(store.a2s));
        setUnmodified();
      }

      function onCleanProjects() {
        prj.show();
        freeze();
      }

      function onGenerateCode() {
        code.show(bitmap.Mapper.getHtmlString(mdl.getFile(), mdl.getInfo(), mdl.getAreas()));
        freeze();
      }

      function onLoadHTML() {
        htm.show();
        freeze();
      }

      function onHelp() {
        help.show();
        freeze();
      }

      return {
        handlers : {
          onNewProject, onPreview, onLoadProject, onSaveProject, onCleanProjects,
          onGenerateCode, onLoadHTML, onHelp
        }
      };

    })();

    var dragger = (function() {

      function prevent(e) {
        if (!tls.none()) return true;
        if (mdl.findArea(e.target)) return true;
        return false;
      }

      return {
        handlers : { prevent }
      };

    })();

    var tooler = (function() {

      var _order = new bitedit.Order(),
          _sizer = new bitedit.Sizer(),
          _aligner = new bitedit.Aligner();

      function onGridScopeChange(v) {
        if (selector.getCount() === 1) {
          let area = selector.first().figure;
          if (area.isGrid) {
            area.gridScope = v;
            setModified();
          }
        }
      }

      function onGridAlignChange(v) {
        if (selector.getCount() === 1) {
          let area = selector.first().figure;
          if (area.isGrid) {
            area.gridAlign = v;
            setModified();
          }
        }
      }

      function onGridSpaceChange(v) {
        if (selector.getCount() === 1) {
          let area = selector.first().figure;
          if (area.isGrid) {
            area.gridSpace = v;
            setModified();
          }
        }
      }

      function onShowOrder(bShow) {
        if (bShow) {
          let list, fig;
          if (selector.getCount() === 1) {
            fig = selector.first().figure;
            list = (fig.isGrid) ? [fig] : fig.copyBonds();
            list.forEach(g => _order.display(g.areas));
          }
        } else {
          _order.hide();
        }
      }

      function onGridOrderChange(v) {
        if (selector.getCount() === 1) {
          let area = selector.first().figure;
          if (area.isGrid) {
            area.gridOrder = v;
            setModified();
          }
        }
      }

      function onPropsSave(p) {
        tls.saveAreaProps(selector.first().figure, p);
        setModified();
      }

      var onPropsRestore = () => tls.restoreAreaProps(selector.first().figure);

      function onResize() {
        if (1 < selector.getCount()) {
          let d = wks.getDims();
          let r = selector.first().figure.rect;
          if (!_sizer.checkBoundaries(selector.list(), r.width, r.height, d.width, d.height))
            alert('Resizing selected elements makes at least one of them outside of image boudaries!');
          else
            _sizer.resize(selector.list(), r.width, r.height);
        }
      }

      function onAlignCenterHorizontally() {
        if (1 < selector.getCount()) {
          let d = wks.getDims();
          let r = selector.first().figure.rect;
          let cy = Math.round(r.y + r.height/2);
          if (!_aligner.checkVerticalBoundaries(selector.list(), cy, d.height))
            alert('Aligning horizontally selected elements makes at least one of them outside of image boudaries!');
          else
            _aligner.alignHorizontally(selector.list(), cy);
        }
      }

      function onAlignCenterVertically() {
        if (1 < selector.getCount()) {
          let d = wks.getDims();
          let r = selector.first().figure.rect;
          let cx = Math.round(r.x + r.width/2);
          if (!_aligner.checkHorizontalBoundaries(selector.list(), cx, d.width))
            alert('Aligning vertically selected elements makes at least one of them outside of image boudaries!');
          else
            _aligner.alignVertically(selector.list(), cx);
        }
      }

      function onAlignLeft() {
        if (1 < selector.getCount()) {
          let d = wks.getDims();
          let r = selector.first().figure.rect;
          if (!_aligner.checkRightBoundaries(selector.list(), r.x, d.width))
            alert('Aligning on left side selected elements makes at least one of them outside of image boudaries!');
          else
            _aligner.alignLeft(selector.list(), r.x);
        }
      }

      function onAlignTop() {
        if (1 < selector.getCount()) {
          let d = wks.getDims();
          let r = selector.first().figure.rect;
          if (!_aligner.checkBottomBoundaries(selector.list(), r.y, d.height))
            alert('Aligning on top side selected elements makes at least one of them outside of image boudaries!');
          else
            _aligner.alignTop(selector.list(), r.y);
        }
      }

      function onAlignRight() {
        if (1 < selector.getCount()) {
          let d = wks.getDims();
          let r = selector.first().figure.rect;
          if (!_aligner.checkLeftBoundaries(selector.list(), r.x + r.width))
            alert('Aligning on right side selected elements makes at least one of them outside of image boudaries!');
          else
            _aligner.alignRight(selector.list(), r.x + r.width);
        }
      }

      function onAlignBottom() {
        if (1 < selector.getCount()) {
          let d = wks.getDims();
          let r = selector.first().figure.rect;
          if (!_aligner.checkTopBoundaries(selector.list(), r.y + r.height))
            alert('Aligning on bottom side selected elements makes at least one of them outside of image boudaries!');
          else
            _aligner.alignBottom(selector.list(), r.y + r.height);
        }
      }

      return {
        handlers : {
          onGridScopeChange, onGridAlignChange, onGridSpaceChange,
          onShowOrder, onGridOrderChange,
          onPropsSave, onPropsRestore,
          onResize, onAlignCenterHorizontally, onAlignCenterVertically,
          onAlignLeft, onAlignTop, onAlignRight, onAlignBottom
        }
      };

    })();

    var drawer = (function() {

      const _factory = {
        'rectangle'   : bitgen.Rectangle,
        'square'      : bitgen.Square,
        'rhombus'     : bitgen.Rhombus,
        'circleCtr'   : bitgen.Circle,
        'circleDtr'   : bitgen.CircleEx,
        'ellipse'     : bitgen.Ellipse,
        'triangleIsc' : bitgen.IsoscelesTriangle,
        'triangleEql' : bitgen.EquilateralTriangle,
        'triangleRct' : bitgen.RectangleTriangle,
        'hexRct'      : bitgen.Hex,
        'hexDtr'      : bitgen.HexEx,
        'polygon'     : bitgen.Polygon
      };

      const _gridFactory = {
        'gridRectangle' : bitgen.GridRectangle,
        'gridCircle'    : bitgen.GridCircle,
        'gridHex'       : bitgen.GridHex
      };

      var _generator = null;

      function _create(parent, alt) {
        let figGen = _factory[tls.getDrawMode()];
        if (!figGen) {
          console.log('ERROR - Drawing mode not handled');
          return null;
         }
        return new figGen(parent, false, alt);
      }

      function _createGrid(parent, bond, gridParent) {
        let figGen = _gridFactory[tls.getDrawMode()];
        if (!figGen) {
          console.log('ERROR - Grid drawing mode not handled');
          return null;
        }
        return new figGen(parent, bond, gridParent, tls.getGridScope(), tls.getGridAlign(), tls.getGridSpace(), tls.getGridOrder());
      }

      function prevent(e) {
        if (e.ctrlKey || e.shiftKey) return true;
        if (tls.none()) return true;
        if (mdl.findArea(e.target)) return true;
        return false;
      }

      function onStart(parent, pt, alt, gridParent) {
        let bondElt = (tls.isGridDrawModeSelected()) ? selector.first().figure : null;
        selector.empty();
        _generator = (null === bondElt)
                    ? _create(parent, alt)
                    : _createGrid(parent, bondElt, gridParent);
        if (null == _generator) {
          alert('Unable to draw selected area!');
          tls.disableGridTools();
          return false;
        }
        tls.freeze();
        tls.disableAreaProps();
        _generator.start(pt);
        return true;
      }

      function onProgress(parent, pt) {
        let width = parent.getAttribute('width');
        let height = parent.getAttribute('height');
        _generator.progress(pt, width, height);
      }

      function onEnd(parent, pt) {
        let complete = true;
        let width = parent.getAttribute('width');
        let height = parent.getAttribute('height');
        switch(_generator.end(pt, width, height)) {
        case 'done':
          let fig = _generator.figure;
          mdl.addArea(fig);
          setModified(true);
          selector.select(fig);
          tls.release();
          fig.dom.addEventListener('mouseover', onAreaEnter.bind(fig), false);
          fig.dom.addEventListener('mouseleave', onAreaLeave.bind(fig), false);
          _generator = null;
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
      }

      function onCancel() {
        _generator.cancel();
        _generator = null;
        tls.release();
        tls.disableGridTools();
      }

      return {
        handlers : { prevent, onStart, onProgress, onEnd, onCancel }
      };

    })();

    var selector = (function() {

      var _tracker = null,
          _selected = new bitedit.MultiSelector();

      function _updateGridTools() {
        tls.blurAreaProps();
        if (_selected.length === 1) {
          tls.enableGridTools(_selected.get(0).figure);
        } else {
          tls.disableGridTools();
        }
      }

      function isAreaSelected(area) {
        return _selected.has(mdl.findArea(area));
      }

      function _areaSelect(area) {
        tls.blurAreaProps();
        _selected.set(mdl.findArea(area));
        _selected.get(0).highlight();
        tls.enableGridTools(_selected.get(0).figure);
      }

      function _areaMultiSelect(area) {
        if (_selected.length > 0)
          _selected.get(0).trivialize();
        _selected.toggle(mdl.findArea(area));
        if (_selected.length > 0)
          _selected.get(0).highlight();
        _updateGridTools();
      }

      function _computeSelection(coords) {
        mdl.forEachArea(function(e) {
          if (e.within(coords)) {
            if (!_selected.has(e)) {
              _selected.toggle(e);
            }
          } else if (_selected.has(e)) {
            _selected.toggle(e);
          }
        });
        _updateGridTools();
      }

      function _areaSelectAll() {
        if (_selected.length > 0)
          _selected.get(0).trivialize();
        _selected.empty();
        mdl.forEachArea(e => _selected.add(e));
        if (_selected.length > 0)
          _selected.get(0).highlight();
        _updateGridTools();
      }

      function _areaUnselectAll() {
        let rtn = _selected.length;
        if (_selected.length > 0)
          _selected.get(0).trivialize();
        _selected.empty();
        tls.disableGridTools();
        return rtn;
      }

      var getSelectedCount  = () => _selected.length,
          getSelected       = () => _selected.get(0),
          getSelectedList   = () => _selected.slice(),
          empty             = () => _selected.empty(),
          unselectAll       = _areaUnselectAll;

      function select(figure) {
        _selected.set(figure);
        _selected.get(0).highlight();
        tls.enableGridTools(figure);
      }

      function selectSubset(figures) {
        figures.forEach(e => _selected.add(e));
        if (_selected.length > 0)
          _selected.get(0).highlight();
        _updateGridTools();
      }

      function preventSelect(e) {
        if (e.ctrlKey || e.metaKey || e.altKey) return true;
        if (!mdl.findArea(e.target)) return true;
        if (isAreaSelected(e.target) && !e.shiftKey) return true; // is a move
        return false;
      }

      function onSelect(target, shiftKey) {
        if (!shiftKey) {
          _areaSelect(target);
        } else {
          _areaMultiSelect(target);
        }
      }

      function onSelectAll() {
        _areaSelectAll();
      }

      function onUnselectAll() {
        if (!_areaUnselectAll())
          tls.clearDrawMode();
      }

      function preventTracking(e) {
        if (!tls.none()) return true;
        if (!utils.noMetaKey(e)) return true;
        if (mdl.findArea(e.target)) return true;
        if (bitedit.isGrip(e.target)) return true;
        return false;
      }

      function onTrackStart(parent, pt, unselect) {
        _areaUnselectAll();
        _tracker = new bitgen.Tracker(parent);
        _tracker.start(pt);
        tls.freeze();
      }

      function onTrackProgress(pt) {
        _tracker.progress(pt);
        _computeSelection(_tracker.coords);
      }

      function onTrackEnd() {
        if (null != _tracker) {
          _tracker.cancel();
          _tracker = null;
        }
        if (_selected.length > 0)
          _selected.get(0).highlight();
      }
      
      function onTrackExit() {
        if (_selected.length > 0)
          _selected.get(0).highlight();
        tls.release();
      }

      function onTrackCancel() {
        if (null != _tracker) {
          _tracker.cancel();
          _tracker = null;
        }
        _areaUnselectAll();
        tls.release();
      }

      function onDeleteAll() {
        _selected.sort((a,b) => a.figure.isGrid ? -1 : 1);
        _selected.forEach(e => mdl.removeArea(e.figure));
        _selected.empty();
        tls.disableGridTools();
        setModified(true);
      }

      function onFreeze() {
        if (_selected.length === 1) {
          let newSel = [];
          if (mdl.freezeGridArea(_selected.get(0).figure, newSel, bitmap.Mapper.specializeProperties)) {
            _selected.get(0).trivialize();
            _selected.empty();
            newSel.forEach(e => _selected.add(e));
            if (_selected.length > 0)
              _selected.get(0).highlight();
            _updateGridTools();
            newSel = null;
            setModified(true);
          }
        }
      }

      function onCopy() {
        if (_selected.length < 1) return;
        clipboard.data = mdl.toClipboard(_selected.reduce((a,e) => { a.push(e.figure); return a; }, []), clipboard.a2c);
      }

      function onPaste(forceDeepCopy) {
        let areas;
        if (clipboard.isCopyUnsafe() && !confirm('Areas have been added or deleted and grid references may have been altered. Only a deep copy including grid references can be done.\nPerform a deep copy?'))
          return;
        areas = mdl.fromClipboard(clipboard.data, clipboard.c2a, forceDeepCopy);
        if (areas.length > 0) {
          mdl.addAreas(areas);
          areas.forEach(e => {
            e.dom.addEventListener('mouseover', onAreaEnter.bind(e), false);
            e.dom.addEventListener('mouseleave', onAreaLeave.bind(e), false);
          });
          setModified();
          selector.unselectAll();
          selector.selectSubset(areas);
          mover.handlers.onStep(wks.getParent(), clipboard.offset, clipboard.offset);
        }
        setModified();
      }

      return {
        isAreaSelected,
        getCount : getSelectedCount, first : getSelected, list : getSelectedList,
        select, selectSubset, empty, unselectAll,
        handlers : {
          preventSelect, onSelect, onSelectAll, onUnselectAll,
          preventTracking, onTrackStart, onTrackProgress, onTrackEnd, onTrackExit, onTrackCancel,
          onDeleteAll, onFreeze, onCopySelection : onCopy, onPasteSelection : onPaste
        }
      };

    })();

    var mover = (function() {

      var _mover = new bitedit.Mover();

      function prevent(e) {
        if (!mdl.findArea(e.target)) return true;
        if (!selector.isAreaSelected(e.target)) return true;
        return false;
      }

      function onStart(parent, pt) {
        let width = parent.getAttribute('width');
        let height = parent.getAttribute('height');
        let selected = selector.list();
        selected.sort((a,b) => a.figure.isGrid ? -1 : 1);
        _mover.start(selected, pt, width, height);
        tls.freeze();
      }

      function onProgress(pt) {
        _mover.progress(pt)
      }

      function onEnd(pt) {
        _mover.end(pt);
        setModified();
      }

      function onExit(e) {
        tls.release()
      }

      function onCancel() {
        _mover.cancel();
        tls.release();
      }

      function onStep(parent, dx, dy) {
        let width = parent.getAttribute('width');
        let height = parent.getAttribute('height');
        _mover.step(selector.list(), dx, dy, width, height);
        setModified();
      }

      function onRotate(parent, direction) {
        if (1 < selector.getCount()) {
          alert('Rotation is supported for a single selected area!');
          return;
        }
        let width = parent.getAttribute('width');
        let height = parent.getAttribute('height');
        if (!selector.first().rotate(direction, width, height)) {
          alert('ERROR - Rotation possibly makes area go beyond limits!');
        } else {
          setModified();
        }
      }

      return {
        handlers : {
          prevent, onStart, onProgress, onEnd, onExit, onCancel,
          onStep, onRotate
        }
      };

    })();

    var editor = (function() {

      var _editor = new bitedit.Editor();

      function prevent(e) {
        if (0 === selector.getCount()) return true;
        if (!selector.first().isEditable(e.target)) return true;
        return false;
      }

      function onStart(parent, target, pt) {
        let width = parent.getAttribute('width');
        let height = parent.getAttribute('height');
        _editor.start(selector.first(), target, pt, width, height);
        tls.freeze();
      }

      function onProgress(pt) {
        _editor.progress(pt)
      }

      function onEnd(pt) {
        _editor.end(pt);
        setModified();
      }

      function onExit(e) {
        tls.release()
      }

      function onCancel() {
        _editor.cancel();
        tls.release();
      }

      return {
        handlers : { prevent, onStart, onProgress, onEnd, onExit, onCancel }
      };

    })();

    function preventWindowDrop(e) {
      if (e.target.id != doms.fileDropZone) {
        e.preventDefault();
        e.dataTransfer.effectAllowed = "none";
        e.dataTransfer.dropEffect = "none";
      }
    }

    window.addEventListener("dragenter", preventWindowDrop);
    window.addEventListener("dragover", preventWindowDrop);
    window.addEventListener("drop", preventWindowDrop);

    const COPY_OFFSET = 10;

    prj.init(projects.handlers);
    ctr.init(projects.handlers);
    ldr.init(projects.handlers);
    code.init(projects.handlers);
    htm.init(projects.handlers);
    help.init(projects.handlers);
//    mnu.init(menu.handlers);
    mnu = new Menu({
      doms : {
        newProjectBtn     : $('new-project'),
        previewBtn        : $('preview'),
        saveProjectBtn    : $('save-project'),
        loadProjectBtn    : $('load-project'),
        cleanProjectsBtn  : $('clean-projects'),
        generateBtn       : $('generate'),
        loadHTMLBtn       : $('load-html'),
        helpBtn           : $('help')
      },
      handlers : menu.handlers
    })
    footer = new Footer({
      doms : {
        info : $('selected-file'),
        load : $('load-indicator')
      }
    })
    wks = new Workspace({
      doms : {
        wks       : $('wks-wrap'),
        aside     : $('tools'),
        footer    : $('footer'),
        workarea  : $('workarea'),
        container : $('container'),
        image     : $('img-display'),
        drawarea  : $('draw-area'),
        gridarea  : $('grid-area'),
        coords    : $('coordinates')
      },
      handlers : {
        dragger : dragger.handlers,
        drawer : drawer.handlers,
        selector : selector.handlers,
        mover : mover.handlers,
        editor : editor.handlers
      },
      ftr : footer
    })
    store = new Store({ workspace : wks })
    clipboard = new Clipboard({ workspace : wks, copyOffset : COPY_OFFSET })
    tls.init(tooler.handlers);

  })(); /* APPLICATION MANAGEMENT */

})(); /* BIT */
