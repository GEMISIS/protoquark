var Vector3 = THREE.Vector3

module.exports = {
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
        var intersect = ((yi > y) != (yj > y))
            && (x < (xj - xi) * (y - yi) / (yj - yi) + xi)
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

  distanceToLine: function distanceToLine(a, b, p) {
    var n = new Vector3().subVectors(b, a).normalize()
      , ap = new Vector3().subVectors(a, p)
      , proj = ap.dot(n)
    return new Vector3().addVectors(ap, n.multiplyScalar(-proj)).length()
  },

  // returns time on intersection of line ab and cd
  // http://stackoverflow.com/questions/563198/how-do-you-detect-where-two-line-segments-intersect/565282#565282
  lineIntersection: function lineIntersection(a, b, c, d) {
    var ba = new Vector3().subVectors(b, a)
      , dc = new Vector3().subVectors(d, c)
      , p = a
      , r = ba
      , q = c
      , s = dc
      , rxs = new Vector3().crossVectors(r, s)
      , qpxr = new Vector3().subVectors(q, p).cross(r)
      , qpxs = new Vector3().subVectors(q, p).cross(s)
      , t = qpxr.length() / rxs.length()
      , u = qpxr.length() / rxs.length()
      , t0
      , t1

    if (rxs.length() <= Number.EPSILON && qpxr.length() <= Number.EPSILON) {
      t0 = new Vector3().subVectors(q, p).dot(r) / r.lengthSq()
      t1 = t0 + s.dot(r) / r.lengthSq()
      return t0 >= 0 && t0 <= 1 && t1 >= 0 && t1 <= 1
    }
    else if (rxs.length() > Number.EPSILON) {
      return u >= 0 && u <= 1 && t >= 0 && t <= 1
    }
    return false

  }
}