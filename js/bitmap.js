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

  /*
   * FIGURE MAPPER
   */

  class Figure {

    constructor(fig, shape, props) {
      this.fig = fig;
      this.htmlString = '';
      if (!fig.hasBonds()) {
        props = props || fig.getAreaProperties();
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

  /*
   * RECTANGLE MAPPER
   */

  class Rectangle extends Figure {

    constructor(fig, props) {
      super(fig, shapes.RECTANGLE, props);
    }

    getCoords() {
      let c = fig.getCoords();
      return c.x + ', ' + c.y + ', '
        + (c.x + c.width) + ', ' + (c.y + c.height); 
    }

  }

  /*
   * CIRCLE MAPPER
   */

  class Circle extends Figure {

    constructor(fig, props) {
      super(fig, shapes.CIRCLE, props);
    }

    getCoords() {
      let c = fig.getCoords();
      return c.x + ', ' + c.y + ', ' + c.r;
    }

  }

  /*
   * POLYGON MAPPER
   */

  class Polygon extends Figure {

    constructor(fig, props) {
      super(fig, shapes.POLYGON, props);
    }

    getCoords() {
      return fig.getPoints().map(e => e.x + ', ' + e.y).join(', ');
    }

  }

  /*
   * GRID MAPPER
   */

  class Grid {

    constructor(fig, props, fCreate) {
      let n, props, ptn;
      ptn = '/[#]/gm';
      this.htmlString = fig.getElts().reduceRight((a,e,i) => {
        props = fig.getAreaProperties();
        n = i.toString();
        if (props[properties.HREF])   props[properties.HREF]  = props[properties.HREF].replace(ptn, n) 
        if (props[properties.ALT])    props[properties.ALT]   = props[properties.ALT].replace(ptn, n) 
        if (props[properties.TITLE])  props[properties.TITLE] = props[properties.TITLE].replace(ptn, n) 
        return a + fCreate(e, props).getHTMLString()
      }, '');
    }

    getHTMLString() {
      return this.htmlString;
    }

  }

  /*
   * MAPPER
   */

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

  function create(fig, props) {
    if(!fig || null == fig) return null;
    let figMap = factory[fig.getType()];
    if (!figMap) {
      console.log('ERROR - Editor mode not handled');
      return null;
    }
    return new figMap(fig, props, create);
  }

  class Mapper {

    constructor() {}

    getInnerString(areas) {
      return areas.reduceRight((a,e) => a + create(e).getHTMLString(), '');
    }

  }

  return {
    properties, Mapper
  };

})(); /* BIT Map Area Definitions */
