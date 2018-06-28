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
  }

  const svg2areas = {
    rect    : 'rectangle',
    circle  : 'circleCtr',
    ellipse : 'ellipse',
    polygon : 'polygon'
  }

  /*
   * FIGURE MAPPER
   */

  class Figure {

    constructor(figure, shape, props, xScale, yScale) {
      this._figure = figure
      this._xScale = xScale
      this._yScale = yScale
      this._htmlString = ''
      this._svgString = ''
      if (!figure.hasBonds() || figure.copyBonds().reduce((a,l) => a && !l.isPatternInGrid(), true)) {
        props = props || figure.areaProperties
        this._htmlString = '<area shape="' + shape + '" coords="' + this.coords + '"'
          + Object.values(properties).reduce((a,e) => a + (props[e] ? ' ' + e + '="' + props[e] + '"' : ''), '')
          + ' />'
        this._computeSvgString(props)
      }
    }

    _getIDString(props) {
      return (props[properties.ID] && '' !== props[properties.ID]) ? ' id="' + props[properties.ID] + '"' : ' class="no-id"'
    }

    _computeSvgString(props) {
      console.log('WARNING['+this._figure.type+'] _computeSvgString not defined!')
    }

    get htmlString() {
      return this._htmlString
    }

    get svgString() {
      return this._svgString
    }

  }

  /*
   * RECTANGLE MAPPER
   */

  class Rectangle extends Figure {

    constructor(figure, props, xScale, yScale) {
      super(figure, shapes.RECTANGLE, props, xScale, yScale)
    }

    get coords() {
      let c = this._figure.scaledCoords(this._xScale, this._yScale)
      return c.x + ', ' + c.y + ', '
        + (c.x + c.width) + ', ' + (c.y + c.height)
    }

    _computeSvgString(props) {
      let c = this._figure.coords
      this._svgString = '<rect  x="' + c.x + '" y="' + c.y + '" width="' + c.width + '" height="' + c.height + '"' + this._getIDString(props) + ' />'
    }

  }

  /*
   * CIRCLE MAPPER
   */

  class Circle extends Figure {

    constructor(figure, props, xScale, yScale) {
      super(figure, shapes.CIRCLE, props, xScale, yScale)
    }

    get coords() {
      let c = this._figure.scaledCoords(this._xScale, this._yScale)
      return c.x + ', ' + c.y + ', ' + c.r
    }

    _computeSvgString(props) {
      let c = this._figure.coords
      this._svgString = '<circle  cx="' + c.x + '" cy="' + c.y + '" r="' + c.r + '"' + this._getIDString(props) + ' />'
    }

  }

  /*
   * POLYGON MAPPER
   */

  class Polygon extends Figure {

    constructor(figure, props, xScale, yScale) {
      super(figure, shapes.POLYGON, props, xScale, yScale)
    }

    get coords() {
      return this._figure.getPoints(this._figure.scaledCoords(this._xScale, this._yScale)).map(e => e.x + ', ' + e.y).join(', ')
    }

    _computeSvgString(props) {
      let ps = this._figure.getPoints(this._figure.coords).map(e => e.x + ',' + e.y).join(' ')
      this._svgString = '<polygon  points="' + ps + '"' + this._getIDString(props) + ' />'
    }

  }

  /*
   * ELLIPSE MAPPER
   */

  class Ellipse extends Polygon {

    constructor(figure, props, xScale, yScale) {
      super(figure, props, xScale, yScale)
    }

    _computeSvgString(props) {
      let c = this._figure.coords, rx = Math.round(c.width/2), ry = Math.round(c.height/2)
      this._svgString = '<ellipse  cx="' + (c.x + rx) + '" cy="' + (c.y + ry) + '" rx="' + rx + '" ry="' + ry + '"' + this._getIDString(props) + ' />'
    }

  }

  /*
   * GRID MAPPER
   */

  class Grid {

    constructor(figure, p, xScale, yScale, fCreate) {
      let n, props
      this._figure = figure
      this._htmlString = figure.areas.reduce((a,e,i) => {
        props = figure.areaProperties
        n = (i+1).toString()
        Grid.specializeProperties(props, n)
        return a + fCreate(e, props, xScale, yScale).htmlString
      }, '');
      this._svgString = figure.areas.reduce((a,e,i) => {
        props = figure.areaProperties
        n = (i+1).toString()
        Grid.specializeProperties(props, n)
        return a + fCreate(e, props, xScale, yScale).svgString
      }, '');
    }

    get htmlString() {
      return this._htmlString;
    }

    get svgString() {
      return this._svgString;
    }

    static specializeProperties(props, n) {
      let ptn = /\[#\]/gm
      Object.values(properties).forEach(e => { if (props[e]) props[e] = props[e].replace(ptn, n); })
    }

  }

  /*
   * MAPPER
   */

  const factory = {
    'rectangle'     : Rectangle,
    'square'        : Rectangle,
    'rhombus'       : Polygon,
    'circleCtr'     : Circle,
    'circleDtr'     : Circle,
    'ellipse'       : Ellipse,
    'triangleIsc'   : Polygon,
    'triangleEql'   : Polygon,
    'triangleRct'   : Polygon,
    'hexRct'        : Polygon,
    'hexDtr'        : Polygon,
    'polygon'       : Polygon,
    'gridRectangle' : Grid,
    'gridCircle'    : Grid,
    'gridHex'       : Grid
  }

  function create(figure, props, xScale, yScale) {
    if (!figure || null == figure) return null
    let figMap = factory[figure.type]
    if (!figMap) {
      console.log('ERROR - Mapper mode not handled')
      return null;
    }
    return new figMap(figure, props, xScale, yScale, create)
  }

  class Mapper {

    constructor() {
      this._scale = undefined
      this._map = this._container = this._image = this._svg = null
      this._area = null
    }

    _getInnerString(areas) {
      return areas.reduceRight((a,e) => a + create(e, undefined, this._scale).htmlString, '')
    }

    _getMapAreaString(area) {
      let attrs, sa
      sa = ''
      if (area.hasAttributes()) {
        attrs = area.attributes
        for(let i = 0; i < attrs.length; i++)
          sa += ' ' + attrs[i].name + '="' + attrs[i].value + '"'
      }
      return '<area' + sa + ' />'
    }

    _createDynamicMap(string, name) {
      this._image.setAttribute('usemap', '#'+name)
      this._map = document.createElement('map')
      this._map.setAttribute('name', name)
      this._container.appendChild(this._map)
      this._map.innerHTML = string
    }

    _createDynamicOverlay() {
      let w, h
      const svg = document.createElementNS(bitarea.NSSVG, 'svg')
      this._svg = svg
      this._container.appendChild(this._svg);
      svg.setAttributeNS(null, 'width', this._image.width+'px')
      svg.setAttributeNS(null, 'height', this._image.height+'px')
      svg.setAttributeNS(null, 'id', 'map-overlay')
      // HTML map area already scaled: no need to modify viewBox as SVG area computed from HTML area
    }

    _defineAreaOverlay() {
      let i, list
      list = this._map.querySelectorAll('area')
      for (i = 0; i < list.length; i++) {
        let a = list[i], s = this._getMapAreaString(a)
        a.addEventListener('click', () => alert(s), false)
        a.addEventListener('mouseenter', () => this._area = bitarea.createFromRecord(Mapper.loadHtmlString(s)[0], this._svg), false)
        a.addEventListener('mouseleave', () => { this._area.remove(); this._area = null; }, false)
      }
      return list;
    }

    displayPreview(container, image, scale, areas, info) {
      this._container = container
      this._image = image
      this._scale = scale
      this._createDynamicMap(this._getInnerString(areas), info.name)
      this._createDynamicOverlay()
      this._defineAreaOverlay()
    }

    cancelPreview() {
      if (null !== this._container)
        this._container.removeChild(this._map)
      if (null != this._svg)
        this._container.removeChild(this._svg)
      if (null !== this._image)
        this._image.removeAttribute('usemap')
      this._map = this._container = this._image = this._svg = null
      this._area = null
    }

    static specializeProperties(props, n) {
      Grid.specializeProperties(props, n)
    }

    static getHtmlString(filename, width, height, info, areas, xScale, yScale) {
      let convert = (s) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&gt;&lt;/g, '&gt;<br>&nbsp;&nbsp;&lt;')
      let result = ''
      if (filename && info && areas) {
        if (areas && areas.length > 0) {
          result += convert('<img src="' + filename + '" width="' + width + '" height="' + height + '" alt="' + info.alt + '" usemap="#' + info.name + '" />') + '<br>'
                  + convert('<map name="' + info.name + '">') + '<br>'
          result += areas.reduceRight((a,e) => {
            let r = create(e, undefined, xScale, yScale).htmlString
            return a + (('' == r) ? '' : '&nbsp;&nbsp;' + convert(r) + '<br>')
          }, '')
          result += convert('</map>')
        } else result = '0 areas'
      }
      return result
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
            COORDLIM = / ?, ?/

      let COORDMAP = {
        rect    : function(a) {
          let c, cs
          cs = a.coords.split(COORDLIM)
          if (4 != cs.length) return false
          c = {}
          c.x = parseInt(cs[0], 10)
          c.y = parseInt(cs[1], 10)
          c.width = parseInt(cs[2], 10) - c.x
          c.height = parseInt(cs[3], 10) - c.y
          a.coords = c
          return (c.width >= 0 && c.height >= 0)
        },
        circle  : function(a) {
          let c, cs
          cs = a.coords.split(COORDLIM)
          if (3 != cs.length) return false
          c = {}
          c.x = parseInt(cs[0], 10)
          c.y = parseInt(cs[1], 10)
          c.r = parseInt(cs[2], 10)
          a.coords = c
          return (c.r >= 0)
        },
        poly    : function(a) {
          let c, cs, i
          cs = a.coords.split(COORDLIM)
          if (0 != cs.length % 2) return false
          c = []
          for (i=0; i<cs.length / 2; i++)
            c.push({ x : parseInt(cs[2*i], 10), y : parseInt(cs[2*i+1], 10) })
          a.coords = c
          return true
        }
      }
  
      let records
      records = []
      if (code) {
        while(true) {
          let attrs, result, r
          attrs = {}
          attrs.properties = {}
          result = MAPEXP.exec(code)
          if (!result) break
          Object.keys(AREAEXP).forEach(e => {
            r = AREAEXP[e].exec(result[1])
            if (r) {
              if (properties[e]) {
                attrs.properties[properties[e]] = r[1]
              } else {
                attrs[e] = r[1]
              }
            }
          });
          if (!attrs.shape || !attrs.coords || !Object.values(shapes).includes(attrs.shape)) {
            console.log('ERROR: Missing attributes - "' + result[1] + '"')
            break
          }
          if (!COORDMAP[attrs.shape](attrs)) {
            console.log('ERROR: Bad coordinates - "' + attrs.coords + '"')
            break
          }
          attrs.type = shapes2areas[attrs.shape]
          records.push(attrs)
        }
      }
      return records
    }

    static getSvgString(filename, width, height, info, areas, xScale, yScale) {
      let convert = (s) => s.replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/&gt;&lt;/g, '&gt;<br>&nbsp;&nbsp;&lt;')
      let result = ''
      if (filename && info && areas) {
        if (areas && areas.length > 0) {
          let ws = Math.round(width/xScale), hs = Math.round(height/yScale)
          result += convert('<svg xmlns="http://www.w3.org/2000/svg" width="' + width + '" height="' + height + '" viewBox="0 0 ' + ws + ' ' + hs + '" id="' + info.name + '">') + '<br>'
          result += convert('&nbsp;&nbsp;<image href="' + filename + '" x="0" y="0" width="' + ws + '" height="' + hs + '" />') + '<br>'
          result += areas.reduceRight((a,e) => {
            let r = create(e).svgString
            return a + (('' == r) ? '' : '&nbsp;&nbsp;' + convert(r) + '<br>')
          }, '')
          result += convert('</svg>') + '<br>'
        } else result = '0 areas'
      }
      return result
    }

    static loadSvgString(code) {
      const SVGEXP = /<(rect|circle|polygon|ellipse)([\s\S]*?)(\/>|>)/gmi,
            RECTEXP = {
              x       : / x="([\d]+?)"/,
              y       : / y="([\d]+?)"/,
              width   : / width="([\d]+?)"/,
              height  : / height="([\d]+?)"/
            },
            CIRCLEEXP = {
              cx      : / cx="([\d]+?)"/,
              cy      : / cy="([\d]+?)"/,
              r       : / r="([\d]+?)"/,
            },
            ELLIPSEEXP = {
              cx      : / cx="([\d]+?)"/,
              cy      : / cy="([\d]+?)"/,
              rx      : / rx="([\d]+?)"/,
              ry      : / ry="([\d]+?)"/
            },
            POLYGONEXP = / points="([\d, ]+?)"/,
            IDEXP = / id="([\S\s]+?)"/

      let COORDSVG = {
        rect : function(s,a) {
          a.coords = {}
          Object.keys(RECTEXP).forEach(e => {
            let r = RECTEXP[e].exec(s)
            if (r) a.coords[e] = parseInt(r[1], 10)
          });
          if (!a.coords.width || !a.coords.height)
            return false
          a.coords.x = a.coords.x || 0
          a.coords.y = a.coords.y || 0
          return true
        },
        circle : function(s,a) {
          a.coords = {}
          Object.keys(CIRCLEEXP).forEach(e => {
            let r = CIRCLEEXP[e].exec(s)
            if (r) a.coords[e] = parseInt(r[1], 10)
          });
          if (!a.coords.r)
            return false
          a.coords.x = a.coords.cx || 0
          a.coords.y = a.coords.cy || 0
          a.coords.r = a.coords.r
          return true
        },
        ellipse : function(s,a) {
          a.coords = {}
          Object.keys(ELLIPSEEXP).forEach(e => {
            let r = ELLIPSEEXP[e].exec(s)
            if (r) a.coords[e] = parseInt(r[1], 10)
          });
          if (!a.coords.rx || !a.coords.ry)
            return false
          a.coords.cx = a.coords.cx || 0
          a.coords.cy = a.coords.cy || 0
          a.coords.x = a.coords.cx - a.coords.rx
          a.coords.y = a.coords.cy - a.coords.ry
          a.coords.width = a.coords.rx * 2
          a.coords.height = a.coords.ry * 2
          return true
        },
        polygon : function(s,a) {
          let pts
          a.coords = POLYGONEXP.exec(s)[1].split(' ').map(s => {
            let r = s.split(',')
            return { x : parseInt(r[0], 10), y : parseInt(r[1], 10) }
          })
          return (a.coords.length > 2)
        }
      }

      let records = []
      while(true) {
        let attrs, result, r
        attrs = {}
        result = SVGEXP.exec(code)
        if (!result) break
        attrs.type = svg2areas[result[1]]
        if (!COORDSVG[result[1]](result[2], attrs)) {
          console.log('ERROR: Bad coordinates - "' + attrs.coords + '"')
          break
        }
        r = IDEXP.exec(result[2])
        if (r) {
          attrs.properties = {}
          attrs.properties[properties.ID] = r[1]
        }
        records.push(attrs)
      }
      return records
    }

  }

  const testHTMLMap =
    '<!DOCTYPE html>\n'+
    '<html>\n'+
    '<head>\n'+
    '  <meta charset="UTF-8">\n'+
    '  <title>BiT HTML Map Test</title>\n'+
    '  <!-- https://github.com/theksoft/bit -->\n'+
    '</head>\n'+
    '<body>\n\n'+
    '  <style>\n'+
    '    .which {\n'+
    '      font-size: 12px; font-weight: bold;\n'+
    '      position: fixed; bottom: 20px; left: 20px;\n'+
    '      background-color: rgba(255,255,255,0.3);\n'+
    '      border: 1px dashed; padding: 2px;\n'+
    '      pointer-events: none;\n'+
    '    }\n'+
    '  </style>\n\n'+
    '  <div class="which">- none -</div>\n\n'+
    '<####>\n\n'+
    '  <script>\n'+
    '    function getAreaString(area) {\n'+
    '      let j, s = ""\n'+
    '      if (area.hasAttributes()) {\n'+
    '        s = "<area"\n'+
    '        for(let j = 0; j < area.attributes.length; j++)\n'+
    '          s += " " + area.attributes[j].name + "=\'" + area.attributes[j].value + "\'"\n'+
    '        s += " />"\n'+
    '      }\n'+
    '      return s\n'+
    '    }\n\n'+
    '    const areas = document.querySelectorAll("area"),\n'+
    '          which = document.querySelector(".which")\n'+
    '    for (let i = 0; i < areas.length; i++) {\n'+
    '      areas[i].onclick = e => alert(getAreaString(e.target))\n'+
    '      areas[i].onmouseenter = e => which.innerText = getAreaString(e.target)\n'+
    '      areas[i].onmouseleave = e => which.innerText = "- none -"\n'+
    '    }\n'+
    '  </script>\n\n'+
    '</body>\n'+
    '</html>\n'
  
  const testSVGMap =
    '<!DOCTYPE html>\n'+
    '<html>\n'+
    '<head>\n'+
    '  <meta charset="UTF-8">\n'+
    '  <title>BiT SVG Map Test</title>\n'+
    '  <!-- https://github.com/theksoft/bit -->\n'+
    '</head>\n'+
    '<body>\n\n'+
    '  <style>\n'+
    '    svg {\n'+
    '      fill: #eef; fill-opacity: 0;\n'+
    '      display: block;\n'+
    '    }\n'+
    '    rect:hover, circle:hover, ellipse:hover, polygon:hover {\n'+
    '      fill-opacity: 0.3;\n'+
    '    }\n'+
    '    .no-id:hover {\n'+
    '      fill: #f00; fill-opacity: 0.3;\n'+
    '    }\n'+
    '    .which {\n'+
    '      font-size: 12px; font-weight: bold;\n'+
    '      position: fixed; bottom: 20px; left: 20px;\n'+
    '      background-color: rgba(255,255,255,0.3);\n'+
    '      border: 1px dashed; padding: 2px;\n'+
    '      pointer-events: none;\n'+
    '      z-index: 1;\n'+
    '    }\n'+
    '  </style>\n\n'+
    '  <div class="which">- none -</div>\n\n'+
    '<####>\n\n'+
    '  <script>\n'+
    '    function getAreaString(area) {\n'+
    '      let j, s = ""\n'+
    '      if (area.hasAttributes()) {\n'+
    '        s = "<area"\n'+
    '        for(let j = 0; j < area.attributes.length; j++)\n'+
    '          s += " " + area.attributes[j].name + "=\'" + area.attributes[j].value + "\'"\n'+
    '        s += " />"\n'+
    '      }\n'+
    '      return s\n'+
    '    }\n\n'+
    '    const areas = document.querySelectorAll("rect, circle, ellipse, polygon"),\n'+
    '          which = document.querySelector(".which")\n'+
    '    for (let i = 0; i < areas.length; i++) {\n'+
    '      areas[i].onmouseenter = e => which.innerText = (e.target.id) ? "id = " + e.target.id : "ID NOT DEFINED"\n'+
    '      areas[i].onmouseleave = e => which.innerText = "- none -"\n'+
    '    }\n'+
    '  </script>\n\n'+
    '</body>\n'+
    '</html>\n'

  return {
    properties, Mapper, testHTMLMap, testSVGMap
  }

})() /* BIT Map Area Definitions */
