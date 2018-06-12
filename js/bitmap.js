/**
 * Boardgame image tool (BiT)
 * https://github.com/theksoft/bit
 *
 * Copyright 2017 Herve Retaureau
 * Released under the MIT license
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

  const shapes2areas = {
    rect    : 'rectangle',
    circle  : 'circleCtr',
    poly    : 'polygon'
  };

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
      this._map = this._container = this._image = this._svg = null;
      this._area = null;
    }

    _getInnerString(areas) {
      return areas.reduceRight((a,e) => a + create(e).htmlString, '');
    }

    _getMapAreaString(area) {
      let attrs, sa;
      sa = '';
      if (area.hasAttributes()) {
        attrs = area.attributes;
        for(let i = 0; i < attrs.length; i++)
          sa += ' ' + attrs[i].name + '="' + attrs[i].value + '"';
      }
      return '<area' + sa + ' />';
    }

    _createDynamicMap(string, name) {
      this._image.setAttribute('usemap', '#'+name);
      this._map = document.createElement('map');
      this._map.setAttribute('name', name);
      this._container.appendChild(this._map);
      this._map.innerHTML = string;
    }

    _createDynamicOverlay() {
      const svg = document.createElementNS(bitarea.NSSVG, 'svg');
      this._svg = svg;
      this._container.appendChild(this._svg);
      svg.setAttributeNS(null, 'width', this._image.width+'px');
      svg.setAttributeNS(null, 'height', this._image.height+'px');
      svg.setAttributeNS(null, 'id', 'map-overlay');
    }

    _defineAreaOverlay() {
      let i, list;
      list = this._map.querySelectorAll('area');
      for (i = 0; i < list.length; i++) {
        let a = list[i], s = this._getMapAreaString(a);
        a.addEventListener('click', () => alert(s), false);
        a.addEventListener('mouseenter', () => this._area = bitarea.createFromRecord(Mapper.loadHtmlString(s)[0], this._svg), false);
        a.addEventListener('mouseleave', () => { this._area.remove(); this._area = null; }, false);
      }
      return list;
    }

    displayPreview(container, image, areas, info) {
      this._container = container;
      this._image = image;
      this._createDynamicMap(this._getInnerString(areas), info.name)
      this._createDynamicOverlay();
      this._defineAreaOverlay();
    }

    cancelPreview() {
      if (null !== this._container)
        this._container.removeChild(this._map);
      if (null != this._svg)
        this._container.removeChild(this._svg);
      if (null !== this._image)
        this._image.removeAttribute('usemap');
      this._map = this._container = this._image = this._svg = null;
      this._area = null;
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
      const MAPEXP = /<area([\s\S]*?)(\/>|>)/gmi,
      AREAEXP = {
        shape   : / shape="(rect|circle|poly)"/,
        coords  : / coords="([\d ,]+?)"/,
        HREF    : / href="([\S\s]+?)"/,
        ALT     : / alt="([\S\s]+?)"/,
        TITLE   : / title="([\S\s]+?)"/,
        ID      : / id="([\S\s]+?)"/
      },
      COORDLIM = / ?, ?/;

      let COORDMAP = {
        rect    : function(a) {
          let c, cs;
          cs = a.coords.split(COORDLIM);
          if (4 != cs.length) return false;
          c = {};
          c.x = parseInt(cs[0], 10);
          c.y = parseInt(cs[1], 10);
          c.width = parseInt(cs[2], 10) - c.x;
          c.height = parseInt(cs[3], 10) - c.y;
          a.coords = c;
          return (c.width >= 0 && c.height >= 0);
        },
        circle  : function(a) {
          let c, cs;
          cs = a.coords.split(COORDLIM);
          if (3 != cs.length) return false;
          c = {};
          c.x = parseInt(cs[0], 10);
          c.y = parseInt(cs[1], 10);
          c.r = parseInt(cs[2], 10);
          a.coords = c;
          return (c.r >= 0);
        },
        poly    : function(a) {
          let c, cs, i;
          cs = a.coords.split(COORDLIM);
          if (0 != cs.length % 2) return false;
          c = [];
          for (i=0; i<cs.length / 2; i++)
            c.push({ x : parseInt(cs[2*i], 10), y : parseInt(cs[2*i+1], 10) });
          a.coords = c;
          return true;
        }
      }
  
      let records;
      records = [];
      if (code) {
        while(true) {
          let attrs, result, r;
          attrs = {};
          attrs.properties = {};
          result = MAPEXP.exec(code);
          if (!result) break;
          Object.keys(AREAEXP).forEach(e => {
            r = AREAEXP[e].exec(result[1]);
            if (r) {
              if (properties[e]) {
                attrs.properties[properties[e]] = r[1];
              } else {
                attrs[e] = r[1];
              }
            }
          });
          if (!attrs.shape || !attrs.coords || !Object.values(shapes).includes(attrs.shape)) {
            console.log('ERROR: Missing attributes - "' + result[1] + '"');
            break;
          }
          if (!COORDMAP[attrs.shape](attrs)) {
            console.log('ERROR: Bad coordinates - "' + attrs.coords + '"');
            break;
          }
          attrs.type = shapes2areas[attrs.shape];
          records.push(attrs);
        }
      }
      return records;
    }

  }

  return {
    properties, Mapper
  };

})(); /* BIT Map Area Definitions */
