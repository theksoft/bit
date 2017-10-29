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
   * MENU MANAGEMENT
   */

  var mnu = (function() {
    
    var context = {
      doms : null,
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

      init : function(objs, handlers) {
        context.doms = objs;
        context.handlers = handlers;
        context.doms.newProjectBtn.addEventListener('click', onNewProjectBtnClick, false);
        context.doms.fileDropZone.draggable = true;
        context.doms.fileDropZone.addEventListener('dragover', onFileDragOver, false);
        context.doms.fileDropZone.addEventListener('dragleave', onFileDragLeave, false);
        context.doms.fileDropZone.addEventListener('drop', onFileDrop, false);
        context.doms.loadFileInput.addEventListener('change', onLoadFileInputChange, false);
        return this.reset();
      },

      reset : function() {
        context.doms.loadFileInput.style.opacity = '0';
        context.doms.loadFileInput.style.position = 'fixed';
        context.doms.loadFileInput.style.top = '-100em';
        context.doms.loadFileInput.value = '';
        show(context.doms.loadFileInput);
        show(context.doms.loadFileLbl);
        show(context.doms.fileDropZone);
        return this;
      },

      switchToEditMode : function() {
        hide(context.doms.fileDropZone)
        hide(context.doms.loadFileInput)
        hide(context.doms.loadFileLbl)
        return this;
      }

    };

  })(); /* mnu */

  /*
   * APPLICATION
   */

  var app = (function() {

    var doms = {
        newProjectBtn : $('new-project'),
        fileDropZone : $('file-drop-zone'),
        loadFileLbl : $('load-file-lbl'),
        loadFileInput : $('load-file')
    },
    mnuHandlers = {

      onNewProject : function() {
        if (!mdl.isModified() || confirm('Discard all changes?')) {
//          ftr.reset();
//          wks.reset();
//          tls.reset();
          mnu.reset();
          mdl.reset();
        }
      },

      onNewFiles : function(files) {
        var selFile = files[0];
        if (0 === files.length) {
//          ftr.reset();
        } else if (1 < files.length) {
//          ftr.error(null);
        } else if (mdl.setFile(selFile)) {
          mnu.switchToEditMode();
//          ftr.info(selFile);
//          wks.load(selFile);
        } else {
//          ftr.error(selFile);
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

    mnu.init(doms, mnuHandlers);

  })(); /* app */

})(); /* bit */
