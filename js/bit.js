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
      a     : 65,
      F8    : 119
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

      forEachArea : f => context.areas.forEach(f),

      freezeGridArea : function(grid, areas) {
        if (!grid.isGrid ||
            false === confirm("Freezing this element will automatically delete grid dependencies and generate independant elements.\nDo you still want to proceed to grid freeze ?")) {
          return false;
        }
        let i = context.areas.indexOf(grid);
        grid.freezeTo(areas);
        grid.remove();
        context.areas.splice(i, 1);
        areas.forEach(e => context.areas.push(e));
        context.modified = true;
        return true;
      }

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
        case utils.keyCodes.F8:
          if (ready() && utils.ctrlKey(e)) {
            context.aSel.onFreeze();
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

    const modes = utils.fgTypes;
    const scopes = bitgrid.scopes;
    const aligns = bitgrid.aligns;
    const orders = bitgrid.orders;

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

    const doms = {
      inGridSpace   : $('grid-space'),
      btnShowOrder  : $('show-order')
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
      doms.btnShowOrder.classList.remove(bitedit.clsStatus.SELECTED);
      context.showOrder = false;
      setGridOrder(btnsOrder[0].order);
    }

    function onShowOrder(e) {
      if(!context.showOrder) {
        doms.btnShowOrder.classList.add(bitedit.clsStatus.SELECTED);
        doms.btnShowOrder.removeEventListener('mousedown', onShowOrder, false);
        doms.btnShowOrder.addEventListener('mouseup', onHideOrder, false);
        doms.btnShowOrder.addEventListener('mouseleave', onHideOrder, false);
        context.handlers.onShowOrder(true);
        context.showOrder = true;
      }
    }

    function onHideOrder(e) {
      if(context.showOrder) {
        doms.btnShowOrder.classList.remove(bitedit.clsStatus.SELECTED);
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
        setGridScope(obj.getGridScope());
        setGridAlign(obj.getGridAlign());
        setGridSpace(obj.getGridSpace());
        setGridOrder(obj.getGridOrder());
      } else {
        context.gParam = true;
        setGridScope();
        setGridAlign();
        setGridSpace();
        setGridOrder();
      }
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
        context.freezed = false;
      },

      isGridDrawingModeSelected,

      enableGridTools : function(obj) {
        enableGridMode(obj);
        updateGridParams(obj);
      },

      disableGridTools() {
        disableGridMode();
        updateGridParams();
      },

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
      editor : new bitedit.Editor(),
      order : new bitedit.Order()
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

      onGridScopeChange : function(v) {
        if (context.selected.length() === 1) {
          let area = context.selected.get(0).getFigure();
          if (area.isGrid) {
            area.setGridScope(v);
          }
        }
      },

      onGridAlignChange : function(v) {
        if (context.selected.length() === 1) {
          let area = context.selected.get(0).getFigure();
          if (area.isGrid) {
            area.setGridAlign(v);
          }
        }
      },

      onGridSpaceChange : function(v) {
        if (context.selected.length() === 1) {
          let area = context.selected.get(0).getFigure();
          if (area.isGrid) {
            area.setGridSpace(v);
          }
        }
      },

      onShowOrder : function(bShow) {
        if (bShow) {
          let list, fig;
          if (context.selected.length() === 1) {
            fig = context.selected.get(0).getFigure();
            list = (fig.isGrid) ? [fig] : fig.getBonds();
            list.forEach(g => context.order.display(g.getElts()));
          }
        } else {
          context.order.hide();
        }
      },

      onGridOrderChange : function(v) {
        if (context.selected.length() === 1) {
          let area = context.selected.get(0).getFigure();
          if (area.isGrid) {
            area.setGridOrder(v);
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
        return new figGen(parent, bond, gridParent, tls.getGridScope(), tls.getGridAlign(), tls.getGridSpace(), tls.getGridOrder());
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
        },

        onFreeze : function() {
          if (context.selected.length() === 1) {
            let newSel = [];
            if (mdl.freezeGridArea(context.selected.get(0).getFigure(), newSel)) {
              context.selected.empty();
              newSel.forEach(e => context.selected.add(e));
              updateGridMode();
              newSel = null;
            }
          }
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
