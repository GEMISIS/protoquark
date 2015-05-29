var Box = require("./math").box
var math = require("./math")
var Vector3 = math.vec3
var Plane = math.plane
var Triangle = math.triangle

// vel is unnormalized
function getCollidedPos(spherePos, vel, tris) {
  if (vel.lengthSq() < Number.EPSILON) return spherePos

  var newPos = new Vector3().copy(spherePos)
    , newVel = new Vector3().copy(vel)
    , touchPoint = new Vector3()
    , touchSpherePoint = new Vector3()
    , temp = new Vector3()
    , slidePlane = new Plane()
    , endPos = new Vector3()

  for (var i = 0; i < 10; i++) {
    endPos.addVectors(newPos, newVel)

    var info = getCollision(newPos, newVel, tris)
    if (!isFinite(info.t)) return endPos

    touchPoint.copy(info.collisionPoint)
    touchSpherePoint.addVectors(newPos, temp.copy(newVel).multiplyScalar(info.t))

    var slideNormal = new Vector3().subVectors(touchSpherePoint, touchPoint)
    slidePlane.setFromNormalAndCoplanarPoint(slideNormal, touchPoint)
    var endTouchPoint = new Vector3().addVectors(endPos, new Vector3().copy(slidePlane.normal).multiplyScalar(-slidePlane.distanceToPoint(endPos)))

    // Can modify
    newPos.copy(touchSpherePoint).add(slideNormal.multiplyScalar(Number.EPSILON))
    newVel.subVectors(endTouchPoint, touchPoint)
  }

  touchSpherePoint.addVectors(newPos, newVel)
  return touchSpherePoint
}

// Returns time of impact from a swept sphere against a polygon soup
// Note that collisionPoint is point on triangle that sphere collides with and t is point it takes for sphere
// to touch so p + v*getCollision().t != getCollision().collisionPoint
function getCollision(spherePos, vel, tris) {
  var plane = new Plane()
    , cb = new Vector3()
    , ab = new Vector3()
    , temp = new Vector3()
    , velNorm = new Vector3(vel.x, vel.y, vel.z).normalize()
    , collisionPoint = new Vector3()
    , collision = false
    , timeOfImpact = Number.POSITIVE_INFINITY
    , invVelNorm = new Vector3().copy(velNorm).negate()

  for (var i = 0; i < tris.length; i++) {
    var tri = tris[i]
    var triCollision = false
    ab.subVectors(tri.a, tri.b).normalize()
    cb.subVectors(tri.c, tri.b).normalize()

    var normal = temp.crossVectors(cb, ab).normalize()
    plane.set(normal, -normal.dot(tri.a))

    var velDotNormal = invVelNorm.dot(normal)
    if (velDotNormal < 0) continue

    var parallel = velDotNormal <= Number.EPSILON
    if (parallel && plane.distanceToPoint(spherePos) >= 1 + Number.EPSILON) continue

    if (!parallel) {
      var collisions = getTCollisions(plane, spherePos, vel)
      var t0 = Math.min(collisions.t0, collisions.t1)
      var t1 = Math.max(collisions.t0, collisions.t1)

      if (t0 > 1 || t1 < 0) continue

      collisionPoint.addVectors(spherePos, new Vector3().copy(vel).multiplyScalar(t0).sub(plane.normal))
      if (math.isInside(collisionPoint, tri) && t0 < timeOfImpact) {
        collision = triCollision = true
        timeOfImpact = t0
      }
    }

    if (!triCollision) {
      // Try edges and vertices if not on face
      var collisionInfos = [getTCollisionOnVertices(tri, spherePos, vel), getTCollisionOnEdges(tri, spherePos, vel)]

      for (var j = 0; j < 2; j++) {
        var info = collisionInfos[j]
        if (!isFinite(info.t) || info.t > timeOfImpact) continue

        collision = triCollision = true
        timeOfImpact = info.t
        collisionPoint = info.collisionPoint
      }
    }
  }

  return {
    collisionPoint: collisionPoint,
    t: collision ? timeOfImpact : Number.POSITIVE_INFINITY
  }
}

function getTCollisions(plane, spherePos, vel) {
  var dotVel = plane.normal.dot(vel)
  return {
    t0: (1 - plane.distanceToPoint(spherePos)) / dotVel,
    t1: (-1 - plane.distanceToPoint(spherePos)) / dotVel
  }
}

function getTCollisionOnVertices(tri, spherePos, vel) {
  var collision = false
    , collisionPoint

  var a = vel.lengthSq()
  var t = 1
  var temp = new Vector3()
  var pointToSphere = new Vector3()
  var points = [tri.a, tri.b, tri.c]

  for (var i = 0; i < 3; i++) {
    var point = points[i]
    pointToSphere.subVectors(spherePos, point)

    var b = 2 * vel.dot(pointToSphere)
    var c = pointToSphere.lengthSq() - 1

    var timeOfImpact = math.getLowestPositiveRoot(a, b, c, t)
    if (!isFinite(timeOfImpact)) continue

    t = timeOfImpact
    collision = true
    collisionPoint = point
  }

  return {
    collisionPoint: collisionPoint,
    t: collision ? t : Number.POSITIVE_INFINITY
  }
}

function getTCollisionOnEdges(tri, spherePos, vel) {
  var collision = false
    , collisionPoint = new Vector3()

  var t = 1
  var points = [tri.a, tri.b, tri.c]

  for (var i = 0; i < 3; i++) {
    var point = points[i]
    var edge = new Vector3().subVectors(points[(i + 1) % 3], points[i % 3])

    var edgeLenSq = edge.lengthSq()

    var sphereToPoint = new Vector3().subVectors(point, spherePos)

    var edgeDotVel = edge.dot(vel)
    var edgeDotSphereToTri = edge.dot(sphereToPoint)

    var a = edgeLenSq * -vel.lengthSq() + edgeDotVel * edgeDotVel
    var b = edgeLenSq * 2 * vel.dot(sphereToPoint) - 2 * edgeDotVel * edgeDotSphereToTri
    var c = edgeLenSq * (1 - sphereToPoint.lengthSq()) + edgeDotSphereToTri * edgeDotSphereToTri

    var timeOfImpact = math.getLowestPositiveRoot(a, b, c, t)
    if (!isFinite(timeOfImpact)) continue

    var f = (edgeDotVel * timeOfImpact - edgeDotSphereToTri) / edgeLenSq
    if (f < 0 || f > 1) continue

    t = timeOfImpact
    collision = true
    collisionPoint.copy(point).add(edge.multiplyScalar(f))
  }

  resultingCollisionPoint = collisionPoint;

  return {
    collisionPoint: collisionPoint,
    t: collision ? t : Number.POSITIVE_INFINITY
  }
}

module.exports = {
  getCollidedPos: getCollidedPos,

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
      invEnterZ = boxB.z - (boxA.z + boxA.d)
      invExitZ = (boxB.z + boxB.d) - boxA.z
    }
    else {
      invEnterZ = (boxB.z + boxB.d) - boxA.z
      invExitZ = boxB.z - (boxA.z + boxA.d)
    }

    var entryX, entryY, entryZ
    var exitX, exitY, exitZ

    if (Math.abs(velocity.x) < Number.EPSILON) {
        entryX = Number.NEGATIVE_INFINITY
        exitX = Number.POSITIVE_INFINITY
    }
    else {
        entryX = invEnterX / velocity.x
        exitX = invExitX / velocity.x
    }

    if (Math.abs(velocity.y) < Number.EPSILON) {
        entryY = Number.NEGATIVE_INFINITY
        exitY = Number.POSITIVE_INFINITY
    }
    else {
        entryY = invEnterY / velocity.y
        exitY = invExitY / velocity.y
    }

    if (Math.abs(velocity.z) < Number.EPSILON) {
        entryZ = Number.NEGATIVE_INFINITY
        exitZ = Number.POSITIVE_INFINITY
    }
    else {
        entryZ = invEnterZ / velocity.z
        exitZ = invExitZ / velocity.z
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
  },
}
