var Vector3 = THREE.Vector3

var math = {
  deg2rad: function deg2rad(deg) {
    return deg * Math.PI / 180
  },

  // http://www.mathopenref.com/coordpolygonarea2.html
  computePointsArea: function computePointsArea(points) {
    var area = 0         // Accumulates area in the loop
      , j = points.length-1  // The last vertex is the 'previous' one to the first

    for (i = 0; i < points.length; i++) {
      area = area +  (points[j].x + points[i].x) * (points[j].y-points[i].y)
      j = i
    }
    return area / 2
  },

  // https://github.com/substack/point-in-polygon
  isPointInside: function isPointInside(point, points) {
    var x = point.x, y = point.y
    var inside = false
    for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
        var xi = points[i].x, yi = points[i].y
        var xj = points[j].x, yj = points[j].y
        // var intersect = ((yi > y) != (yj > y))
        //     && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        var intersect = ((yi >= y) != (yj >= y))
            && (x <= (xj - xi) * (y - yi) / (yj -= yi) + xi)
        if (intersect) inside = !inside;
    }
    return inside;
  },

  isPointInsideXZ: function isPointInsideXZ(point, points) {
    var x = point.x, y = point.z
    var inside = false
    for (var i = 0, j = points.length - 1; i < points.length; j = i++) {
        var xi = points[i].x, yi = points[i].z
        var xj = points[j].x, yj = points[j].z
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
        if (intersect) inside = !inside;
    }
    return inside;
  },

  closestToLine: function closestToLine(a, b, p) {
    var ba = new Vector3().subVectors(b, a)
      , unitBA = ba.clone().normalize()
      , proj = new Vector3().subVectors(p, a).dot(unitBA)
      , t = proj / ba.length()
      , clampedT = Math.max(Math.min(1.0, t), 0.0)
    return {
      t: t,
      point: new Vector3().addVectors(a, ba.multiplyScalar(clampedT)),
    }
  },

  // this gets parallel distance from the infinite line connecting ab
  distanceToLine: function distanceToLine(a, b, p) {
    var n = new Vector3().subVectors(b, a).normalize()
      , ap = new Vector3().subVectors(a, p)
      , proj = ap.dot(n)
    return new Vector3().addVectors(ap, n.multiplyScalar(-proj)).length()
  },

  projectedPointOnLine: function projectedPointOnLine(a, b, p) {
    var n = new Vector3().subVectors(b, a).normalize()
      , pa = new Vector3().subVectors(p, a)
      , proj = pa.dot(n)
    return a.add(n.multiplyScalar(proj))
  },

  projectedTOnLine: function projectedPointOnLine(a, b, p) {
    var n = new Vector3().subVectors(b, a)
      , normalized = new Vector3().copy(n).normalize()
      , pa = new Vector3().subVectors(p, a)
      , proj = pa.dot(normalized)
    return proj / n.length()
  },

  lineIntersection: function lineIntersection(a, b, c, d) {
    // http://stackoverflow.com/questions/2316490/the-algorithm-to-find-the-point-of-intersection-of-two-3d-line-segment
    var da = new Vector3().subVectors(b, a)
      , db = new Vector3().subVectors(d, c)
      , dc = new Vector3().subVectors(c, a)

    if (Math.abs(dc.dot(new Vector3().crossVectors(da, db))) > Number.EPSILON)
      return false

    // check for colinearity
    var t0 = math.projectedTOnLine(a, b, c)
      , t1 = math.projectedTOnLine(a, b, d)
      , t2 = math.projectedTOnLine(c, d, a)
      , t3 = math.projectedTOnLine(c, d, b)
    if ((math.distanceToLine(a, b, c) <= Number.EPSILON && t0 >= 0 && t0 <= 1) ||
        (math.distanceToLine(a, b, d) <= Number.EPSILON && t1 >= 0 && t1 <= 1) ||
        (math.distanceToLine(c, d, a) <= Number.EPSILON && t2 >= 0 && t2 <= 1) || 
        (math.distanceToLine(c, d, b) <= Number.EPSILON && t3 >= 0 && t3 <= 1))
      return true

    // check for non colinear intersection
    var s = new Vector3().crossVectors(dc, db).dot(new Vector3().crossVectors(da, db)) / new Vector3().crossVectors(da, db).lengthSq()
    if (s >= 0 && s <= 1) {
      var collisionPoint = new Vector3().addVectors(a, da.multiplyScalar(s))
      var t = math.projectedTOnLine(c, d, collisionPoint)
      if (t >= 0 && t <= 1) {

      }
    }

    return false
  }
}

module.exports = math