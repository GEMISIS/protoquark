var Vector3 = THREE.Vector3

// Convert map point (2d) to world 3d point
function convert2Dto3D(point, y, canvasDimensions, gradient) {
  gradient = gradient || .05
  return new Vector3((point.x - canvasDimensions.x / 2) * gradient, y, (point.y - canvasDimensions.y / 2) * gradient)
}

function buildGeometry(map, geometry, width, height) {
  var sections = map.sections
    , v = 0
    , f = 0
    , vertices = geometry.vertices
    , faces = geometry.faces
    , canvasDimensions = {x: width, y: height}
    , noFloorWallY = map.noFloorWallY
    , noCeilingWallY = map.noCeilingWallY

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
    for (var j = 1; j < points.length - 1; j++) {
      vertices[v++] = convert2Dto3D(points[0], floorHeight, canvasDimensions)
      vertices[v++] = convert2Dto3D(points[j], floorHeight, canvasDimensions)
      vertices[v++] = convert2Dto3D(points[j + 1], floorHeight, canvasDimensions)

      faces[f++].color.setHex(floorColor)
    }

    // draw outside walls of floor, if below 0, invert order. Use lines. Always faces out
    if (floorHeight != noFloorWallY) {
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
    for (var j = 1; j < points.length - 1; j++) {
      vertices[v++] = convert2Dto3D(points[0], ceilingHeight, canvasDimensions)
      vertices[v++] = convert2Dto3D(points[j + 1], ceilingHeight, canvasDimensions)
      vertices[v++] = convert2Dto3D(points[j], ceilingHeight, canvasDimensions)

      faces[f++].color.setHex(ceilingColor)
    }

    // draw outside walls of ceiling
    if (ceilingHeight != noCeilingWallY) {
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

  // Zero out the rest.
  var zero = new Vector3(0, 0, 0)
  for (; v < vertices.length; v++) {
    vertices[v] = zero
  }

  geometry.computeFaceNormals()
  geometry.verticesNeedUpdate = true
  geometry.colorsNeedUpdate = true
}

module.exports = buildGeometry
