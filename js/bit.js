/**
 * Boardgame image tool (BIT)
 * Copyright 2017 Herve Retaureau
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

  var store = (function() {

    const storageKey = 'BiT';

    function getStore() {
      return JSON.parse(window.localStorage.getItem(storageKey) || '{}');
    }

    function setStore(s) {
      window.localStorage.setItem(storageKey, JSON.stringify(s));      
    }

    function write(name, value) {
      let s = getStore();
      s[name] = value;
      setStore(s);
    }

    function read(name) {
      return getStore()[name];
    }

    function remove(name) {
      let s = getStore();
      delete s[name];
      setStore(s);
    }

    function list() {
      return Object.keys(getStore());
    }

    function reset() {
      window.localStorage.removeItem(storageKey);
    }

    function a2s(area, index, areas) {
      return area.toRecord(index, areas);
    }

    function s2a(stored, index, areas) {
      let area;
      if (index !== stored.index || index != areas.length) {
        console.log('ERROR - Corrupted stored record with bad index');
        return null;
      }
      area = (!stored.isGrid)
          ? bitarea.createFromRecord(stored, wks.getParent())
          : bitgrid.createFromRecord(stored, wks.getParent(), wks.getGridParent(), areas);
      return area;
    }

    return {
      list,
      read,
      write,
      remove,
      reset,
      a2s, s2a
    }

  })();

  /*
   * PSEUDO-CLIPBOARD MANAGEMENT 
   */

  var clp = (function() {

    var context = {
        data  : null,
        basic : true,
        risky : false,
        offset : 0
    };

    const COPY_OFFSET = 10;

    function setClipboard(c) {
      context.data = JSON.stringify(c);
      context.basic = c.basic;
      context.unsafe = false;
      context.offset = 0;
      c = null;
    }

    function getClipboard() {
      let c = JSON.parse(context.data || '{}');
      c.unsafe = context.unsafe;
      context.offset += COPY_OFFSET;
      return c;
    }

    function a2c(area, index, areas) {
      return area.toRecord(index, areas);
    }

    function c2a(record, index, areas) {
      let area;
      if (index !== record.index || index > areas.length) {
        console.log('ERROR - Corrupted clipboard record with bad index');
        return null;
      }
      area = (!record.isGrid)
          ? bitarea.createFromRecord(record, wks.getParent())
          : bitgrid.createFromRecord(record, wks.getParent(), wks.getGridParent(), areas);
      return area;
    }

    return {
      setClipboard, getClipboard,
      setCopyUnsafe : () => { if (!context.basic) context.unsafe = true; }, isCopyUnsafe : () => context.unsafe,
      a2c, c2a, offset : () => context.offset
    }

  })();
  
  /*
   * WORKAREA MANAGEMENT
   */

  var wks = (function() {

    var doms = {
      wks       : $('wks-wrap'),
      aside     : $('tools'),
      footer    : $('footer'),
      workarea  : $('workarea'),
      container : $('container'),
      image     : $('img-display'),
      drawarea  : $('draw-area'),
      gridarea  : $('grid-area')
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
        EDITED    : 'edited',
        PREVIEW   : 'preview'
      };

    var context = {
      state : states.OPEN,
      offset : { x : 0, y : 0 },
      iDrg : null, aDrw : null, aSel : null, aMov : null, aEdt : null
    };

    var addWel = (t, f) => doms.workarea.addEventListener(t, f, false);
    var rmWel = (t, f) => doms.workarea.removeEventListener(t, f, false);
    var ready = () => states.READY === context.state ? true : false;

    // VIEWPORT COMPUTATION 
    // Workarea elements size and coordinate offsets.

    var viewport = (function() {

      return {

        setWorkingDims : function(w,h) {
          doms.drawarea.setAttribute('width', w);
          doms.drawarea.setAttribute('height', h);
          doms.gridarea.setAttribute('width', w);
          doms.gridarea.setAttribute('height', h);
          doms.container.style.width = w + 'px';
          doms.container.style.height = h + 'px';
          return this;
        },

        setViewDims : function() {
          let fc, ac, wc, width, height;
          fc = doms.footer.getBoundingClientRect();
          wc = doms.wks.getBoundingClientRect();
          ac = doms.aside.getBoundingClientRect();
          width = Math.floor(fc.right - (ac.right - ac.left) - wc.left - 5);
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
          return (0 > coords.x || 0 > coords.y || doms.image.width < coords.x || doms.image.height < coords.y) ? false : true;
        }

      };

    })(); // viewport

    // COORDINATE TRACKER
    // Images coordinates are set when moving within workarea.

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

    // BACKGROUND IMAGE DRAGGER
    // Dragging start with a mouse down on image and CTRL key
    // Dragging is active as long as the pointer is in the workarea and button is down
    // Dragging stop on mouse up or if a move w/o buttons down is caught
    // Dragging move and top listeners are installed only if an image drag is started.

    var imageDragger = (function() {

      var enabled = false;

      function enter() {
        doms.workarea.classList.add(utils.clsActions.DRAGGING);
        addWel('mouseup', onImageDragStop);
        addWel('mousemove', onImageDragMove);
        tls.freeze();
        areaDrawer.disable();
        areaMover.disable();
        areaEditor.disable();
        areaSelector.disable();
        context.state = states.DRAGGING;
      } 

      function exit() {
        doms.workarea.classList.remove(utils.clsActions.DRAGGING);
        rmWel('mouseup', onImageDragStop);
        rmWel('mousemove', onImageDragMove);
        areaDrawer.enable();
        areaMover.enable();
        areaEditor.enable();
        areaSelector.enable();
        tls.release();
        context.state = states.READY;
      }

      function move(dx, dy) {
        doms.workarea.scrollLeft -= dx;
        doms.workarea.scrollTop  -= dy;
      }

      function onImageDragStart(e) {
        e.preventDefault();
        if (!ready() || context.iDrg.prevent(e)) return;
        if (utils.leftButton(e) && utils.ctrlKey(e) && viewport.isPointerInImage(e.pageX, e.pageY)) {
          enter();
        }
      }

      function onImageDragStop(e) {
        e.preventDefault();
        exit();
      }

      function onImageDragMove(e) {
        e.preventDefault();
        if (!utils.leftButtonHeld(e) || !utils.ctrlKey(e)) {
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

    // AREA DRAWER MANAGEMENT
    // Drawing start with a click on image
    // Additional click add points to some drawing e.g. polygon
    // Drawing stop on further click if drawer asserts it
    // Drawing is canceled on ESC key pressed

    var areaDrawer = (function () {

      var enabled = false;

      function enter() {
        doms.drawarea.classList.add(utils.clsActions.DRAWING);
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
        doms.drawarea.classList.remove(utils.clsActions.DRAWING);
        imageDragger.enable();
        areaMover.enable();
        areaEditor.enable();
        areaSelector.enable();
        rmWel('click', onDrawEnd);
        rmWel('mousemove', onDrawProgress);
        addWel('click', onDrawStart);
        document.removeEventListener('keydown', onDrawCancel);
        context.state = states.READY;
      }

      function onDrawStart(e) {
        e.preventDefault();
        if (!ready() || context.aDrw.prevent(e)) return;
        if (utils.leftButton(e) && viewport.isPointerInImage(e.pageX, e.pageY)) {
          if (context.aDrw.onStart(doms.drawarea, viewport.computeCoords(e.pageX, e.pageY), e.altKey, doms.gridarea)) {
            enter();
          }
        }
      }

      function onDrawProgress(e) {
        e.preventDefault();
        context.aDrw.onProgress(doms.drawarea, viewport.computeCoords(e.pageX, e.pageY));
      }

      function onDrawEnd(e) {
        e.preventDefault();
        if (!utils.leftButton(e)) return;
        if (context.aDrw.onEnd(doms.drawarea, viewport.computeCoords(e.pageX, e.pageY))) {
          exit();
        }
      }

      function onDrawCancel(e) {
        e.preventDefault();
        if ('Escape' === e.key) {
          context.aDrw.onCancel();
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
            context.aDrw.onCancel();
            exit();
          }
          rmWel('click', onDrawStart);
          enabled = false;
        }
      };

    })(); // AREA DRAWER

    // AREA SELECTOR
    // Area selection is achieved by clicking on existing area.
    // Simple click select the desired area unselecting others.
    // Holding shift key while clicking on existing areas achieves multiple selection (toggle effect).
    // ESC key unselect all selected areas.
    // DELETE key suppress all selected areas.

    var areaSelector = (function() {

      var enabled = false;

      function enter() {
        doms.drawarea.classList.add(utils.clsActions.TRACKING);
        imageDragger.disable();
        areaDrawer.disable();
        areaMover.disable();
        areaEditor.disable();
        rmWel('click', onSelect);
        rmWel('mousedown', onTrackStart);
        addWel('click', onTrackExit);
        addWel('mouseup', onTrackEnd);
        addWel('mousemove', onTrackProgress);
        document.removeEventListener('keydown', onKeyAction);
        context.state = states.SELECTING;
      }

      function exit() {
        doms.drawarea.classList.remove(utils.clsActions.TRACKING);
        rmWel('click', onTrackExit);
        rmWel('mouseup', onTrackEnd);
        rmWel('mousemove', onTrackProgress);
        addWel('mousedown', onTrackStart);
        addWel('click', onSelect);
        document.addEventListener('keydown', onKeyAction);
        imageDragger.enable();
        areaDrawer.enable();
        areaMover.enable();
        areaEditor.enable();
        context.state = states.READY;
      }

      function onSelect(e) {
        e.preventDefault();
        if (!ready() || context.aSel.preventSelect(e)) return;
        context.aSel.onSelect(e.target, e.shiftKey);
      }

      function onTrackStart(e) {
        e.preventDefault();
        if (!ready() || context.aSel.preventTracking(e)) return;
        if (utils.leftButton(e)) {
          context.aSel.onTrackStart(doms.drawarea, viewport.computeCoords(e.pageX, e.pageY));
          enter();
        }
      }

      function onTrackProgress(e) {
        e.preventDefault();
        if (!utils.leftButtonHeld(e)) {
          if (states.SELECTED !== context.state) {
            context.aSel.onTrackCancel();
          }
          exit();
        } else if (states.SELECTING === context.state) {
          context.aSel.onTrackProgress(viewport.computeCoords(e.pageX, e.pageY));
        }
      }

      function onTrackEnd(e) {
        e.preventDefault();
        if (states.SELECTING === context.state) {
          context.aSel.onTrackEnd();
          context.state = states.SELECTED;
        }
      }

      function onTrackExit(e) {
        e.preventDefault();
        context.aSel.onTrackExit();
        exit();
      }

      function onKeyAction(e) {
        e.preventDefault();
        switch(e.key) {
        case 'Escape':
          if (ready() && utils.noMetaKey(e)) {
            context.aSel.onUnselectAll();
          }
          break;
        case 'Delete':
          if (ready() && utils.noMetaKey(e)) {
            context.aSel.onDeleteAll();
          }
          break;
        case 'a':
          if (ready() && utils.ctrlMetaKey(e)) {
            context.aSel.onSelectAll();
          }
          break;
        case 'F8':
          if (ready() && utils.ctrlMetaKey(e)) {
            context.aSel.onFreeze();
          }
          break;
        case 'c':
          if (ready() && utils.ctrlMetaKey(e)) {
            context.aSel.onCopySelection();
          }
          break;
        case 'v':
        case 'V':
          if (ready()) {
            let deepCopy = utils.ctrlMetaShiftKey(e);
            if (utils.ctrlMetaKey(e) || deepCopy)
              context.aSel.onPasteSelection(deepCopy);
          }
          break;
        default:
        }
      }

      return {

        enable : function() {
          if (enabled) return;
          addWel('mousedown', onTrackStart);
          addWel('click', onSelect);
          document.addEventListener('keydown', onKeyAction);
          enabled = true;
        },

        disable : function() {
          if (!enabled) return;
          rmWel('mousedown', onTrackStart);
          rmWel('click', onSelect);
          document.removeEventListener('keydown', onKeyAction);
          enabled = false;
        }

      };

    })(); // AREA SELECTOR

    // AREA MOVER
    // Area moving starts by pressing mouse down on a selection of areas.
    // Moves are constrained so that moved figures remains in SVG container.
    // ESC key cancels selection move.

    var areaMover = (function() {

      var enabled = false;

      function enter() {
        doms.drawarea.classList.add(utils.clsActions.MOVING);
        imageDragger.disable();
        areaDrawer.disable();
        areaEditor.disable();
        areaSelector.disable();
        rmWel('mousedown', onMoveStart);
        addWel('click', onMoveExit);
        addWel('mouseup', onMoveEnd);
        addWel('mousemove', onMoveProgress);
        document.removeEventListener('keydown', onMoveStep);
        document.addEventListener('keydown', onMoveCancel);
        context.state = states.MOVING;
      }

      function exit() {
        doms.drawarea.classList.remove(utils.clsActions.MOVING);
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
        context.state = states.READY;
      }

      function onMoveStart(e) {
        e.preventDefault();
        if (!ready() || context.aMov.prevent(e)) return;
        if(utils.leftButton(e) && utils.noMetaKey(e)) {
          context.aMov.onStart(doms.drawarea, viewport.computeCoords(e.pageX, e.pageY))
          enter();
        }
      }
 
      function onMoveProgress(e) {
        e.preventDefault();
        if (!utils.leftButtonHeld(e)) {
          context.aMov.onCancel();
          exit();
        } else if (states.MOVING === context.state) {
          context.aMov.onProgress(viewport.computeCoords(e.pageX, e.pageY));
        }
      }

      function onMoveEnd(e) {
        e.preventDefault();
        if (states.MOVING === context.state) {
          context.aMov.onEnd(viewport.computeCoords(e.pageX, e.pageY));
          context.state = states.MOVED;
        }
      }

      function onMoveExit(e) {
        e.preventDefault();
        context.aMov.onExit();
        exit();
      }

      function onMoveCancel(e) {
        e.preventDefault();
        if ('Escape' === e.key) {
          context.aMov.onCancel();
          context.state = states.MOVED;
        }
      }

      function onMoveStep(e) {
        e.preventDefault();
        switch(e.key) {
        case 'ArrowLeft':
          if (ready()) {
            if (utils.noMetaKey(e)) {
              context.aMov.onStep(doms.drawarea, -1, 0);
            } else if (utils.ctrlKey(e)) {
              context.aMov.onRotate(doms.drawarea, bitedit.directions.RACLK);
            }
          }
          break;
        case 'ArrowRight':
          if (ready()) {
            if (utils.noMetaKey(e)) {
              context.aMov.onStep(doms.drawarea, 1, 0);
            } else if (utils.ctrlKey(e)) {
              context.aMov.onRotate(doms.drawarea, bitedit.directions.RCLK);
            }
          }
          break;
        case 'ArrowUp':
          if (ready() && utils.noMetaKey(e)) {
            context.aMov.onStep(doms.drawarea, 0, -1);
          }
          break;
        case 'ArrowDown':
          if (ready() && utils.noMetaKey(e)) {
            context.aMov.onStep(doms.drawarea, 0, 1);
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
            context.aMov.onCancel();
          }
          if (states.MOVING === context.state || states.MOVED === context.state) {
            exit();
          }
          rmWel('mousedown', onMoveStart);
          document.removeEventListener('keydown', onMoveStep);
          enabled = false;
        }
      };

    })(); // AREA MOVER
 
    // AREA EDITOR
    // Area editing starts by pressing mouse down on grabber of a selected area.
    // ESC key cancels selection editing.
    // Resizing cannot invert some figure dimension e.g. rectangle width becoming negative.

    var areaEditor = (function() {

      var enabled = false;

      function enter() {
        doms.drawarea.classList.add(utils.clsActions.EDITING);
        imageDragger.disable();
        areaDrawer.disable();
        areaMover.disable();
        areaSelector.disable();
        rmWel('mousedown', onEditStart);
        addWel('click', onEditExit);
        addWel('mouseup', onEditEnd);
        addWel('mousemove', onEditProgress);
        document.addEventListener('keydown', onEditCancel);
        context.state = states.EDITING;
      }

      function exit() {
        doms.drawarea.classList.remove(utils.clsActions.EDITING);
        rmWel('click', onEditExit);
        rmWel('mouseup', onEditEnd);
        rmWel('mousemove', onEditProgress);
        document.removeEventListener('keydown', onEditCancel);
        addWel('mousedown', onEditStart);
        imageDragger.enable();
        areaDrawer.enable();
        areaMover.enable();
        areaSelector.enable();
        context.state = states.READY;
      }

      function onEditStart(e) {
        e.preventDefault();
        if (!ready() || context.aEdt.prevent(e)) return;
        if(utils.leftButton(e) && utils.noMetaKey(e)) {
          context.aEdt.onStart(doms.drawarea, e.target, viewport.computeCoords(e.pageX, e.pageY));
          enter();
        }
      }
 
      function onEditProgress(e) {
        e.preventDefault();
        if (!utils.leftButtonHeld(e)) {
          context.aEdt.onCancel();
          exit();
        } else if (states.EDITING === context.state) {
          context.aEdt.onProgress(viewport.computeCoords(e.pageX, e.pageY));
        }
      }

      function onEditEnd(e) {
        e.preventDefault();
        if (states.EDITING === context.state) {
          context.aEdt.onEnd(viewport.computeCoords(e.pageX, e.pageY));
          context.state = states.EDITED;
        }
      }

      function onEditExit(e) {
        e.preventDefault();
        context.aEdt.onExit();
        exit();
      }

      function onEditCancel(e) {
        e.preventDefault();
        if ('Escape' === e.key) {
          context.aEdt.onCancel();
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
            context.aEdt.onCancel();
          }
          if (states.EDITING === context.state || states.EDITED === context.state) {
            exit();
          }
          rmWel('mousedown', onEditStart);
          enabled = false;
        }
      };

    })(); // AREA EDITOR
 
    var hide = (obj) => obj.style.display = 'none';
    var show = (obj) => obj.style.display = 'block';

    function onLoadImage() {
      ftr.loading.hide();
      ftr.infoUpdate(doms.image.naturalWidth, doms.image.naturalHeight);
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

      init : function(iDrgHandlers, aDrwHandlers, aSelHandlers, aMovHandlers, aEdtHandlers) {
        context.iDrg = iDrgHandlers;
        context.aDrw = aDrwHandlers;
        context.aSel = aSelHandlers;
        context.aMov = aMovHandlers;
        context.aEdt = aEdtHandlers;
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
        show(doms.drawarea);
        show(doms.gridarea);
        context.state = states.OPEN;
      },

      load : function(f) {
        ftr.loading.show();
        doms.image.onload = onLoadImage;
        doms.image.src = window.URL.createObjectURL(f);
        return this;
      },

      loadEx: function(p) {
        ftr.loading.show();
        doms.image.onload = onLoadImage;
        doms.image.src = p.dataURL;
        return this;
      },

      switchToPreview : function() {
        hide(doms.drawarea);
        hide(doms.gridarea);
        areaDrawer.disable();
        areaMover.disable();
        areaEditor.disable();
        areaSelector.disable();
        context.state = states.PREVIEW;
        viewport.setWorkingDims(doms.image.width, doms.image.height)
                .resize();
        return [doms.container, doms.image];
      },

      switchToEdit : function() {
        show(doms.drawarea);
        show(doms.gridarea);
        areaDrawer.enable();
        areaMover.enable();
        areaEditor.enable();
        areaSelector.enable();
        context.state = states.READY;
        viewport.setWorkingDims(doms.image.width, doms.image.height)
                .resize();
      },
      
      release : function() {
        coordTracker.enable();
        imageDragger.enable();
        areaDrawer.enable();
        areaMover.enable();
        areaEditor.enable();
        areaSelector.enable();
      },

      freeze : function() {
        coordTracker.disable();
        imageDragger.disable();
        areaDrawer.disable();
        areaMover.disable();
        areaEditor.disable();
        areaSelector.disable();
      },

      getParent : () => doms.drawarea,
      getGridParent : () => doms.gridarea,
      getDims : () => { return { width: doms.image.width, height: doms.image.height } }

    };

  })(); /* WORKSPACE MANAGEMENT */

  /*
   * TOOLS PALETTE MANAGEMENT 
   */

  var tls = (function() {

    const modes = utils.fgTypes;
    const scopes = bitgrid.scopes;
    const aligns = bitgrid.aligns;
    const orders = bitgrid.orders;
    const properties = bitmap.properties;

    const btnsMode = [
      { dom : $('hex-d'),             mode : modes.HEXDTR },
      { dom : $('hex-r'),             mode : modes.HEXRCT },
      { dom : $('rectangle'),         mode : modes.RECTANGLE },
      { dom : $('square'),            mode : modes.SQUARE },
      { dom : $('rhombus'),           mode : modes.RHOMBUS },
      { dom : $('triangle-e'),        mode : modes.TRIANGLEEQL },
      { dom : $('triangle-i'),        mode : modes.TRIANGLEISC },
      { dom : $('triangle-r'),        mode : modes.TRIANGLERCT },
      { dom : $('ellipse'),           mode : modes.ELLIPSE },
      { dom : $('circle-d'),          mode : modes.CIRCLEDTR },
      { dom : $('circle-c'),          mode : modes.CIRCLECTR },
      { dom : $('polygon'),           mode : modes.POLYGON }
    ];

    const btnsGridMode = [
      { dom : $('hex-grid'),          mode : modes.GRIDHEX },
      { dom : $('rectangle-grid'),    mode : modes.GRIDRECTANGLE },
      { dom : $('circle-grid'),       mode : modes.GRIDCIRCLE }
    ];

    const btnsGridScope = [
      { dom : $('grid-scope-inner'),  scope : scopes.INNER },
      { dom : $('grid-scope-outer'),  scope : scopes.OUTER }
    ];
    
    const btnsGridAlign = [
      { dom : $('grid-algn-std'),     align : aligns.STANDARD },
      { dom : $('grid-algn-alt'),     align : aligns.ALT_HORIZONTAL },
      { dom : $('grid-algn-alt2'),    align : aligns.ALT_VERTICAL }
    ];

    const btnsOrder = [
      { dom : $('grid-order-tl'),     order : orders.TOPLEFT },
      { dom : $('grid-order-lt'),     order : orders.LEFTTOP },
      { dom : $('grid-order-lb'),     order : orders.LEFTBOTTOM },
      { dom : $('grid-order-bl'),     order : orders.BOTTOMLEFT },
      { dom : $('grid-order-br'),     order : orders.BOTTOMRIGHT },
      { dom : $('grid-order-rb'),     order : orders.RIGHTBOTTOM },
      { dom : $('grid-order-rt'),     order : orders.RIGHTTOP },
      { dom : $('grid-order-tr'),     order : orders.TOPRIGHT }
    ];

    const inForm = [
      { dom : $('href-prop'),         prop  : properties.HREF },
      { dom : $('alt-prop'),          prop  : properties.ALT },
      { dom : $('title-prop'),        prop  : properties.TITLE },
      { dom : $('id-prop'),           prop  : properties.ID }
    ];

    const doms = {
      inGridSpace     : $('grid-space'),
      btnShowOrder    : $('show-order'),
      btnResize       : $('resize'),
      btnAlignCH      : $('align-center-h'),
      btnAlignCV      : $('align-center-v'),
      btnAlignL       : $('align-left'),
      btnAlignT       : $('align-top'),
      btnAlignR       : $('align-right'),
      btnAlignB       : $('align-bottom'),
      btnPropsSave    : $('area-props-save'),
      btnPropsRestore : $('area-props-restore'),
      tools           : $('tools'),
      mask            : document.querySelector('#tools .mask')
    };

    var context = {
        handlers    : null,
        selected    : null,
        mode        : modes.NONE,
        allowGrid   : false,
        freezed     : true,
        scope       : btnsGridScope[0].scope,
        align       : btnsGridAlign[0].align,
        order       : btnsOrder[0].order,
        gParam      : true,
        space       : 0,
        showOrder   : false
    };

    function setDrawingMode() {
      let m = btnsMode.find(e => (context.selected === e.dom)) ||
              btnsGridMode.find(e => (context.selected === e.dom)) ;
      context.mode = (m && m.mode) || modes.NONE;
    }

    function isGridDrawingModeSelected() {
      return (-1 !== btnsGridMode.findIndex(e => (context.selected === e.dom)));
    }

    function select(obj) {
      if (null != obj) {
        obj.classList.add(bitedit.clsStatus.SELECTED);
      }
      context.selected = obj;
    }

    function unselect(obj) {
      if (obj != null) {
        obj.classList.remove(bitedit.clsStatus.SELECTED);
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

    function toggleTableState(table, target, action) {
      let i, next;
      i = table.findIndex(e => (e.dom === target));
      if (i !== -1) {
        action = action || (() => {});
        next = table[(i+1) % table.length];
        toggleState(target, next.dom);
        action(next);
      }
    }

    function onDrawModeSelect(evt) {
      blurAreaProps();
      evt.preventDefault();
      toggleSelect(evt.target);
      setDrawingMode();
    }

    function onDrawGridModeSelect(evt) {
      blurAreaProps();
      evt.preventDefault();
      if(context.allowGrid) {
        toggleSelect(evt.target);
        setDrawingMode();
      }
    }

    function canGrid(obj) {
      let rtn = true;
      switch(obj.type) {
      case utils.fgTypes.NONE:
      case utils.fgTypes.GRIDRECTANGLE:
      case utils.fgTypes.GRIDHEX:
      case utils.fgTypes.GRIDCIRCLE:
      case utils.fgTypes.POLYGON:
        rtn = false;
        break;
      default:
      }
      return rtn;
    }

    function gridEnable() {
      btnsGridMode.forEach(e => e.dom.classList.remove(bitedit.clsStatus.DISABLED));
    }

    function gridDisable() {
      btnsGridMode.forEach(e => e.dom.classList.add(bitedit.clsStatus.DISABLED));
    }

    function enableGridMode(obj) {
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
    }

    function disableGridMode() {
      if (context.allowGrid) {
        if (isGridDrawingModeSelected()) {
          toggleSelect(null);
          context.mode = modes.NONE;
        }
        gridDisable();
        context.allowGrid = false;
      }
    }

    function onGridScopeChange(evt) {
      blurAreaProps();
      evt.preventDefault();
      toggleTableState(btnsGridScope, evt.target, e => {
        if (context.gParam)
          context.scope = e.scope;
        context.handlers.onGridScopeChange(e.scope);
      });
    }

    function setGridScope(value) {
      let v = value || context.scope;
      btnsGridScope.forEach(e => {
        if (e.dom.style.display !== 'none' && v !== e.scope)
          e.dom.style.display = 'none';
        if (v === e.scope)
          e.dom.style.display = 'inline';
      });
    }

    var getGridScope = () => context.scope;

    function onGridAlignChange(evt) {
      blurAreaProps();
      evt.preventDefault();
      toggleTableState(btnsGridAlign, evt.target, e => {
        if (context.gParam)
          context.align = e.align;
        context.handlers.onGridAlignChange(e.align);
      });
    }

    function setGridAlign(value) {
      let v = value || context.align;
      btnsGridAlign.forEach(e => {
        if (e.dom.style.display !== 'none' && v !== e.align)
          e.dom.style.display = 'none';
        if (v === e.align)
          e.dom.style.display = 'inline';
      });
    }

    var getGridAlign = () => context.align;

    function onGridSpaceChange(e) {
      blurAreaProps();
      let v, d;
      d = parseInt(doms.inGridSpace.defaultValue);
      v = getGridSpace();
      if (d !== v) {
        doms.inGridSpace.defaultValue = v.toString();
        if (context.gParam) {
          context.space = v;
        }
        context.handlers.onGridSpaceChange(v);
      }
    }

    var setGridSpace = (v) => { 
      doms.inGridSpace.value = doms.inGridSpace.defaultValue = (v === 0) ? "0" : (v || context.space).toString();
    }
    var getGridSpace = () => parseInt(doms.inGridSpace.value);

    function onGridOrderChange(evt) {
      blurAreaProps();
      evt.preventDefault();
      toggleTableState(btnsOrder, evt.target, e => {
        if (context.gParam)
          context.order = e.order;
        context.handlers.onGridOrderChange(e.order);
      });
    }

    function setGridOrder(value) {
      let v = value || context.order;
      btnsOrder.forEach(e => {
        if (e.dom.style.display !== 'none' && v !== e.order)
          e.dom.style.display = 'none';
        if (v === e.order)
          e.dom.style.display = 'inline';
      });
    }

    var getGridOrder = () => context.order;

    function gridParamsReset() {
      toggleState(btnsGridScope[1].dom, btnsGridScope[0].dom);
      toggleState((btnsGridAlign[2].align === context.align) ? btnsGridAlign[2].dom : btnsGridAlign[1].dom, btnsGridAlign[0].dom);
      doms.inGridSpace.defaultValue = "0";
      doms.inGridSpace.value = "0";
      context.showOrder = false;
      setGridOrder(btnsOrder[0].order);
    }

    function onShowOrder(e) {
      blurAreaProps();
      if(!context.showOrder) {
        doms.btnShowOrder.removeEventListener('mousedown', onShowOrder, false);
        doms.btnShowOrder.addEventListener('mouseup', onHideOrder, false);
        doms.btnShowOrder.addEventListener('mouseleave', onHideOrder, false);
        context.handlers.onShowOrder(true);
        context.showOrder = true;
      }
    }

    function onHideOrder(e) {
      blurAreaProps();
      if(context.showOrder) {
        doms.btnShowOrder.addEventListener('mousedown', onShowOrder, false);
        doms.btnShowOrder.removeEventListener('mouseup', onHideOrder, false);
        doms.btnShowOrder.removeEventListener('mouseleave', onHideOrder, false);
        context.handlers.onShowOrder(false);
        context.showOrder = false;
      }
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

    function onResize(e) {
      context.handlers.onResize();
      e.preventDefault();
    }

    function onAlignLeft(e) {
      context.handlers.onAlignLeft();
      e.preventDefault();
    }

    function onAlignTop(e) {
      context.handlers.onAlignTop();
      e.preventDefault();
    }

    function onAlignRight(e) {
      context.handlers.onAlignRight();
      e.preventDefault();
    }

    function onAlignBottom(e) {
      context.handlers.onAlignBottom();
      e.preventDefault();
    }

    function onAlignCenterHorizontally(e) {
      context.handlers.onAlignCenterHorizontally();
      e.preventDefault();
    }

    function onAlignCenterVertically(e) {
      context.handlers.onAlignCenterVertically();
      e.preventDefault();
    }

    function displayMask() {
      let r;
      doms.mask.style.display = 'block';
      r = doms.tools.getBoundingClientRect();
      doms.mask.style.width = r.width + 'px';
      doms.mask.style.height = r.height + 'px';
      doms.mask.style.left = r.left + 'px';
      doms.mask.style.top = r.top+1 + 'px';
    }

    function hideMask() {
      doms.mask.style.display = 'none';
    }

    return {

      init : function(handlers) {
        context.handlers = handlers;
        this.release();
      },

      reset : function() {
        toggleSelect(null);
        gridDisable();
        context.mode = modes.NONE;
        context.allowGrid = false;
        gridParamsReset();
        context.gParam = true;
        context.scope = btnsGridScope[0].scope;
        context.align = btnsGridAlign[0].align;
        context.space = 0;
        context.order = btnsOrder[0].order;
        disableAreaProps();
        this.release();
      },

      getDrawingMode : () => context.mode,
      getGridScope,
      getGridAlign,
      getGridOrder,
      getGridSpace,
      
      none : () => modes.NONE === context.mode ? true : false,

      freeze : function() {
        if (context.freezed) return;
        btnsMode.forEach(e => e.dom.removeEventListener('click', onDrawModeSelect, false));
        btnsGridMode.forEach(e => e.dom.removeEventListener('click', onDrawGridModeSelect, false));
        btnsGridScope.forEach(e => e.dom.removeEventListener('click', onGridScopeChange, false));
        btnsGridAlign.forEach(e => e.dom.removeEventListener('click', onGridAlignChange, false));
        doms.inGridSpace.removeEventListener('click', onGridSpaceChange, false);
        doms.btnShowOrder.removeEventListener('mousedown', onShowOrder, false);
        btnsOrder.forEach(e => e.dom.removeEventListener('click', onGridOrderChange, false));
        doms.btnPropsSave.removeEventListener('click', onPropsSave, false);
        doms.btnPropsRestore.removeEventListener('click', onPropsRestore, false);
        inForm.forEach(e => {
          e.dom.removeEventListener('keydown', onPropsKey, false);
          e.dom.removeEventListener('input', onPropsInput, false)
          e.dom.blur();
        });
        doms.btnResize.removeEventListener('click', onResize, false);
        doms.btnAlignL.removeEventListener('click', onAlignLeft, false);
        doms.btnAlignT.removeEventListener('click', onAlignTop, false);
        doms.btnAlignR.removeEventListener('click', onAlignRight, false);
        doms.btnAlignB.removeEventListener('click', onAlignBottom, false);
        doms.btnAlignCH.removeEventListener('click', onAlignCenterHorizontally, false);
        doms.btnAlignCV.removeEventListener('click', onAlignCenterVertically, false);
        displayMask();
        context.freezed = true;
      },

      release : function() {
        if (!context.freezed) return;
        btnsMode.forEach(e => e.dom.addEventListener('click', onDrawModeSelect, false));
        btnsGridMode.forEach(e => e.dom.addEventListener('click', onDrawGridModeSelect, false));
        btnsGridScope.forEach(e => e.dom.addEventListener('click', onGridScopeChange, false));
        btnsGridAlign.forEach(e => e.dom.addEventListener('click', onGridAlignChange, false));
        doms.inGridSpace.addEventListener('click', onGridSpaceChange, false);
        doms.btnShowOrder.addEventListener('mousedown', onShowOrder, false);
        btnsOrder.forEach(e => e.dom.addEventListener('click', onGridOrderChange, false));
        doms.btnPropsSave.addEventListener('click', onPropsSave, false);
        doms.btnPropsRestore.addEventListener('click', onPropsRestore, false);
        inForm.forEach(e => {
          e.dom.addEventListener('input', onPropsInput, false)
          e.dom.addEventListener('keydown', onPropsKey, false)
        });
        doms.btnResize.addEventListener('click', onResize, false);
        doms.btnAlignL.addEventListener('click', onAlignLeft, false);
        doms.btnAlignT.addEventListener('click', onAlignTop, false);
        doms.btnAlignR.addEventListener('click', onAlignRight, false);
        doms.btnAlignB.addEventListener('click', onAlignBottom, false);
        doms.btnAlignCH.addEventListener('click', onAlignCenterHorizontally, false);
        doms.btnAlignCV.addEventListener('click', onAlignCenterVertically, false);
        hideMask();
        context.freezed = false;
      },

      isGridDrawingModeSelected,

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

  var ftr = (function() {

    var doms = {
      info : $('selected-file'),
      cursor : $('coordinates'),
      load : $('load-indicator')
    };

    var coords = (function() {
      return {
        set : (ci) => doms.cursor.innerHTML = 'x: ' + ci.x + ', ' + 'y: ' + ci.y,
        clear : () => doms.cursor.innerHTML = ''
      };
    })();

    var loading = (function() {
      return {
        show : () => doms.load.style.display = 'inline',
        hide : () => doms.load.style.display = 'none'
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
            f.lastModified ? (new Date(f.lastModified)).toLocaleDateString() : 'n/a');      
        var info = document.createElement('p');
        info.innerHTML = output.join(''); 
        var image = document.createElement('img');
        image.src = window.URL.createObjectURL(f);
        doms.info.appendChild(image);
        doms.info.appendChild(info);
        return this;
      },

      errorEx : function(p) {
        clear();
        var info = document.createElement('p');
        info.textContent = 'Project "' + p.name + '" / Image "' + p.filename + '" - Corrupted record!';
        doms.info.classList.add('error');
        doms.info.appendChild(info);
        return this;
      },

      infoEx : function(p) {
        clear();
        var output = [];
        output.push('<strong>', escape(p.filename), '</strong> (', p.type || 'n/a', ') - ',
            p.size, ' bytes, last modified: n/a');      
        var info = document.createElement('p');
        info.innerHTML = output.join(''); 
        var image = document.createElement('img');
        image.src = p.dataURL;
        doms.info.appendChild(image);
        doms.info.appendChild(info);
        return this;
      },

      infoUpdate(width, height) {
        doms.info.lastChild.innerHTML += ' - ' + width + 'x' + height + ' px';
      },

      coords,
      loading

    };

  })(); /* FOOTER DISPLAY MANAGEMENT */

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
      hide(doms.codeLoader);
      clear();
      context.handlers.onLoadCode(doms.code.value);
    }

    function onClearClick(e) {
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

  var mnu = (function() {

    var doms = {
      newProjectBtn     : $('new-project'),
      previewBtn        : $('preview'),
      saveProjectBtn    : $('save-project'),
      loadProjectBtn    : $('load-project'),
      cleanProjectsBtn  : $('clean-projects'),
      generateBtn       : $('generate'),
      loadHTMLBtn       : $('load-html'),
      helpBtn           : $('help')
    },
    context = {
      handlers : null,
      enabled : true
    };

    var hide = (obj) => obj.style.display = 'none';
    var show = (obj) => obj.style.display = 'inline';

    function onNewProjectBtnClick(e) {
      e.preventDefault();
      if (context.enabled)
        context.handlers.onNewProject();
    }

    function onPreviewBtnClick(e) {
      e.preventDefault();
      if (context.enabled && !doms.previewBtn.classList.contains('disabled'))
        context.handlers.onPreview(doms.previewBtn.classList.toggle('selected'));
    }

    function onSaveProjectBtnClick(e) {
      e.preventDefault();
      if (context.enabled)
        context.handlers.onSaveProject();
    }

    function onLoadProjectBtnClick(e) {
      e.preventDefault();
      if (context.enabled)
        context.handlers.onLoadProject();
    }

    function onCleanProjectsBtnClick(e) {
      e.preventDefault();
      if (context.enabled)
        context.handlers.onCleanProjects();
    }

    function onGenerateBtnClick(e) {
      e.preventDefault();
      if (context.enabled && !doms.generateBtn.classList.contains('disabled'))
        context.handlers.onGenerateCode();
    }

    function onLoadHTMLBtnClick(e) {
      e.preventDefault();
      if (context.enabled && !doms.loadHTMLBtn.classList.contains('disabled'))
        context.handlers.onLoadHTML();
    }

    function onHelpBtnClick(e) {
      e.preventDefault();
      if (context.enabled)
        context.handlers.onHelp();
    }

    let canSave = () => doms.saveProjectBtn.classList.remove('disabled');
    let preventSave = () => doms.saveProjectBtn.classList.add('disabled');
    let release = () => {
      context.enabled = true;
      document.addEventListener('keydown', onKeyAction);
    }
    let freeze = () => {
      context.enabled = false;
      document.removeEventListener('keydown', onKeyAction);
    }

    function onKeyAction(e) {
      switch(e.key) {
      case 'm':
        if (utils.ctrlMetaKey(e)) {
          if (context.enabled)
            e.preventDefault();
            context.handlers.onNewProject();
        }
        break;
      case 'l':
        if (utils.ctrlMetaKey(e)) {
          if (context.enabled)
            e.preventDefault();
            context.handlers.onLoadProject();
        }
        break;
      case 's':
        if (utils.ctrlMetaKey(e)) {
          if (context.enabled && !doms.saveProjectBtn.classList.contains('disabled')) {
            e.preventDefault();
            context.handlers.onSaveProject();
          }
        }
        break;
      case 'p':
        if (utils.ctrlMetaKey(e)) {
          if (context.enabled && !doms.previewBtn.classList.contains('disabled')) {
            e.preventDefault();
            context.handlers.onPreview(doms.previewBtn.classList.toggle('selected'));
          }
        }
        break;
      case 'g':
        if (utils.ctrlMetaKey(e)) {
          if (context.enabled && !doms.generateBtn.classList.contains('disabled')) {
            e.preventDefault();
            context.handlers.onGenerateCode();
          }
        }
        break;
      case 'Escape':
        if (context.enabled && !doms.previewBtn.classList.contains('disabled') && doms.previewBtn.classList.contains('selected')) {
          e.preventDefault();
          context.handlers.onPreview(doms.previewBtn.classList.toggle('selected'));
        }
        break;
      default:
      }
    }

    function onCheckHelp(e) {
      if ('F1' === e.key) {
        e.preventDefault();
        if (context.enabled)
          context.handlers.onHelp();
      }
    }

    return {

      init : function(handlers) {
        context.handlers = handlers;
        doms.newProjectBtn.addEventListener('click', onNewProjectBtnClick, false);
        doms.previewBtn.addEventListener('click', onPreviewBtnClick, false);
        doms.saveProjectBtn.addEventListener('click', onSaveProjectBtnClick, false);
        doms.loadProjectBtn.addEventListener('click', onLoadProjectBtnClick, false);
        doms.cleanProjectsBtn.addEventListener('click', onCleanProjectsBtnClick, false);
        doms.generateBtn.addEventListener('click', onGenerateBtnClick, false);
        doms.loadHTMLBtn.addEventListener('click', onLoadHTMLBtnClick, false);
        doms.helpBtn.addEventListener('click', onHelpBtnClick, false);
        doms.saveProjectBtn.classList.add('disabled');
        doms.previewBtn.classList.add('disabled');
        doms.generateBtn.classList.add('disabled');
        doms.loadHTMLBtn.classList.add('disabled');
        document.addEventListener('keydown', onKeyAction);
        document.addEventListener('keydown', onCheckHelp);
        return this.reset();
      },

      reset : function() {
        doms.saveProjectBtn.classList.add('disabled');
        doms.previewBtn.classList.remove('selected');
        doms.previewBtn.classList.add('disabled');
        doms.generateBtn.classList.add('disabled');
        doms.loadHTMLBtn.classList.add('disabled');
        document.addEventListener('keydown', onKeyAction);
        return this;
      },

      switchToEditMode : function() {
        doms.previewBtn.classList.remove('disabled');
        doms.previewBtn.classList.remove('selected');
        doms.generateBtn.classList.remove('disabled');
        doms.loadHTMLBtn.classList.remove('disabled');
        return this;
      },

      canSave, preventSave,
      freeze, release

    };

  })(); /* MENU MANAGEMENT */

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
      if (unsafe) clp.setCopyUnsafe();
    };

    var setUnmodified = unsafe => {
      mdl.setUnmodified();
      mnu.preventSave();
      if (unsafe) clp.setCopyUnsafe();
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
          ftr.info(data.file);
          wks.load(data.file);
          setModified(true);
          rtn = true;
        } else {
          ftr.error(data.file);
        }
        release();
        return rtn;
      }

      function onLoadMap(name) {
        let rtn, project;
        rtn = false;
        project = store.read(name);
        ftr.infoEx(project);
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
          ftr.errorEx(project);
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
          ftr.reset();
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
          ftr.reset();
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
        let figGen = _factory[tls.getDrawingMode()];
        if (!figGen) {
          console.log('ERROR - Drawing mode not handled');
          return null;
         }
        return new figGen(parent, false, alt);
      }

      function _createGrid(parent, bond, gridParent) {
        let figGen = _gridFactory[tls.getDrawingMode()];
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
        let bondElt = (tls.isGridDrawingModeSelected()) ? selector.first().figure : null;
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
        if (_selected.length > 0)
          _selected.get(0).trivialize();
        _selected.empty();
        tls.disableGridTools();
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
        _areaUnselectAll();
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
        _tracker.cancel();
        _tracker = null;
        if (_selected.length > 0)
          _selected.get(0).highlight();
      }
      
      function onTrackExit() {
        if (_selected.length > 0)
          _selected.get(0).highlight();
        tls.release();
      }

      function onTrackCancel() {
        _tracker.cancel();
        _tracker = null;
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
        clp.setClipboard(mdl.toClipboard(_selected.reduce((a,e) => { a.push(e.figure); return a; }, []), clp.a2c));
      }

      function onPaste(forceDeepCopy) {
        let areas;
        if (clp.isCopyUnsafe() && !confirm('Areas have been added or deleted and grid references may have been altered. Only a deep copy including grid references can be done.\nPerform a deep copy?'))
          return;
        areas = mdl.fromClipboard(clp.getClipboard(), clp.c2a, forceDeepCopy);
        if (areas.length > 0) {
          mdl.addAreas(areas);
          areas.forEach(e => {
            e.dom.addEventListener('mouseover', onAreaEnter.bind(e), false);
            e.dom.addEventListener('mouseleave', onAreaLeave.bind(e), false);
          });
          setModified();
          selector.unselectAll();
          selector.selectSubset(areas);
          mover.handlers.onStep(wks.getParent(), clp.offset(), clp.offset());
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

    prj.init(projects.handlers);
    ctr.init(projects.handlers);
    ldr.init(projects.handlers);
    code.init(projects.handlers);
    htm.init(projects.handlers);
    help.init(projects.handlers);
    mnu.init(menu.handlers);
    wks.init(dragger.handlers, drawer.handlers, selector.handlers, mover.handlers, editor.handlers);
    tls.init(tooler.handlers);

  })(); /* APPLICATION MANAGEMENT */

})(); /* BIT */
