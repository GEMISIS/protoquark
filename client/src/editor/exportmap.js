//
// Actual exporter that saves it to quack expected format
//

var exportGeometry = require("./geometryExporter")
var convert2Dto3D  = require("./coordinates").convert2Dto3D

function convertThing(thing, dimensions) {
  // console.log(thing)
  return {
    amount: thing.amount,
    position: convert2Dto3D(thing.position, thing.height, dimensions),
    chance: thing.chance,
    type: thing.type
  }
}

function getByType(things, type) {
  return things.filter(function(thing) {
    return thing.type === type
  })
}

module.exports = function exportmap(editor) {
  var things = editor.map.things
    , dimensions = {x: editor.canvas.width, y: editor.canvas.height}

  var things3D = things.map(function (thing) {
    return convertThing(thing, dimensions)
  })

  var obj = {
    collisionVertices: exportGeometry(editor.stage3D.geometry),
    healths: getByType(things3D, "health"),
    ammos: getByType(things3D, "ammo"),
    blocks: [],
    spawns: getByType(things3D, "spawn")
  }

  return JSON.stringify(obj)
}
