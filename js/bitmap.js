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

    constructor(figure, shape, props) {
      this._figure = figure;
      this._htmlString = '';
      if (!figure.hasBonds() || figure.copyBonds().reduce((a,l) => a && !l.isPatternInGrid(), true)) {
        props = props || figure.areaProperties;
        this._htmlString = '<area shape="' + shape + '" coords="' + this.coords + '"'
          + Object.values(properties).reduce((a,e) => a + (props[e] ? ' ' + e + '="' + props[e] + '"' : ''), '')
          + ' />';
      }
    }

    get htmlString() {
      return this._htmlString;
    }

  }

  /*
   * RECTANGLE MAPPER
   */

  class Rectangle extends Figure {

    constructor(figure, props) {
      super(figure, shapes.RECTANGLE, props);
    }

    get coords() {
      let c = this._figure.coords;
      return c.x + ', ' + c.y + ', '
        + (c.x + c.width) + ', ' + (c.y + c.height); 
    }

  }

  /*
   * CIRCLE MAPPER
   */

  class Circle extends Figure {

    constructor(figure, props) {
      super(figure, shapes.CIRCLE, props);
    }

    get coords() {
      let c = this._figure.coords;
      return c.x + ', ' + c.y + ', ' + c.r;
    }

  }

  /*
   * POLYGON MAPPER
   */

  class Polygon extends Figure {

    constructor(figure, props) {
      super(figure, shapes.POLYGON, props);
    }

    get coords() {
      return this._figure.getPoints(this._figure.coords).map(e => e.x + ', ' + e.y).join(', ');
    }

  }

  /*
   * GRID MAPPER
   */

  class Grid {

    constructor(figure, p, fCreate) {
      let n, props;
      this._figure = figure;
      this._htmlString = figure.areas.reduce((a,e,i) => {
        props = figure.areaProperties;
        n = (i+1).toString();
        Grid.specializeProperties(props, n);
        return a + fCreate(e, props).htmlString
      }, '');
    }

    get htmlString() {
      return this._htmlString;
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

  function create(figure, props) {
    if (!figure || null == figure) return null;
    let figMap = factory[figure.type];
    if (!figMap) {
      console.log('ERROR - Mapper mode not handled');
      return null;
    }
    return new figMap(figure, props, create);
  }

  class Mapper {

    constructor() {
      this._map = this._container = this._image = null;
    }

    getInnerString(areas) {
      return areas.reduceRight((a,e) => a + create(e).htmlString, '');
    }

    displayPreview(container, image, areas, info) {
      this._container = container;
      this._image = image;
      this._image.setAttribute('usemap', '#'+info.name);
      this._map = document.createElement('map');
      this._map.setAttribute('name', info.name);
      this._container.appendChild(this._map);
      this._map.innerHTML = this.getInnerString(areas);
      let i, list;
      list = this._map.querySelectorAll('area');
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
      if (null !== this._container)
        this._container.removeChild(this._map);
      if (null !== this._image)
        this._image.removeAttribute('usemap');
      this._map = this._container = this._image = null;
    }

    static specializeProperties(props, n) {
      Grid.specializeProperties(props, n);
    }

    static getHtmlString(filename, info, areas) {
      let convert = (s) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&gt;&lt;/g, '&gt;<br>&nbsp;&nbsp;&lt;');
      let result = '';
      if (filename && info && areas) {
        if (areas && areas.length > 0) {
          result += convert('<img src="' + filename + '" alt="' + info.alt + '" usemap="#' + info.name + '" />') + '<br>'
                  + convert('<map name="' + info.name + '">') + '<br>';
          result += areas.reduceRight((a,e) => {
            let r = create(e).htmlString;
            return a + (('' == r) ? '' : '&nbsp;&nbsp;' + convert(r) + '<br>');
          }, '');
          result += convert('</map>');
        } else {
          result = '0 areas';
        }
      }
      return result;
    }

    static loadHtmlString(code) {
      let areas = [];
      if (code) {
        console.log('Loading code ...');
      }
      return areas;
    }

  }

  return {
    properties, Mapper
  };

})(); /* BIT Map Area Definitions */
