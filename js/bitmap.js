/**
 * Boardgame image tool (BIT)
 * Copyright 2017 Herve Retaureau
 */

var bitmap = (function() {
  'use strict';

  const properties = {
    HREF  : 'href',
    ALT   : 'alt',
    TITLE : 'title'
  };

  const shapes = {
    DEFAULT   : 'default',
    RECTANGLE : 'rect',
    CIRCLE    : 'circle',
    POLYGON   : 'poly'
  }

  class Figure {

    constructor(fig, shape) {
      this.fig = fig;
      this.htmlString = '';
      if (!fig.hasBonds()) {
        this.htmlString = '<area shape="' + shape + '" coords="' + this.getCoords() + '"'
          + (props[properties.HREF]   ? ' href="'   + props[properties.HREF]  + '"' : '')
          + (props[properties.ALT]    ? ' alt="'    + props[properties.ALT]   + '"' : '')
          + (props[properties.TITLE]  ? ' title="'  + props[properties.TITLE] + '"' : '')
          + ' />';
      }
    }

    getHTMLString() {
      return this.htmlString;
    }

  }

  class Rectangle extends Figure {

    constructor(fig) {
      super(fig, shapes.RECTANGLE);
    }

    getCoords() {
      let c = fig.getCoords();
      return c.x + ', ' + c.y + ', '
        + (c.x + c.width) + ', ' + (c.y + c.height); 
    }

  }

  class Circle extends Figure {

    constructor(fig) {
      super(fig, shapes.CIRCLE);
    }

    getCoords() {
      let c = fig.getCoords();
      return c.x + ', ' + c.y + ', ' + c.r;
    }

  }

  class Polygon extends Figure {

    constructor(fig) {
      super(fig, shapes.POLYGON);
    }

    getCoords() {
      return fig.getPoints().map(e => e.x + ', ' + e.y).join(', ');
    }

  }

  class Grid {

    constructor(fig) {
      this.htmlString = ''; // TODO: All grid elements
    }

    getHTMLString() {
      return this.htmlString;
    }

  }

  var factory = {
    'rectangle'     : Rectangle,
    'square'        : Rectangle,
    'rhombus'       : Polygon,
    'circleCtr'     : Circle,
    'circleDtr'     : Circle,
    'ellipse'       : Polygon,
    'triangleIsc'   : Polygon,
    'triangleEql'   : Polygon,
    'triangleRct'   : Polygon,
    'hexRct'        : Polygon,
    'hexDtr'        : Polygon,
    'polygon'       : Polygon,
    'gridRectangle' : Grid,
    'gridCircle'    : Grid,
    'gridHex'       : Grid
  };

  function create(fig) {
    if(!fig || null == fig) return null;
    let figMap = factory[fig.getType()];
    if (!figMap) {
      console.log('ERROR - Editor mode not handled');
      return null;
    }
    return new figMap(fig);
  }

  class Mapper {

    constructor() {}

    getInnerString(areas) {
      return areas.reduceRight((a,e) => a + create(e).getHTMLString(), '');
    }

  }

  return {
    properties
  };

})(); /* BIT Map Area Definitions */
