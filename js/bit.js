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
      HEXDTRGRID    : 'hexDtrGrid',
      RECTANGLEGRID : 'rectangleGrid',
      CIRCLEDTRGRID : 'circleDtrGrid'
    };

    const clsActions = {
      DRAGGING      : 'dragging',
      DRAWING       : 'drawing',
      TRACKING      : 'tracking',
      MOVING        : 'moving',
      EDITING       : 'editing'
    };

    const clsStatus = {
      DISABLED      : 'disabled',
      SELECTED      : 'selected',
      HIGHLIGHTED   : 'highlighted'
    };

    return {

      leftButton : function(e) {
        return (0 !== e.buttons && 0 === e.button) ? true : false;
      },

      ctrlKey : function(e) {
        return (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) ? true : false;
      },

      fgTypes,
      clsActions, clsStatus

    };

  })();
  
  /*
   * DATA MODEL MANAGEMENT
   */

  var mdl = (function() {

    var imgTypes = ['image/jpeg', 'image/gif', 'image/png'],
        context = {
          mode : 'new',
          modified : false,
          filename : ''/* TODO:,
          areas : []*/
        };
    
    function validateImgFile(f) {
      for(var i = 0; i < imgTypes.length; i++) {
        if(f.type === imgTypes[i]) {
          return true;
        }
      }
      return false;
    }

    return {

      isModified : function() {
        return context.modified;
      },

      reset : function() {
        context.filename = '';
        context.modified = false;
/* TODO:
        context.areas.forEach(function(area) {
          area.remove();
        });
        context.areas.splice(0, context.areas.length);
*/
        return this;
      },

      setFile : function(f) {
        if (validateImgFile(f)) {
          context.filename = f.name;
          context.modified = true;
          return true;
        }
        return false;
      },
/* TODO:
      addArea : function(area) {
        context.areas.push(area);
        context.modified = true;
      },

      removeArea : function(area) {
        if(-1 != context.areas.indexOf(area)) {
          let bonds = [];
          if (!area.isGrid() &&
              area.hasBonds() &&
              (true == confirm("Deleting this element will automatically delete grid built from it.\nDo you still want to proceed to element deletion ?"))) {
            bonds = area.getBonds();
            bonds.forEach(function(e) {
              let j = context.areas.indexOf(e);
              e.remove();
              context.areas.splice(j, 1);
            });
            bonds.splice(0, bonds.length);
          }
          let i = context.areas.indexOf(area);
          area.remove();
          context.areas.splice(i, 1);
          context.modified = true;
        }
      },

      findArea : function(obj) {
        return context.areas.find(function(e) {
          return e.check(obj);
        });
      },
      
      forEachArea(f) {
        context.areas.forEach(f);
      }
*/
    };

  })(); /* mdl */

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
      drawarea  : $('draw-area')
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
        EDITED    : 'edited'
      };

    var context = {
      mode : 'new',
      state : states.OPEN,
      offset : { x : 0, y : 0 }
    };

    function addWel(t, f) {
      doms.workarea.addEventListener(t, f, false);
    }

    function rmWel(t, f) {
      doms.workarea.removeEventListener(t, f, false);
    }

    function ready() {
      return states.READY === context.state ? true : false;
    }

    function preventImageDragger(e) {
      if (!tls.none()) return true;
//    if (app.areas.select.isAreaTargeted(e.target)) return;
      return false;
    }

    // VIEWPORT COMPUTATION 
    // Workarea elements size and coordinate offsets.

    var viewport = (function() {

      return {

        setWorkingDims : function(w,h) {
          doms.drawarea.setAttribute('width', w);
          doms.drawarea.setAttribute('height', h);
          doms.container.style.width = w + 'px';
          doms.container.style.height = h + 'px';
          return this;
        },

        setViewDims : function() {
          var fc = doms.footer.getBoundingClientRect(),
              ac = doms.aside.getBoundingClientRect(),
              wc = doms.wks.getBoundingClientRect();
          var width = Math.floor(fc.right - (ac.right - ac.left) - wc.left - 5),
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

    /*
     * BACKGROUND IMAGE DRAGGER
     * 
     * Dragging start with a mouse down on image and CTRL key
     * Dragging is active as long as the pointer is in the workarea and button is down
     * Dragging stop on mouse up or if a move w/o buttons down is caught
     * 
     * Dragging move and top listeners are installed only if a dragging is started.
     */

    var imageDragger = (function() {

      var enabled = false;

      function enter() {
        doms.workarea.classList.add(utils.clsActions.DRAGGING);
        addWel('mouseup', onImageDragStop);
        addWel('mousemove', onImageDragMove);
        tls.freeze();
        context.state = states.DRAGGING;
      } 

      function exit() {
        doms.workarea.classList.remove(utils.clsActions.DRAGGING);
        rmWel('mouseup', onImageDragStop);
        rmWel('mousemove', onImageDragMove);
        tls.release();
        context.state = states.READY;
      }

      function move(dx, dy) {
        doms.workarea.scrollLeft -= dx;
        doms.workarea.scrollTop  -= dy;
      }

      function onImageDragStart(e) {
        e.preventDefault();
        if (preventImageDragger()) return;
        if (ready() && utils.leftButton(e) && utils.ctrlKey(e) && viewport.isPointerInImage(e.pageX, e.pageY)) {
          enter();
        }
      }

      function onImageDragStop(e) {
        e.preventDefault();
        exit();
      }

      function onImageDragMove(e) {
        e.preventDefault();
        if (!utils.leftButton(e) || !utils.ctrlKey(e)) {
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

    function hide(obj) {
      obj.style.display = 'none';
    }

    function show(obj) {
      obj.style.display = 'block';
    }

    function onLoadImage() {
      ftr.loading.hide();
      show(doms.aside);
      show(doms.workarea);
      viewport.setWorkingDims(doms.image.width, doms.image.height)
              .resize();
      context.state = states.READY;
      coordTracker.enable();
      imageDragger.enable();
/*      areaDrawer.enable();
      areaMover.enable();
      areaEditor.enable();
      areaSelector.enable();*/
    }

    return {

      init : function() {
        addWel('scroll', function(e) { viewport.computeOffset(); }, false );
        window.addEventListener('resize', function(e) { viewport.resize(); }, false);
        return this;
      },

      reset : function() {
        coordTracker.disable();
        imageDragger.disable();
/*        areaDrawer.disable();
        areaMover.disable();
        areaEditor.disable();
        areaSelector.disable();*/
        doms.image.src = '';
        hide(doms.workarea);
        hide(doms.aside);
        context.mode = 'new';
      },

      load : function(f) {
        ftr.loading.show();
        doms.image.onload = onLoadImage;
        doms.image.src = window.URL.createObjectURL(f);
        return this;
      }

    };

  })(); /* wks */

  /*
   * TOOLS PALETTE MANAGEMENT 
   */

  var tls = (function() {

    const doms = {
        btnHexDtr         : $('hex-d'),
        btnHexRct         : $('hex-r'),
        btnRectangle      : $('rectangle'),
        btnSquare         : $('square'),
        btnRhombus        : $('rhombus'),
        btnTriangleEql    : $('triangle-e'),
        btnTriangleIsc    : $('triangle-i'),
        btnTriangleRct    : $('triangle-r'),
        btnEllipse        : $('ellipse'),
        btnCircleDtr      : $('circle-d'),
        btnCircleCtr      : $('circle-c'),
        btnPolygon        : $('polygon'),

        btnHexDtrGrid     : $('hex-d-grid'),
        btnRectangleGrid  : $('rectangle-grid'),
        btnCircleDtrGrid  : $('circle-d-grid'),

        btnInnerGridScope : $('grid-scope-inner'),
        btnOuterGridScope : $('grid-scope-outer'),
        btnStdGridAlign   : $('grid-algn-std'),
        btnAltGridAlign   : $('grid-algn-alt')
    };

    const modes = utils.fgTypes;

    var context = {
        selected : null,
        mode : modes.NONE,
        allowGrid : false,
        freezed : true
    };

    function setDrawingMode() {
      switch(context.selected) {
      case doms.btnHexDtr:
        context.mode = modes.HEXDTR;
        break;
      case doms.btnHexRct:
        context.mode = modes.HEXRCT;
        break;
      case doms.btnRectangle:
        context.mode = modes.RECTANGLE;
        break;
      case doms.btnSquare:
        context.mode = modes.SQUARE;
        break;
      case doms.btnRhombus:
        context.mode = modes.RHOMBUS;
        break;
      case doms.btnTriangleEql:
        context.mode = modes.TRIANGLEEQL;
        break;
      case doms.btnTriangleIsc:
        context.mode = modes.TRIANGLEISC;
        break;
      case doms.btnTriangleRct:
        context.mode = modes.TRIANGLERCT;
        break;
      case doms.btnEllipse:
        context.mode = modes.ELLIPSE;
        break;
      case doms.btnCircleDtr:
        context.mode = modes.CIRCLEDTR;
        break;
      case doms.btnCircleCtr:
        context.mode = modes.CIRCLECTR;
        break;
      case doms.btnPolygon:
        context.mode = modes.POLYGON;
        break;
// TODO: Change this!
      case doms.btnHexDtrGrid:
        context.mode = modes.HEXDTRGRID;
        break;
      case doms.btnRectangleGrid:
        context.mode = modes.RECTANGLEGRID;
        break;
      case doms.btnCircleDtrGrid:
        context.mode = modes.CIRCLEDTRGRID;
        break;

      default:
        context.mode = modes.NONE;
      }
    }
// TODO: Change this!
    function isGridDrawingModeSelected() {
      let rtn = false;
      switch(context.selected) {
      case doms.btnHexDtrGrid:
      case doms.btnRectangleGrid:
      case doms.btnCircleDtrGrid:
        rtn = true;
        break;
      default:
      }
      return rtn;
    }

    function select(obj) {
      if (null != obj) {
        obj.classList.add(utils.clsStatus.SELECTED);
      }
      context.selected = obj;
    }

    function unselect(obj) {
      if (obj != null) {
        obj.classList.remove(utils.clsStatus.SELECTED);
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

    function onDrawModeSelect(evt) {
      evt.preventDefault();
      toggleSelect(evt.target);
      setDrawingMode();
    }

    function onDrawGridModeSelect(evt) {
      evt.preventDefault();
      if(context.allowGrid) {
        toggleSelect(evt.target);
        setDrawingMode();
      }
    }

    function onDrawGridScopeSelect(evt) {
      evt.preventDefault();
      if(context.allowGrid) {
        if (evt.target === doms.btnInnerGridScope) {
          toggleState(doms.btnInnerGridScope, doms.btnOuterGridScope);
        } else {
          toggleState(doms.btnOuterGridScope, doms.btnInnerGridScope);
        }
      }
    }

    function onDrawGridAlignSelect(evt) {
      evt.preventDefault();
      if(context.allowGrid) {
        if (evt.target === doms.btnStdGridAlign) {
          toggleState(doms.btnStdGridAlign, doms.btnAltGridAlign);
        } else {
          toggleState(doms.btnAltGridAlign, doms.btnStdGridAlign);
        }
      }
    }

    function canGrid(obj) {
      let rtn = true;
      switch(obj.type) {
      case utils.fgTypes.NONE:
      case utils.fgTypes.HEXDTRGRID:
      case utils.fgTypes.RECTANGLEGRID:
      case utils.fgTypes.CIRCLEDTRGRID:
      case utils.fgTypes.POLYGON:
        rtn = false;
        break;
      default:
      }
      return rtn;
    }

    function gridEnable() {
      doms.btnHexDtrGrid.classList.remove(utils.clsStatus.DISABLED);
      doms.btnRectangleGrid.classList.remove(utils.clsStatus.DISABLED);
      doms.btnCircleDtrGrid.classList.remove(utils.clsStatus.DISABLED);
      doms.btnInnerGridScope.classList.remove(utils.clsStatus.DISABLED);
      doms.btnOuterGridScope.classList.remove(utils.clsStatus.DISABLED);
      doms.btnStdGridAlign.classList.remove(utils.clsStatus.DISABLED);
      doms.btnAltGridAlign.classList.remove(utils.clsStatus.DISABLED);
    }

    function gridDisable() {
      doms.btnHexDtrGrid.classList.add(utils.clsStatus.DISABLED);
      doms.btnRectangleGrid.classList.add(utils.clsStatus.DISABLED);
      doms.btnCircleDtrGrid.classList.add(utils.clsStatus.DISABLED);
      doms.btnInnerGridScope.classList.add(utils.clsStatus.DISABLED);
      doms.btnOuterGridScope.classList.add(utils.clsStatus.DISABLED);
      doms.btnStdGridAlign.classList.add(utils.clsStatus.DISABLED);
      doms.btnAltGridAlign.classList.add(utils.clsStatus.DISABLED);
    }

    return {

      init : function() {
        this.release();
      },

      reset : function() {
        toggleSelect(null);
        gridDisable();
        context.mode = modes.NONE;
        this.release();
      },

      getDrawingMode : function() {
        return context.mode;
      },
      
      none : function() {
        return modes.NONE === context.mode ? true : false;
      },

      freeze : function() {
        if (context.freezed) return;
        doms.btnHexDtr.removeEventListener('click', onDrawModeSelect, false);
        doms.btnHexRct.removeEventListener('click', onDrawModeSelect, false);
        doms.btnRectangle.removeEventListener('click', onDrawModeSelect, false);
        doms.btnSquare.removeEventListener('click', onDrawModeSelect, false);
        doms.btnRhombus.removeEventListener('click', onDrawModeSelect, false);
        doms.btnTriangleEql.removeEventListener('click', onDrawModeSelect, false);
        doms.btnTriangleIsc.removeEventListener('click', onDrawModeSelect, false);
        doms.btnTriangleRct.removeEventListener('click', onDrawModeSelect, false);
        doms.btnEllipse.removeEventListener('click', onDrawModeSelect, false);
        doms.btnCircleDtr.removeEventListener('click', onDrawModeSelect, false);
        doms.btnCircleCtr.removeEventListener('click', onDrawModeSelect, false);
        doms.btnPolygon.removeEventListener('click', onDrawModeSelect, false);
        doms.btnHexDtrGrid.removeEventListener('click', onDrawGridModeSelect, false);
        doms.btnRectangleGrid.removeEventListener('click', onDrawGridModeSelect, false);
        doms.btnCircleDtrGrid.removeEventListener('click', onDrawGridModeSelect, false);
        doms.btnInnerGridScope.removeEventListener('click', onDrawGridScopeSelect, false);
        doms.btnOuterGridScope.removeEventListener('click', onDrawGridScopeSelect, false);
        doms.btnStdGridAlign.removeEventListener('click', onDrawGridAlignSelect, false);
        doms.btnAltGridAlign.removeEventListener('click', onDrawGridAlignSelect, false);
        context.freezed = true;
      },

      release : function() {
        if (!context.freezed) return;
        doms.btnHexDtr.addEventListener('click', onDrawModeSelect, false);
        doms.btnHexRct.addEventListener('click', onDrawModeSelect, false);
        doms.btnRectangle.addEventListener('click', onDrawModeSelect, false);
        doms.btnSquare.addEventListener('click', onDrawModeSelect, false);
        doms.btnRhombus.addEventListener('click', onDrawModeSelect, false);
        doms.btnTriangleEql.addEventListener('click', onDrawModeSelect, false);
        doms.btnTriangleIsc.addEventListener('click', onDrawModeSelect, false);
        doms.btnTriangleRct.addEventListener('click', onDrawModeSelect, false);
        doms.btnEllipse.addEventListener('click', onDrawModeSelect, false);
        doms.btnCircleDtr.addEventListener('click', onDrawModeSelect, false);
        doms.btnCircleCtr.addEventListener('click', onDrawModeSelect, false);
        doms.btnPolygon.addEventListener('click', onDrawModeSelect, false);
        doms.btnHexDtrGrid.addEventListener('click', onDrawGridModeSelect, false);
        doms.btnRectangleGrid.addEventListener('click', onDrawGridModeSelect, false);
        doms.btnCircleDtrGrid.addEventListener('click', onDrawGridModeSelect, false);
        doms.btnInnerGridScope.addEventListener('click', onDrawGridScopeSelect, false);
        doms.btnOuterGridScope.addEventListener('click', onDrawGridScopeSelect, false);
        doms.btnStdGridAlign.addEventListener('click', onDrawGridAlignSelect, false);
        doms.btnAltGridAlign.addEventListener('click', onDrawGridAlignSelect, false);
        context.freezed = false;
      },

      isGridDrawingModeSelected,

      enableGridMode : function(obj) {
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
      },

      disableGridMode : function() {
        if (context.allowGrid) {
          if (isGridDrawingModeSelected()) {
            toggleSelect(null);
            context.mode = modes.NONE;
          }
          gridDisable();
          context.allowGrid = false;
        }
      },

      modes

    };

  })(); /* tools */

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
        set : function(ci) { doms.cursor.innerHTML = 'x: ' + ci.x + ', ' + 'y: ' + ci.y; },
        clear : function() { doms.cursor.innerHTML = ''; }
      };
    })();

    var loading = (function() {
      return {
        show : function() { doms.load.style.display = 'inline'; },
        hide : function() { doms.load.style.display = 'none'; }
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
            f.lastModifiedDate ? f.lastModifiedDate.toLocaleDateString() : 'n/a');      
        var info = document.createElement('p');
        info.innerHTML = output.join(''); 
        var image = document.createElement('img');
        image.src = window.URL.createObjectURL(f);
        doms.info.appendChild(image);
        doms.info.appendChild(info);
        return this;
      },

      coords,
      loading

    };

  })(); /* ftr */
  
  /*
   * MENU MANAGEMENT
   */

  var mnu = (function() {

    var doms = {
      newProjectBtn : $('new-project'),
      fileDropZone : $('file-drop-zone'),
      loadFileLbl : $('load-file-lbl'),
      loadFileInput : $('load-file')
    },
    context = {
      handlers : null
    };

    function hide(obj) {
      obj.style.display = 'none';
    }

    function show(obj) {
      obj.style.display = 'inline';
    }

    function onNewProjectBtnClick(e) {
      e.preventDefault();
      context.handlers.onNewProject();
    }

    function onFileDragOver(e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    function onFileDragLeave(e) {
      e.stopPropagation();
      e.preventDefault();
    }
    
    function onFileDrop(e) {
      e.stopPropagation();
      e.preventDefault();
      context.handlers.onNewFiles(e.dataTransfer.files);
    }
    
    function onLoadFileInputChange(e) {
      e.preventDefault();
      context.handlers.onNewFiles(e.target.files);
    }
    
    return {

      init : function(handlers) {
        context.handlers = handlers;
        doms.newProjectBtn.addEventListener('click', onNewProjectBtnClick, false);
        doms.fileDropZone.draggable = true;
        doms.fileDropZone.addEventListener('dragover', onFileDragOver, false);
        doms.fileDropZone.addEventListener('dragleave', onFileDragLeave, false);
        doms.fileDropZone.addEventListener('drop', onFileDrop, false);
        doms.loadFileInput.addEventListener('change', onLoadFileInputChange, false);
        return this.reset();
      },

      reset : function() {
        doms.loadFileInput.style.opacity = '0';
        doms.loadFileInput.style.position = 'fixed';
        doms.loadFileInput.style.top = '-100em';
        doms.loadFileInput.value = '';
        show(doms.loadFileInput);
        show(doms.loadFileLbl);
        show(doms.fileDropZone);
        return this;
      },

      switchToEditMode : function() {
        hide(doms.fileDropZone)
        hide(doms.loadFileInput)
        hide(doms.loadFileLbl)
        return this;
      }

    };

  })(); /* mnu */

  /*
   * APPLICATION
   */

  var app = (function() {

    var doms = {
      fileDropZone : $('file-drop-zone')
    },

    mnuHandlers = {

      onNewProject : function() {
        if (!mdl.isModified() || confirm('Discard all changes?')) {
          ftr.reset();
          wks.reset();
          tls.reset();
          mnu.reset();
          mdl.reset();
        }
      },

      onNewFiles : function(files) {
        var selFile = files[0];
        if (0 === files.length) {
          ftr.reset();
        } else if (1 < files.length) {
          ftr.error(null);
        } else if (mdl.setFile(selFile)) {
          mnu.switchToEditMode();
          ftr.info(selFile);
          wks.load(selFile);
        } else {
          ftr.error(selFile);
        }
      }

    }

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

    mnu.init(mnuHandlers);
    wks.init();
    tls.init();

  })(); /* app */

})(); /* bit */
