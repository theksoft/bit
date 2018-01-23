/**
 * Boardgame image tool (BIT)
 * Copyright 2017 Herve Retaureau
 */

var bitmap = (function() {
  'use strict';

  const properties = {
    HREF  : 'href',
    ALT   : 'alt',
    TITLE : 'title',
    ID    : 'id'
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
      if (!fig.hasBonds() || fig.copyBonds().reduce((a,l) => a && !l.isPatternInGrid(), true)) {
        props = props || fig.areaProperties;
        this.htmlString = '<area shape="' + shape + '" coords="' + this.getCoords() + '"'
          + Object.values(properties).reduce((a,e) => a + (props[e] ? ' ' + e + '="' + props[e] + '"' : ''), '')
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
      let c = this.fig.coords;
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
      let c = this.fig.coords;
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
      return this.fig.getPoints(this.fig.coords).map(e => e.x + ', ' + e.y).join(', ');
    }

  }

  /*
   * GRID MAPPER
   */

  class Grid {

    constructor(fig, p, fCreate) {
      let n, props;
      this.fig= fig;
      this.htmlString = fig.getElts().reduce((a,e,i) => {
        props = fig.areaProperties;
        n = (i+1).toString();
        Grid.specializeProperties(props, n);
        return a + fCreate(e, props).getHTMLString()
      }, '');
    }

    getHTMLString() {
      return this.htmlString;
    }

    static specializeProperties(props, n) {
      let ptn = /\[#\]/gm;
      Object.values(properties).forEach(e => { if (props[e]) props[e] = props[e].replace(ptn, n); });
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
    if (!fig || null == fig) return null;
    let figMap = factory[fig.type];
    if (!figMap) {
      console.log('ERROR - Mapper mode not handled');
      return null;
    }
    return new figMap(fig, props, create);
  }

  class Mapper {

    constructor() {
      this.map = this.container = this.image = null;
    }

    getInnerString(areas) {
      return areas.reduceRight((a,e) => a + create(e).getHTMLString(), '');
    }

    displayPreview(container, image, areas) {
      this.container = container;
      this.image = image;
      this.image.setAttribute('usemap', '#map');
      this.map = document.createElement('map');
      this.map.setAttribute('name', 'map');
      this.container.appendChild(this.map);
      this.map.innerHTML = this.getInnerString(areas);
      let i, list;
      list = this.map.querySelectorAll('area');
      for (i = 0; i < list.length; i++) {
        list[i].addEventListener('click', e => {
          e.preventDefault();
          let output, attrs, sa;
          sa = '';
          if (e.target.hasAttributes()) {
            attrs = e.target.attributes;
            for(let i = 0; i < attrs.length; i++)
              sa += ' ' + attrs[i].name + '="' + attrs[i].value + '"';
          }
          output = '<area' + sa + ' />';
          alert(output);
        }, false);
      }
    }

    cancelPreview() {
      if (null !== this.container)
        this.container.removeChild(this.map);
      if (null !== this.image)
        this.image.removeAttribute('usemap');
      this.map = this.container = this.image = null;
    }

    static specializeProperties(props, n) {
      Grid.specializeProperties(props, n);
    }

  }

  return {
    properties, Mapper
  };

})(); /* BIT Map Area Definitions */
