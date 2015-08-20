var Box = require("./math").box
var math = require("./math")
var Vector3 = math.vec3
var Plane = math.plane
var Triangle = math.triangle

// prevent too many allocations each frame
var defaultSphereShape = new Vector3(1, 1, 1)

// vel is unnormalized
var getSweptCollision = (function() {
  var newPos = new Vector3()
    , newVel = new Vector3()
    , touchPoint = new Vector3()
    , touchSpherePoint = new Vector3()
    , temp = new Vector3()
    , slidePlane = new Plane()
    , endPos = new Vector3()
    , maxIterations = 10
    , epsilon = Number.EPSILON * 2
    , collisionPoint = new Vector3()


  return function(spherePos, vel, tris, sphereShape, stick) {
    if (vel.lengthSq() < Number.EPSILON) return { position: spherePos, collision: false }
    sphereShape = sphereShape instanceof Vector3 ? sphereShape : defaultSphereShape

    var collision = false
      , hit
    newPos.copy(spherePos).divide(sphereShape)
    newVel.copy(vel).divide(sphereShape)

    for (var i = 0; i < maxIterations; i++) {
      endPos.addVectors(newPos, newVel)

      var info = getCollision(newPos, newVel, tris, sphereShape)

      if (!isFinite(info.t)) {
        hit = { position: endPos, collision: collision }
        break
      }

      collision = true
      touchPoint.copy(info.collisionPoint)
      // adding this check seems to fix some of the glitches
      if (info.t > epsilon)
        touchSpherePoint.addVectors(newPos, temp.copy(newVel).multiplyScalar(info.t))
      else
        touchSpherePoint.copy(newPos)

      var slideNormal = new Vector3().subVectors(touchSpherePoint, touchPoint).normalize()
      slidePlane.setFromNormalAndCoplanarPoint(slideNormal, touchPoint)
      if (stick) {
        hit = {
          position: newPos.copy(touchSpherePoint).add(slideNormal.multiplyScalar(epsilon)),
          collision: true
        }
        break
      }
      // Projected end point
      var endTouchPoint = new Vector3().addVectors(endPos, new Vector3().copy(slidePlane.normal).multiplyScalar(-slidePlane.distanceToPoint(endPos)))

      // Can modify
      newPos.copy(touchSpherePoint).add(slideNormal.multiplyScalar(epsilon))
      newVel.subVectors(endTouchPoint, touchPoint)
    }

    if (!hit) {
      hit = {
        position: touchSpherePoint.addVectors(newPos, newVel),
        collision: collision
      }
    }

    hit.position.multiply(sphereShape)
    return hit
  }
}())

// Returns time of impact from a swept sphere against a polygon soup
// Note that collisionPoint is point on triangle that sphere collides with and t is point it takes for sphere
// to touch so p + v*getCollision().t != getCollision().collisionPoint
var getCollision = (function() {
  var cb = new Vector3()
    , ab = new Vector3()
    , temp = new Vector3()
    , velNorm = new Vector3()
    , invVelNorm = new Vector3()
    , plane = new Plane()
    , triangle = new Triangle(new Vector3(), new Vector3(), new Vector3())
    , collisionPoint = new Vector3()

  return function(spherePos, vel, tris, sphereShape) {
    var collision = false
      , timeOfImpact = Number.POSITIVE_INFINITY
    velNorm.set(vel.x, vel.y, vel.z).normalize()
    invVelNorm.copy(velNorm).negate()

    for (var i = 0; i < tris.length; i++) {
      var original = tris[i]
        , tri = triangle

      triangle.a.copy(original.a).divide(sphereShape)
      triangle.b.copy(original.b).divide(sphereShape)
      triangle.c.copy(original.c).divide(sphereShape)

      var triCollision = false
      ab.subVectors(tri.a, tri.b).normalize()
      cb.subVectors(tri.c, tri.b).normalize()

      var normal = temp.crossVectors(cb, ab).normalize()
      plane.set(normal, -normal.dot(tri.a))

      var velDotNormal = velNorm.dot(normal)
      if (velDotNormal > Number.EPSILON) continue

      var parallel = velDotNormal <= Number.EPSILON && velDotNormal >= -Number.EPSILON
      if (parallel && plane.distanceToPoint(spherePos) >= 1 + Number.EPSILON) continue

      if (!parallel) {
        var collisions = getTCollisions(plane, spherePos, vel)
        var t0 = Math.min(collisions.t0, collisions.t1)
        var t1 = Math.max(collisions.t0, collisions.t1)

        if (t0 > 1 || t1 < 0) continue
        var tempPoint = new Vector3().addVectors(spherePos, new Vector3().copy(vel).multiplyScalar(t0).sub(plane.normal))
        if (math.isInside(tempPoint, tri) && t0 < timeOfImpact) {
          collision = triCollision = true
          timeOfImpact = t0
          collisionPoint = tempPoint
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
      collisionPoint: collisionPoint.clone(),
      t: collision ? timeOfImpact : Number.POSITIVE_INFINITY,
      collision: collision
    }
  }
}())

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

  resultingCollisionPoint = collisionPoint

  return {
    collisionPoint: collisionPoint,
    t: collision ? t : Number.POSITIVE_INFINITY
  }
}

var getSweptBoxCollision = (function() {
  var triangles = []
    , a = new Vector3()
    , b = new Vector3()
    , c = new Vector3()
    , d = new Vector3()
    , e = new Vector3()
    , f = new Vector3()
    , g = new Vector3()
    , h = new Vector3()
    , corner = new Vector3()

  for (var i = 0; i < 12; i++) triangles.push(new Triangle(new Vector3(), new Vector3(), new Vector3()))

  return function(from, vel, shape, boxPos, boxSize, quat) {
    var width = boxSize.x
      , height = boxSize.y
      , depth = boxSize.z

    a.addVectors(boxPos, corner.set(-width, height, depth).applyQuaternion(quat))
    b.addVectors(boxPos, corner.set(-width, -height, depth).applyQuaternion(quat))
    c.addVectors(boxPos, corner.set(width, -height, depth).applyQuaternion(quat))
    d.addVectors(boxPos, corner.set(width, height, depth).applyQuaternion(quat))
    e.addVectors(boxPos, corner.set(-width, height, -depth).applyQuaternion(quat))
    f.addVectors(boxPos, corner.set(-width, -height, -depth).applyQuaternion(quat))
    g.addVectors(boxPos, corner.set(width, -height, -depth).applyQuaternion(quat))
    h.addVectors(boxPos, corner.set(width, height, -depth).applyQuaternion(quat))

    var index = 0
    triangles[index++].set(a, b, c)
    triangles[index++].set(a, c, d)
    // back
    triangles[index++].set(h, g, f)
    triangles[index++].set(h, f, e)
    // left
    triangles[index++].set(e, f, b)
    triangles[index++].set(e, b, a)
    // right
    triangles[index++].set(d, c, g)
    triangles[index++].set(d, g, h)
    // top
    triangles[index++].set(e, a, d)
    triangles[index++].set(e, d, h)
    // bottom
    triangles[index++].set(b, f, g)
    triangles[index++].set(b, g, c)

    return getSweptCollision(from, vel, triangles, shape, true)
  }
}())

module.exports = {
  getSweptCollision: getSweptCollision,
  getSweptBoxCollision: getSweptBoxCollision,
  getCollision: getCollision,

  collides: (function() {
    var defaultBox = new Box(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
      , boxA = new Box(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))
      , boxB = new Box(new Vector3(-1, -1, -1), new Vector3(1, 1, 1))

    return function(a, b) {
      boxA.copy(a.box ? a.box : defaultBox)
      boxB.copy(b.box ? b.box : defaultBox)
      boxA.min.add(a.position)
      boxA.max.add(a.position)
      boxB.min.add(b.position)
      boxB.max.add(b.position)

      return boxA.isIntersectionBox(boxB)
    }
  }()),

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
