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
      DOWN  : 40
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

    const directions = {
      RCLK  : 'clockwise',
      RACLK : 'anti-clockwise'
    };

    return {

      leftButton : function(e) {
        return (0 === e.button) ? true : false;
      },

      leftButtonHeld : function(e) {
        return Math.floor(e.buttons/2)*2 !== e.buttons ? true : false;
      },

      noKey : function(e) {
        return (!e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) ? true : false;
      },

      ctrlKey : function(e) {
        return (e.ctrlKey && !e.altKey && !e.metaKey && !e.shiftKey) ? true : false;
      },

      keyCodes, fgTypes,
      clsActions, directions

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

      isModified : function() {
        return context.modified;
      },

      reset : function() {
        context.filename = '';
        context.modified = false;
        context.areas.forEach(function(area) {
          area.remove();
        });
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
//          let bonds = [];
//          if (!area.isGrid() &&
//              area.hasBonds() &&
//              (true == confirm("Deleting this element will automatically delete grid built from it.\nDo you still want to proceed to element deletion ?"))) {
//            bonds = area.getBonds();
//            bonds.forEach(function(e) {
//              let j = context.areas.indexOf(e);
//              e.remove();
//              context.areas.splice(j, 1);
//            });
//            bonds.splice(0, bonds.length);
//          }
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

      forEachArea(f) {
        context.areas.forEach(f);
      }

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
      offset : { x : 0, y : 0 },
      iDrg : null, aDrw : null, aSel : null, aMov : null
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
//      areaEditor.disable();
        areaSelector.disable();
        context.state = states.DRAGGING;
      } 

      function exit() {
        doms.workarea.classList.remove(utils.clsActions.DRAGGING);
        rmWel('mouseup', onImageDragStop);
        rmWel('mousemove', onImageDragMove);
        areaDrawer.enable();
        areaMover.enable();
//      areaEditor.enable();
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
        if (context.iDrg.prevent(e)) return;
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
//        areaEditor.disable();
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
//        areaEditor.enable();
        areaSelector.enable();
        rmWel('click', onDrawEnd);
        rmWel('mousemove', onDrawProgress);
        addWel('click', onDrawStart);
        document.removeEventListener('keydown', onDrawCancel);
        context.state = states.READY; // TODO: Edit data on selected area ? or edit in tools ?
      }

      function onDrawStart(e) {
        e.preventDefault();
        if (context.aDrw.prevent(e) || (e.ctrlKey || e.shiftKey)) return;
        if (ready() && utils.leftButton(e) && viewport.isPointerInImage(e.pageX, e.pageY)) {
          if (context.aDrw.onStart(doms.drawarea, viewport.computeCoords(e.pageX, e.pageY), e.altKey)) {
            enter();
          }
        }
      }

      function onDrawProgress(e) {
        e.preventDefault();
        context.aDrw.onProgress(viewport.computeCoords(e.pageX, e.pageY));
      }

      function onDrawEnd(e) {
        e.preventDefault();
        if (!utils.leftButton(e)) return;
        if (context.aDrw.onEnd(viewport.computeCoords(e.pageX, e.pageY))) {
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
//        areaEditor.disable();
        rmWel('mousedown', onSelectStart);
        addWel('click', onSelectExit);
        addWel('mouseup', onSelectEnd);
        addWel('mousemove', onSelectProgress);
        document.removeEventListener('keydown', onKeyAction);
        context.state = states.SELECTING;
      }

      function exit() {
        doms.drawarea.classList.remove(utils.clsActions.TRACKING);
        rmWel('click', onSelectExit);
        rmWel('mouseup', onSelectEnd);
        rmWel('mousemove', onSelectProgress);
        addWel('mousedown', onSelectStart);
        document.addEventListener('keydown', onKeyAction);
        imageDragger.enable();
        areaDrawer.enable();
        areaMover.enable();
//        areaEditor.enable();
        context.state = states.READY;
      }

      function onSelectStart(e) {
        e.preventDefault();
        if (context.aSel.prevent(e)) return;
        if (ready() && utils.leftButton(e)) {
          context.aSel.onTrackStart(doms.drawarea, viewport.computeCoords(e.pageX, e.pageY), !e.shiftKey);
          enter();
        }
      }

      function onSelectProgress(e) {
        e.preventDefault();
        if (!utils.leftButtonHeld(e)) {
          if (states.SELECTED !== context.state) {
            context.aSel.onTrackCancel();
          } else {
            context.aSel.onSelect(e);
          }
          exit();
        } else if (states.SELECTING === context.state) {
          context.aSel.onTrackProgress(viewport.computeCoords(e.pageX, e.pageY));
        }
      }

      function onSelectEnd(e) {
        e.preventDefault();
        if (states.SELECTING === context.state) {
          context.aSel.onTrackEnd();
          context.state = states.SELECTED;
        }
      }

      function onSelectExit(e) {
        e.preventDefault();
        context.aSel.onSelect(e);
        exit();
      }

      function onKeyAction(e) {
        e.preventDefault();
        switch(e.keyCode) {
        case utils.keyCodes.ESC:
          if (ready() && utils.noKey(e)) {
            context.aSel.onUnselectAll();
          }
          break;
        case utils.keyCodes.DEL:
          if (ready() && utils.noKey(e)) {
            context.aSel.onDeleteAll();
          }
          break;
        default:
        }
      }

      return {
        enable : function() {
          if (enabled) return;
          addWel('mousedown', onSelectStart);
          document.addEventListener('keydown', onKeyAction);
          enabled = true;
        },
        disable : function() {
          if (!enabled) return;
          rmWel('mousedown', onSelectStart);
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
//        areaEditor.disable();
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
//        areaEditor.enable();
        areaSelector.enable();
        context.state = states.READY;
      }

      function onMoveStart(e) {
        e.preventDefault();
        if (context.aMov.prevent(e)) return;
        if(ready() && utils.leftButton(e) && utils.noKey(e)) {
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
            if (utils.noKey(e)) {
              context.aMov.onStep(doms.drawarea, -1, 0);
            } else if (utils.ctrlKey(e)) {
              context.aMov.onRotate(doms.drawarea, utils.directions.RACLK);
            }
          }
          break;
        case utils.keyCodes.RIGHT:
          if (ready()) {
            if (utils.noKey(e)) {
              context.aMov.onStep(doms.drawarea, 1, 0);
            } else if (utils.ctrlKey(e)) {
              context.aMov.onRotate(doms.drawarea, utils.directions.RCLK);
            }
          }
          break;
        case utils.keyCodes.UP:
          if (ready() && utils.noKey(e)) {
            context.aMov.onStep(doms.drawarea, 0, -1);
          }
          break;
        case utils.keyCodes.DOWN:
          if (ready() && utils.noKey(e)) {
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
            app.areas.move.cancel();
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
      areaDrawer.enable();
      areaMover.enable();
//      areaEditor.enable();
      areaSelector.enable();
    }

    return {

      init : function(iDrgHandlers, aDrwHandlers, aSelHandlers, aMovHandlers) {
        context.iDrg = iDrgHandlers;
        context.aDrw = aDrwHandlers;
        context.aSel = aSelHandlers;
        context.aMov = aMovHandlers;
        addWel('scroll', function(e) { viewport.computeOffset(); }, false );
        window.addEventListener('resize', function(e) { viewport.resize(); }, false);
        return this;
      },

      reset : function() {
        coordTracker.disable();
        imageDragger.disable();
        areaDrawer.disable();
        areaMover.disable();
//        areaEditor.disable();
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
      doms.btnHexDtrGrid.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnRectangleGrid.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnCircleDtrGrid.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnInnerGridScope.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnOuterGridScope.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnStdGridAlign.classList.remove(bitedit.clsStatus.DISABLED);
      doms.btnAltGridAlign.classList.remove(bitedit.clsStatus.DISABLED);
    }

    function gridDisable() {
      doms.btnHexDtrGrid.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnRectangleGrid.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnCircleDtrGrid.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnInnerGridScope.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnOuterGridScope.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnStdGridAlign.classList.add(bitedit.clsStatus.DISABLED);
      doms.btnAltGridAlign.classList.add(bitedit.clsStatus.DISABLED);
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

    context = {
      selected : new bitedit.MultiSelector(),
      mover : new bitedit.Mover()
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

    };

    function isAreaSelected(area) {
      return context.selected.has(mdl.findArea(area));
    }

    var draw = (function() {

      var factory = {
        rectangle : bitgen.Rectangle
      };

      var generator = null;

      function create(parent, alt) {
        let figGen = factory[tls.getDrawingMode()];
        if (!figGen) {
          console.log('ERROR - Drawing mode not handled');
          return null;
        }
        return new figGen(parent, alt);
      }

      var handlers = {

        prevent : function(e) {
          if (tls.none()) return true;
          if (mdl.findArea(e.target)) return true;
        },

        onStart : function(parent, pt, alt) {
//          let bondElt = (tls.isGridDrawingModeSelected()) ? context.selected.get(0) : null; 
          context.selected.empty();
          generator = create(parent, alt);
//          context.gen = create(alt, bondElt);
          if (null == generator) {
            alert('Unable to draw selected area!');
//            tls.disableGridMode();
            return false;
          }
          tls.freeze();
          generator.start(pt);
          return true;
        },

        onProgress : function(pt) {
/*
            let width = doms.drawarea.getAttribute('width');
            let height = doms.drawarea.getAttribute('height');
            context.gen.drawMove(pt, width, height);
 */
          generator.progress(pt);
        },

        onEnd : function(pt) {
          let complete = true;
//          let width = doms.drawarea.getAttribute('width');
//          let height = doms.drawarea.getAttribute('height');
//          switch(context.gen.drawEnd(pt, width, height)) {
          switch(generator.end(pt)) {
          case 'done':
            let fig = generator.getFigure();
            mdl.addArea(fig);
            context.selected.set(fig);
            tls.release();
//            tls.enableGridMode(context.gen);
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
//          tls.disableGridMode();
        }

      };

      return {
        handlers
      };

    })();

    var selector = (function() {

      var tracker = null,
          moved = false;

      function areaSelect(area) {
        context.selected.set(mdl.findArea(area));
//        tls.enableGridMode(context.selected.get(0));
      }

      function areaMultiSelect(area) {
        context.selected.toggle(mdl.findArea(area));
//        if (context.selected.length() === 1) {
//          tls.enableGridMode(context.selected.get(0));
//        } else {
//          tls.disableGridMode();
//        }
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
//        if (context.selected.length() === 1) {
//          tls.enableGridMode(context.selected.get(0));
//        } else {
//          tls.disableGridMode();
//        }
      }

      function areaUnselectAll() {
        context.selected.empty();
//        tls.disableGridMode();
      }

      var handlers = {

        prevent : function(e) {
          if (!tls.none()) return true;
          if (e.ctrlKey || e.metaKey || e.altKey) return true;
//          if (app.areas.edit.isGrabber(e.target)) return;
          if (mdl.findArea(e.target) && isAreaSelected(e.target) && !e.shiftKey) return true; // is a move
          return false;
        },

        onTrackStart : function(parent, pt, unselect) {
          if (unselect) {
            areaUnselectAll();
          }
          moved = false;
          tracker = new bitgen.Tracker(parent);
          tracker.start(pt);
          tls.freeze();
        },

        onTrackProgress : function(pt) {
          moved = true;
          tracker.progress(pt);
          computeSelection(tracker.getCoords());
        },

        onTrackEnd : function() {
          tracker.cancel();
          tracker = null;
        },

        onTrackCancel : function() {
          tracker.cancel();
          moved = false;
          tracker = null;
          tls.release();
        },
        
        onSelect : function(e) {
          if (!moved) {
            if (mdl.findArea(e.target)) {
              if (!e.shiftKey) {
                areaSelect(e.target);
              } else {
                areaMultiSelect(e.target);
              }
            }
          }
          moved = false;
          tls.release();
        },

        onUnselectAll : function() {
          areaUnselectAll();
        },

        onDeleteAll : function() {
//          context.selected.sort(function(a,b) {
//            // in order to delete grid before non-grid elements => avoid prompting when grid and bond are selected
//            return (a.isGrid() ? -1 : 1);
//          });
          context.selected.forEach(function(e) {
            mdl.removeArea(e.getFigure());
          });
          context.selected.empty();
//          tls.disableGridMode();
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

          onStart : function(parent, pt) {
            let width = parent.getAttribute('width');
            let height = parent.getAttribute('height');
            context.mover.start(context.selected, pt, width, height);
            tls.freeze();
          },

          onProgress : function(pt) {
            context.mover.progress(pt);
          },

          onEnd : function(pt) {
            context.mover.end(pt);
          },

          onCancel : function() {
            context.mover.cancel();
            tls.release();
          },
          
          onExit : function(e) {
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
    wks.init(dragHandlers, draw.handlers, selector.handlers, mover.handlers);
    tls.init();

  })(); /* app */

})(); /* bit */
