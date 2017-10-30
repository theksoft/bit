/**
 * Boardgame image tool (BIT)
 * Copyright 2017 Herve Retaureau
 */

var bit = (function() {
  'use strict';

  function $(s) { return document.getElementById(s); }

  /*
   * MODEL
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
      image     : $('img-display')/* TODO: ,
      drawarea  : $('draw-area')*/
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

    // VIEWPORT COMPUTATION 
    // Workarea elements size and coordinate offsets.

    var viewport = (function() {

      return {

        setWorkingDims : function(w,h) {
//          doms.drawarea.setAttribute('width', w);
//          doms.drawarea.setAttribute('height', h);
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
          return (0 > coords.x || doms.image.width < coords.x || 0 > coords.y || doms.image.height < coords.y) ? false : true;
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
/*      imageDragger.enable();
      areaDrawer.enable();
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
/*        imageDragger.disable();
        areaDrawer.disable();
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
//          tls.reset();
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

  })(); /* app */

})(); /* bit */
