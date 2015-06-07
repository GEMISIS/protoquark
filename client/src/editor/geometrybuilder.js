var Vector3 = THREE.Vector3
var Triangle = THREE.triangle
var SurfaceList = require("./surfacelist")
var convert2Dto3D = require("./coordinates").convert2Dto3D
var zero = new Vector3(0, 0, 0)

function buildSelectionGeometry(selections, geometry, isCeiling, width, height) {
  var vertices = geometry.vertices
    , v = 0
    , canvasDimensions = {x: width, y: height}

  for (var i = 0; i < selections.length; i++) {
    var selection = selections[i]
      , points = selection ? selection.points : null
    if (!selection) continue
    for (var j = 1; j < points.length - 1; j++) {
      var a = points[0]
        , b = isCeiling ? points[j + 1] : points[j]
        , c = isCeiling ? points[j] : points[j + 1]
        , y = isCeiling ? selection.ceilingHeight - .01 : selection.floorHeight + .01

      vertices[v++] = convert2Dto3D(a, y, canvasDimensions)
      vertices[v++] = convert2Dto3D(b, y, canvasDimensions)
      vertices[v++] = convert2Dto3D(c, y, canvasDimensions)
    }
  }

  for (; v < vertices.length; v++) {
    vertices[v] = zero
  }

  geometry.computeFaceNormals()
  geometry.verticesNeedUpdate = true
  geometry.colorsNeedUpdate = true
}

function buildWorldGeometry(map, geometry, width, height) {
  var sections = map.sections
    , v = 0
    , f = 0
    , vertices = geometry.vertices
    , faces = geometry.faces
    , canvasDimensions = {x: width, y: height}
    , noFloorWallY = map.noFloorWallY
    , noCeilingWallY = map.noCeilingWallY
    , blocks = map.blocks
    , sectionSurfaces = new SurfaceList()
    , blockSurfaces = new SurfaceList()

  for (var i = 0; i < sections.length; i++) {
    var section = sections[i]
      , points = section.points
      , edges = section.edges
      , floorHeight = section.floorHeight
      , ceilingHeight = section.ceilingHeight
      , floorColor = section.floorColor
      , wallColor = section.wallColor
      , floorWallColor = section.floorWallColor
      , ceilingColor = section.ceilingColor
      , ceilingWallColor = section.ceilingWallColor

    // draw floor part of floor - start at index 1 and end 1 less then final index for triangulation
    if (section.floor) {
      for (var j = 1; j < points.length - 1; j++) {
        vertices[v++] = convert2Dto3D(points[0], floorHeight, canvasDimensions)
        vertices[v++] = convert2Dto3D(points[j], floorHeight, canvasDimensions)
        vertices[v++] = convert2Dto3D(points[j + 1], floorHeight, canvasDimensions)
        sectionSurfaces.addTri(vertices, v - 3, section.id)

        faces[f++].color.setHex(floorColor)
      }
    }

    // draw outside walls of floor, if below 0, invert order. Use lines. Always faces out
    if (floorHeight != noFloorWallY && section.floor) {
      for (var j = 0; j < points.length - 1; j++) {
        var a = points[j]
          , b = points[j + 1]
          , top = floorHeight > noFloorWallY ? floorHeight : noFloorWallY
          , bottom = floorHeight > noFloorWallY ? noFloorWallY : floorHeight

        vertices[v++] = convert2Dto3D(a, top, canvasDimensions)
        vertices[v++] = convert2Dto3D(a, bottom, canvasDimensions)
        vertices[v++] = convert2Dto3D(b, bottom, canvasDimensions)

        vertices[v++] = convert2Dto3D(a, top, canvasDimensions)
        vertices[v++] = convert2Dto3D(b, bottom, canvasDimensions)
        vertices[v++] = convert2Dto3D(b, top, canvasDimensions)

        faces[f++].color.setHex(floorWallColor)
        faces[f++].color.setHex(floorWallColor)
      }
    }

    // draw ceiling part of ceiling, since looking from below to above, reverse order
    if (section.ceiling) {
      for (var j = 1; j < points.length - 1; j++) {
        vertices[v++] = convert2Dto3D(points[0], ceilingHeight, canvasDimensions)
        vertices[v++] = convert2Dto3D(points[j + 1], ceilingHeight, canvasDimensions)
        vertices[v++] = convert2Dto3D(points[j], ceilingHeight, canvasDimensions)
        sectionSurfaces.addTri(vertices, v - 3, section.id)

        faces[f++].color.setHex(ceilingColor)
      }
    }

    // draw outside walls of ceiling
    if (ceilingHeight != noCeilingWallY && section.ceiling) {
      for (var j = 0; j < points.length - 1; j++) {
        var a = points[j]
          , b = points[j + 1]
          , top = ceilingHeight > noCeilingWallY ? ceilingHeight : noCeilingWallY
          , bottom = ceilingHeight > noCeilingWallY ? noCeilingWallY : ceilingHeight

        vertices[v++] = convert2Dto3D(b, top, canvasDimensions)
        vertices[v++] = convert2Dto3D(a, top, canvasDimensions)
        vertices[v++] = convert2Dto3D(a, bottom, canvasDimensions)

        vertices[v++] = convert2Dto3D(b, top, canvasDimensions)
        vertices[v++] = convert2Dto3D(a, bottom, canvasDimensions)
        vertices[v++] = convert2Dto3D(b, bottom, canvasDimensions)

        faces[f++].color.setHex(ceilingWallColor)
        faces[f++].color.setHex(ceilingWallColor)
      }
    }

    // Draw middle walls if any
    if (section.wall) {
      for (var j = 0; j < edges.length; j++) {
        var edge = edges[j]
        if (edge.length > 1) continue

        vertices[v++] = convert2Dto3D(points[j], ceilingHeight, canvasDimensions)
        vertices[v++] = convert2Dto3D(points[j + 1], ceilingHeight, canvasDimensions)
        vertices[v++] = convert2Dto3D(points[j + 1], floorHeight, canvasDimensions)

        vertices[v++] = convert2Dto3D(points[j], ceilingHeight, canvasDimensions)
        vertices[v++] = convert2Dto3D(points[j + 1], floorHeight, canvasDimensions)
        vertices[v++] = convert2Dto3D(points[j], floorHeight, canvasDimensions)

        faces[f++].color.setHex(wallColor)
        faces[f++].color.setHex(wallColor)
      }
    }
  }

  for (var i = 0; i < blocks.length; i++) {
    var block = blocks[i]
      , points = block.points
      , floorColor = block.floorColor
      , wallColor = block.wallColor
      , ceilingColor = block.ceilingColor
      , bottom = block.y
      , top = bottom + block.height

    // bottom and top
    for (var j = 0; j < points.length - 1; j++) {
      var a = points[0]
        , b = points[j]
        , c = points[j + 1]

      vertices[v++] = convert2Dto3D(a, top, canvasDimensions)
      vertices[v++] = convert2Dto3D(b, top, canvasDimensions)
      vertices[v++] = convert2Dto3D(c, top, canvasDimensions)
      faces[f++].color.setHex(ceilingColor)

      vertices[v++] = convert2Dto3D(a, bottom, canvasDimensions)
      vertices[v++] = convert2Dto3D(c, bottom, canvasDimensions)
      vertices[v++] = convert2Dto3D(b, bottom, canvasDimensions)
      faces[f++].color.setHex(floorColor)

      blockSurfaces.addTri(vertices, v - 3, block.id)
      blockSurfaces.addTri(vertices, v - 6, block.id)
    }

    // sides
    for (var j = 0; j < points.length - 1; j++) {
      var a = points[j]
       , b = points[j + 1]

      vertices[v++] = convert2Dto3D(a, top, canvasDimensions)
      vertices[v++] = convert2Dto3D(a, bottom, canvasDimensions)
      vertices[v++] = convert2Dto3D(b, bottom, canvasDimensions)

      vertices[v++] = convert2Dto3D(a, top, canvasDimensions)
      vertices[v++] = convert2Dto3D(b, bottom, canvasDimensions)
      vertices[v++] = convert2Dto3D(b, top, canvasDimensions)

      faces[f++].color.setHex(wallColor)
      faces[f++].color.setHex(wallColor)
     }
  }

  // Added properties
  geometry.visibleFaces = f
  geometry.visibleVertices = v

  // Zero out the rest.
  for (; v < vertices.length; v++) {
    vertices[v] = zero
  }

  geometry.computeFaceNormals()
  geometry.verticesNeedUpdate = true
  geometry.colorsNeedUpdate = true

  return {
    sectionSurfaces: sectionSurfaces,
    blockSurfaces: blockSurfaces,
    numVertices: geometry.visibleVertices
  }
}

module.exports = {
  buildWorldGeometry: buildWorldGeometry,
  buildSelectionGeometry: buildSelectionGeometry
}

