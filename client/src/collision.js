var Box = require("./math").box
var Vector3 = require("./math").vec3

module.exports = {
  collides: function collides(a, b) {
    var boxA = a.box ? a.box.clone() : new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
    var boxB = b.box ? b.box.clone() : new Box3(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))

    boxA.min.add(a.position)
    boxA.max.add(a.position)
    boxB.min.add(b.position)
    boxB.max.add(b.position)

    return boxA.containsBox(boxB)
  },

  collidesSwept: function collidesSwept(a, b, from, to) {
    var boxA = {
      x: from.x - 1,
      y: from.y - 1,
      z: from.z - 1,
      w: 2,
      h: 2,
      d: 2
    }
    var boxB = {
      x: b.position.x - 1,
      y: b.position.y - 1,
      z: b.position.z - 1,
      w: 2,
      h: 2,
      d: 2
    }

    var velocity = new Vector3().subVectors(from, to)
    // Inverse times
    var invEnterX, invEnterY, invEnterZ
    var invExitX, invExitY, invExitZ

    if (velocity.x > 0) {
      invEnterX = boxB.x - (boxA.x + boxA.w)
      invExitX = (boxB.x + boxB.w) - boxA.x
    }
    else {
      invEnterX = (boxB.x + boxB.w) - boxA.x
      invExitX = boxB.x - (boxA.x + boxA.w)
    }

    if (velocity.y > 0) {
      invEnterY = boxB.y - (boxA.y + boxA.h)
      invExitY = (boxB.y + boxB.h) - boxA.y
    }
    else {
      invEnterY = (boxB.y + boxB.h) - boxA.y
      invExitY = boxB.y - (boxA.y + boxA.h)
    }

    if (velocity.z > 0) {
      invEnterZ = boxB.z - (boxA.z + boxA.d);
      invExitZ = (boxB.z + boxB.d) - boxA.z;
    }
    else {
      invEnterZ = (boxB.z + boxB.d) - boxA.z;
      invExitZ = boxB.z - (boxA.z + boxA.d);
    }

    var entryX, entryY, entryZ
    var exitX, exitY, exitZ

    if (Math.abs(velocity.x) < Number.EPSILON) {
        entryX = Number.NEGATIVE_INFINITY
        exitX = Number.POSITIVE_INFINITY
    }
    else {
        entryX = invEnterX / velocity.x;
        exitX = invExitX / velocity.x;
    }

    if (Math.abs(velocity.y) < Number.EPSILON) {
        entryY = Number.NEGATIVE_INFINITY
        exitY = Number.POSITIVE_INFINITY
    }
    else {
        entryY = invEnterY / velocity.y;
        exitY = invExitY / velocity.y;
    }

    if (Math.abs(velocity.z) < Number.EPSILON) {
        entryZ = Number.NEGATIVE_INFINITY
        exitZ = Number.POSITIVE_INFINITY
    }
    else {
        entryZ = invEnterZ / velocity.z;
        exitZ = invExitZ / velocity.z;
    }

    var entry = Math.max(entryX, entryY)
    entry = Math.max(entry, entryZ)

    var exit = Math.max(exitX, exitY)
    exit = Math.max(exit, exitZ)

    if (entry > exit) return Number.POSITIVE_INFINITY
    if (entryX < 0 && entryY < 0 && entryZ < 0) return Number.POSITIVE_INFINITY
    if (entryX < 0 && (boxA.x + boxA.w < boxB.x || boxA.x > boxB.x + boxB.w)) return Number.POSITIVE_INFINITY
    if (entryY < 0 && (boxA.y + boxA.h < boxB.y || boxA.y > boxB.y + boxB.h)) return Number.POSITIVE_INFINITY
    if (entryZ < 0 && (boxA.z + boxA.d < boxB.z || boxA.z > boxB.z + boxB.d)) return Number.POSITIVE_INFINITY

    return entry
  }
}
