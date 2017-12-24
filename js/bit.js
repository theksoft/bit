/**
 * Boardgame image tool (BIT)
 * Copyright 2017 Herve Retaureau
 */

var bit = (function() {
  'use strict';

  function $(s) { return document.getElementById(s); }

  var utils = (function() {

    const keyCodes = {
      ESC   : 27,
      DEL   : 46,
      LEFT  : 37,
      UP    : 38,
      RIGHT : 39,
      DOWN  : 40,
      a     : 65
    };
      
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

    return {

      leftButton : e => (0 === e.button) ? true : false,
      leftButtonHeld : e => Math.floor(e.buttons/2)*2 !== e.buttons ? true : false,
      noMetaKey : e => (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) ? true : false,
      ctrlKey : e => (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) ? true : false,
      keyCodes, fgTypes,
      clsActions

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
          filename : '',
          areas : []
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

      isModified : () => context.modified,

      reset : function() {
        context.filename = '';
        context.modified = false;
        context.areas.sort((a,b) => a.isGrid ? -1 : 1);
        context.areas.forEach(e => e.remove());
        context.areas.splice(0, context.areas.length);
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

      addArea : function(area) {
        context.areas.push(area);
        context.modified = true;
      },

      removeArea : function(area) {
        if(-1 != context.areas.indexOf(area)) {
          if (!area.isGrid && area.hasBonds()) {
            if (false == confirm("Deleting this element will automatically delete grid built from it.\nDo you still want to proceed to element deletion ?")) {
              return;
            }
            let bonds = area.getBonds();
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
          context.modified = true;
        }
      },

      findArea : function(obj) {
        return context.areas.find(function(e) {
          return e.is(obj);
        });
      },

      forEachArea : f => context.areas.forEach(f)

    };

  })(); /* DATA MODEL MANAGEMENT */

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
        EDITED    : 'edited'
      };

    var context = {
      mode : 'new',
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
        context.state = states.READY; // TODO: Edit data on selected area ? or edit in tools ?
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
        if (utils.keyCodes.ESC === e.keyCode) {
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
        switch(e.keyCode) {
        case utils.keyCodes.ESC:
          if (ready() && utils.noMetaKey(e)) {
            context.aSel.onUnselectAll();
          }
          break;
        case utils.keyCodes.DEL:
          if (ready() && utils.noMetaKey(e)) {
            context.aSel.onDeleteAll();
          }
          break;
        case utils.keyCodes.a:
          if (ready() && utils.ctrlKey(e)) {
            context.aSel.onSelectAll();
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
        if (utils.keyCodes.ESC === e.keyCode) {
          context.aMov.onCancel();
          context.state = states.MOVED;
        }
      }

      function onMoveStep(e) {
        e.preventDefault();
        switch(e.keyCode) {
        case utils.keyCodes.LEFT:
          if (ready()) {
            if (utils.noMetaKey(e)) {
              context.aMov.onStep(doms.drawarea, -1, 0);
            } else if (utils.ctrlKey(e)) {
              context.aMov.onRotate(doms.drawarea, bitedit.directions.RACLK);
            }
          }
          break;
        case utils.keyCodes.RIGHT:
          if (ready()) {
            if (utils.noMetaKey(e)) {
              context.aMov.onStep(doms.drawarea, 1, 0);
            } else if (utils.ctrlKey(e)) {
              context.aMov.onRotate(doms.drawarea, bitedit.directions.RCLK);
            }
          }
          break;
        case utils.keyCodes.UP:
          if (ready() && utils.noMetaKey(e)) {
            context.aMov.onStep(doms.drawarea, 0, -1);
          }
          break;
        case utils.keyCodes.DOWN:
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
        if (utils.keyCodes.ESC === e.keyCode) {
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
        context.mode = 'new';
      },

      load : function(f) {
        ftr.loading.show();
        doms.image.onload = onLoadImage;
        doms.image.src = window.URL.createObjectURL(f);
        return this;
      }

    };

  })(); /* WORKSPACE MANAGEMENT */

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

        btnGridHex        : $('hex-grid'),
        btnGridRectangle  : $('rectangle-grid'),
        btnGridCircle     : $('circle-grid'),

        btnInnerGridScope : $('grid-scope-inner'),
        btnOuterGridScope : $('grid-scope-outer'),
        btnStdGridAlign   : $('grid-algn-std'),
        btnAltGridAlign   : $('grid-algn-alt'),
        btnAlt2GridAlign  : $('grid-algn-alt2'),

        inGridSpace       : $('grid-space')
    };

    const modes = utils.fgTypes;
    const scopes = bitgrid.scopes;
    const aligns = bitgrid.aligns;

    var context = {
        handlers : null,
        selected  : null,
        mode      : modes.NONE,
        allowGrid : false,
        freezed   : true,
        scope     : scopes.INNER,
        align     : aligns.STANDARD,
        space     : 0,
        gSpace    : true 
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
      case doms.btnGridRectangle:
        context.mode = modes.GRIDRECTANGLE;
        break;
      case doms.btnGridCircle:
        context.mode = modes.GRIDCIRCLE;
        break;
      case doms.btnGridHex:
        context.mode = modes.GRIDHEX;
        break;

      default:
        context.mode = modes.NONE;
      }
    }

    function isGridDrawingModeSelected() {
      let rtn = false;
      switch(context.selected) {
      case doms.btnGridRectangle:
      case doms.btnGridHex:
      case doms.btnGridCircle:
        rtn = true;
        break;
      default:
      }
      return rtn;
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
          context.scope = scopes.OUTER;
        } else {
          toggleState(doms.btnOuterGridScope, doms.btnInnerGridScope);
          context.scope = scopes.INNER;
        }
      }
    }

    function onDrawGridAlignSelect(evt) {
      evt.preventDefault();
      if(context.allowGrid) {
        if (evt.target === doms.btnStdGridAlign) {
          toggleState(doms.btnStdGridAlign, doms.btnAltGridAlign);
          context.align = aligns.ALT_HORIZONTAL;
        } else if (evt.target === doms.btnAltGridAlign) {
          toggleState(doms.btnAltGridAlign, doms.btnAlt2GridAlign);
          context.align = aligns.ALT_VERTICAL;
        } else {
          toggleState(doms.btnAlt2GridAlign, doms.btnStdGridAlign);
          context.align = aligns.STANDARD;
        }
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
      doms.btnGridHex.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnGridRectangle.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnGridCircle.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnInnerGridScope.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnOuterGridScope.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnStdGridAlign.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnAltGridAlign.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnAlt2GridAlign.classList.remove(bitedit.clsStatus.DISABLED);
    }

    function gridDisable() {
      doms.btnGridHex.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnGridRectangle.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnGridCircle.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnInnerGridScope.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnOuterGridScope.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnStdGridAlign.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnAltGridAlign.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnAlt2GridAlign.classList.add(bitedit.clsStatus.DISABLED);
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

    function onGridSpaceChange(e) {
      let v, d;
      d = doms.inGridSpace.defaultValue;
      v = getGridSpace();
      if (d !== v) {
        doms.inGridSpace.defaultValue = v;
        if (context.gSpace) {
          context.space = v;
        }
        context.handlers.onGridSpaceChange(v);
      }
    }

    var setGridSpace = (v) => doms.inGridSpace.value = doms.inGridSpace.defaultValue = v || context.space;
    var getGridSpace = () => doms.inGridSpace.value;

    function gridParamsDisable() {
      doms.inGridSpace.disabled = true;
    }

    function gridParamsEnable() {
      doms.inGridSpace.disabled = false;
    }

    function gridParamsReset() {
      doms.inGridSpace.defaultValue = "0";
      doms.inGridSpace.value = "0";
      gridParamsDisable();
    }

    function enableGridParams(obj) {
      if (context.allowGrid) {
        context.gSpace = true;
        setGridSpace();
        gridParamsEnable();
      } else if (obj.isGrid) {
        context.gSpace = false;
        setGridSpace(obj.getGridSpace());
        gridParamsEnable();
      }
    }

    function disableGridParams() {
      context.gSpace = true;
      setGridSpace();
      gridParamsDisable();
    }

    return {

      init : function(handlers) {
        context.handlers = handlers;
        this.release();
      },

      reset : function() {
        toggleSelect(null);
        toggleState(doms.btnOuterGridScope, doms.btnInnerGridScope);
        toggleState((aligns.ALT_VERTICAL === context.align) ? doms.btnAlt2GridAlign : doms.btnAltGridAlign, doms.btnStdGridAlign);
        gridDisable();
        context.mode = modes.NONE;
        context.scope = scopes.INNER;
        context.align = aligns.STANDARD;
        context.allowGrid = false;
        gridParamsReset();
        context.space = 0;
        context.gSpace = true;
        this.release();
      },

      getDrawingMode : () => context.mode,
      getScopeMode : () => context.scope,
      getAlignMode : () => context.align,
      getGridSpace,
      
      none : () => modes.NONE === context.mode ? true : false,

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
        doms.btnGridHex.removeEventListener('click', onDrawGridModeSelect, false);
        doms.btnGridRectangle.removeEventListener('click', onDrawGridModeSelect, false);
        doms.btnGridCircle.removeEventListener('click', onDrawGridModeSelect, false);
        doms.btnInnerGridScope.removeEventListener('click', onDrawGridScopeSelect, false);
        doms.btnOuterGridScope.removeEventListener('click', onDrawGridScopeSelect, false);
        doms.btnStdGridAlign.removeEventListener('click', onDrawGridAlignSelect, false);
        doms.btnAltGridAlign.removeEventListener('click', onDrawGridAlignSelect, false);
        doms.btnAlt2GridAlign.removeEventListener('click', onDrawGridAlignSelect, false);
        doms.inGridSpace.removeEventListener('click', onGridSpaceChange, false);
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
        doms.btnGridHex.addEventListener('click', onDrawGridModeSelect, false); 
        doms.btnGridRectangle.addEventListener('click', onDrawGridModeSelect, false);
        doms.btnGridCircle.addEventListener('click', onDrawGridModeSelect, false);
        doms.btnInnerGridScope.addEventListener('click', onDrawGridScopeSelect, false);
        doms.btnOuterGridScope.addEventListener('click', onDrawGridScopeSelect, false);
        doms.btnStdGridAlign.addEventListener('click', onDrawGridAlignSelect, false);
        doms.btnAltGridAlign.addEventListener('click', onDrawGridAlignSelect, false);
        doms.btnAlt2GridAlign.addEventListener('click', onDrawGridAlignSelect, false);
        doms.inGridSpace.addEventListener('click', onGridSpaceChange, false);
        context.freezed = false;
      },

      isGridDrawingModeSelected,

      enableGridTools : function(obj) {
        enableGridMode(obj);
        enableGridParams(obj);
      },

      disableGridTools() {
        disableGridMode();
        disableGridParams();
      },

      modes, scopes, aligns

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

  })(); /* FOOTER DISPLAY MANAGEMENT */
  
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

    var hide = (obj) => obj.style.display = 'none';
    var show = (obj) => obj.style.display = 'inline';

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

  })(); /* MENU MANAGEMENT */

  /*
   * APPLICATION
   */

  var app = (function() {

    var doms = {
      fileDropZone : $('file-drop-zone')
    },

    context = {
      selected : new bitedit.MultiSelector(),
      mover : new bitedit.Mover(),
      editor : new bitedit.Editor()
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

    },
    
    dragHandlers = {

      prevent : function(e) {
        if (!tls.none()) return true;
        if (mdl.findArea(e.target)) return true;
        return false;
      }

    },

    tlsHandlers = {

      onGridSpaceChange : function(v) {
        if (context.selected.length() === 1) {
          let area = context.selected.get(0).getFigure();
          if (area.isGrid) {
            area.setGridSpace(v);
          }
        }
      }

    };

    function isAreaSelected(area) {
      return context.selected.has(mdl.findArea(area));
    }

    var draw = (function() {

      var factory = {
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

      var gridFactory = {
        'gridRectangle' : bitgen.GridRectangle,
        'gridCircle'    : bitgen.GridCircle,
        'gridHex'       : bitgen.GridHex
      };

      var generator = null;

      function create(parent, alt) {
        let figGen = factory[tls.getDrawingMode()];
        if (!figGen) {
          console.log('ERROR - Drawing mode not handled');
          return null;
         }
        return new figGen(parent, false, alt);
      }

      function createGrid(parent, bond, gridParent) {
        let figGen = gridFactory[tls.getDrawingMode()];
        if (!figGen) {
          console.log('ERROR - Grid drawing mode not handled');
          return null;
        }
        return new figGen(parent, bond, gridParent, tls.getScopeMode(), tls.getAlignMode(), tls.getGridSpace());
      }

      var handlers = {

        prevent : function(e) {
          if (e.ctrlKey || e.shiftKey) return true;
          if (tls.none()) return true;
          if (mdl.findArea(e.target)) return true;
          return false;
        },

        onStart : function(parent, pt, alt, gridParent) {
          let bondElt = (tls.isGridDrawingModeSelected()) ? context.selected.get(0).getFigure() : null; 
          context.selected.empty();
          if (null === bondElt) {
            generator = create(parent, alt);
          } else {
            generator = createGrid(parent, bondElt, gridParent);
          }
          if (null == generator) {
            alert('Unable to draw selected area!');
            tls.disableGridTools();
            return false;
          }
          tls.freeze();
          generator.start(pt);
          return true;
        },

        onProgress : function(parent, pt) {
          let width = parent.getAttribute('width');
          let height = parent.getAttribute('height');
          generator.progress(pt, width, height);
        },

        onEnd : function(parent, pt) {
          let complete = true;
          let width = parent.getAttribute('width');
          let height = parent.getAttribute('height');
          switch(generator.end(pt, width, height)) {
          case 'done':
            let fig = generator.getFigure();
            mdl.addArea(fig);
            context.selected.set(fig);
            tls.release();
            tls.enableGridTools(fig);
            generator = null;
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
        },

        onCancel : function() {
          generator.cancel();
          generator = null;
          tls.release();
          tls.disableGridTools();
        }

      };

      return {
        handlers
      };

    })();

    var selector = (function() {

      var tracker = null;

      function updateGridMode() {
        if (context.selected.length() === 1) {
          tls.enableGridTools(context.selected.get(0).getFigure());
        } else {
          tls.disableGridTools();
        }
      }

      function areaSelect(area) {
        context.selected.set(mdl.findArea(area));
        tls.enableGridTools(context.selected.get(0).getFigure());
      }

      function areaMultiSelect(area) {
        context.selected.toggle(mdl.findArea(area));
        updateGridMode();
      }

      function computeSelection(coords) {
        mdl.forEachArea(function(e) {
          if (e.within(coords)) {
            if (!context.selected.has(e)) {
              context.selected.toggle(e);
            }
          } else if (context.selected.has(e)) {
            context.selected.toggle(e);
          }
        });
        updateGridMode();
      }

      function areaSelectAll() {
        mdl.forEachArea(e => context.selected.add(e));
        updateGridMode();
      }

      function areaUnselectAll() {
        context.selected.empty();
        tls.disableGridTools();
      }

      var handlers = {

        preventSelect : function(e) {
          if (e.ctrlKey || e.metaKey || e.altKey) return true;
          if (!mdl.findArea(e.target)) return true;
          if (isAreaSelected(e.target) && !e.shiftKey) return true; // is a move
          return false;
        },

        onSelect(target, shiftKey) {
          if (!shiftKey) {
            areaSelect(target);
          } else {
            areaMultiSelect(target);
          }
        },

        preventTracking : function(e) {
          if (!tls.none()) return true;
          if (!utils.noMetaKey(e)) return true;
          if (mdl.findArea(e.target)) return true;
          if (bitedit.isGrip(e.target)) return true;
          return false;
        },

        onTrackStart : function(parent, pt, unselect) {
          areaUnselectAll();
          tracker = new bitgen.Tracker(parent);
          tracker.start(pt);
          tls.freeze();
        },

        onTrackProgress : function(pt) {
          tracker.progress(pt);
          computeSelection(tracker.getCoords());
        },

        onTrackEnd : function() {
          tracker.cancel();
          tracker = null;
        },
        
        onTrackExit : function() {
          tls.release();
        },

        onTrackCancel : function() {
          tracker.cancel();
          tracker = null;
          tls.release();
        },

        onSelectAll : function() {
          areaSelectAll();
        },

        onUnselectAll : function() {
          areaUnselectAll();
        },

        onDeleteAll : function() {
          context.selected.sort((a,b) => a.getFigure().isGrid ? -1 : 1);
          context.selected.forEach(e => mdl.removeArea(e.getFigure()));
          context.selected.empty();
          tls.disableGridTools();
        }

      };

      return {
        handlers
      };

    })();

    var mover = (function() {

      var handlers = {

        prevent : function(e) {
          if (!mdl.findArea(e.target)) return true;
          if (!isAreaSelected(e.target)) return true;
          return false;
        },

        onStart : (parent, pt) => {
          let width = parent.getAttribute('width');
          let height = parent.getAttribute('height');
          context.selected.sort((a,b) => a.getFigure().isGrid ? -1 : 1);
          context.mover.start(context.selected, pt, width, height);
          tls.freeze();
        },
        onProgress : pt => context.mover.progress(pt),
        onEnd : pt => context.mover.end(pt),
        onExit : e => tls.release(),
        onCancel : ()  => {
          context.mover.cancel();
          tls.release();
        },
 
        onStep : function(parent, dx, dy) {
          let width = parent.getAttribute('width');
          let height = parent.getAttribute('height');
          context.mover.step(context.selected, dx, dy, width, height);
        },

        onRotate : function(parent, direction) {
          if (1 < context.selected.length()) {
            alert('Rotation is supported for a single selected area!');
            return;
          }
          let width = parent.getAttribute('width');
          let height = parent.getAttribute('height');
          if (!context.selected.get(0).rotate(direction, width, height)) {
            alert('ERROR - Rotation possibly makes area go beyond limits!');
          }
        }

      };

      return {
        handlers
      };

    })();

    var editor = (function() {

      var handlers = {

        prevent : function(e) {
          if (0 === context.selected.length()) return true;
          if (!context.selected.get(0).isEditable(e.target)) return true;
          return false;
        },

        onStart : function(parent, target, pt) {
          let width = parent.getAttribute('width');
          let height = parent.getAttribute('height');
          context.editor.start(context.selected.get(0), target, pt, width, height);
          tls.freeze();
        },

        onProgress : pt => context.editor.progress(pt),
        onEnd : pt => context.editor.end(pt),
        onExit : e => tls.release(),
        onCancel : () => {
          context.editor.cancel();
          tls.release();
        }

      };

      return {
        handlers
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

    mnu.init(mnuHandlers);
    wks.init(dragHandlers, draw.handlers, selector.handlers, mover.handlers, editor.handlers);
    tls.init(tlsHandlers);

  })(); /* APPLICATION MANAGEMENT */

})(); /* BIT */
