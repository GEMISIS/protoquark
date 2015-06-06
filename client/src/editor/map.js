var Vector3 = THREE.Vector3
var isPointInside = require("./math").isPointInside
var computePointsArea = require("./math").computePointsArea
var deg2rad = require("./math").deg2rad
var closestToLine = require("./math").closestToLine
var distanceToLine = require("./math").distanceToLine
var emitter = require("component/emitter")
var lineIntersection = require("./math").lineIntersection
//
// 2D representation of the map.
//

// points within pixelTolerance pixels of each other is considered colinear / near
// pixelTolerance MUST be less than grid spacing
var pixelTolerance = 4

function Map() {
  this.sections = []
  this.things = []
  this.blocks = []

  this.nextSectionId = 1
  this.nextBlockId = 1
  this.selectedSections = []

  // Current colors, change to set to next / default color
  this.wallColor = 0x9EACFF
  this.floorColor = 0x4A5CB0
  this.floorWallColor = 0x4A5CB0
  this.ceilingColor = 0x4A5CB0
  this.ceilingWallColor = 0x4A5CB0

  this.noFloorWallY = 0
  this.noCeilingWallY = 10
  this.pixelTolerance = pixelTolerance

  // Enabled or not
  this.floor = this.ceiling = this.wall = true

  // Incomplete points for next sector and block, respectively
  // Set of active, incomplete points that are cleared when they make a complete section
  this.points = []
  this.blockPoints = []
}

Map.prototype = {
  // Set sections from load
  setSections: function setSections(sections) {
    this.sections = sections
    onSectionsLoaded.call(this)
  },

  getClosestOnVertex: function(point) {
    var sections = this.sections
      , closestDistance = Number.POSITIVE_INFINITY
      , closest
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i]
      for (var j = 0; j < section.points.length; j++) {
        var testPoint = section.points[j]
          , distance = point.distanceTo(testPoint)
        if (distance < closestDistance) {
          closestDistance = distance
          closest = testPoint
        }
      }
    }
    return closest
  },

  getClosestOnEdge: function(point) {
    var sections = this.sections
      , closestA
      , closestB
      , closestDistance = Number.POSITIVE_INFINITY
      , pointOnLine

    for (var i = 0; i < sections.length; i++) {
      var section = sections[i]
      for (var j = 0; j < section.edges.length; j++) {
        var a = section.points[j]
          , b = section.points[j + 1]
          , info = closestToLine(a, b, point)
          , distance = distanceToLine(a, b, point)

        if (distance < closestDistance && info.t >= 0 && info.t <= 1) {
          closestA = a
          closestB = b
          closestDistance = distance
          pointOnLine = info.point
        }
      }
    }

    return pointOnLine
  },

  addThing: function addThing(thing) {
    this.things.push(thing)
  },

  deleteThing: function deleteThing(thing) {
    var index = this.things.indexOf(thing)
    if (index > -1) this.things.splice(index, 1)
  },

  deleteBlock: function deleteBlock(block) {
    var index = this.blocks.indexOf(block)
    if (index > -1) this.blocks.splice(index, 1)
  },

  addPoint: function addPoint(point) {
    var points = this.points = this.points || []
    if (!addPointTo(point, points)) return

    // Ended loop of section
    var added = points[points.length - 1]
    addSection.call(this, {
      id: this.nextSectionId++,
      points: points,
      floorHeight: this.noFloorWallY,
      ceilingHeight: this.noCeilingWallY,
      floor: this.floor,
      ceiling: this.ceiling,
      wall: this.wall,
      doubleSidedWalls: false,
      wallColor: this.wallColor,
      floorColor: this.floorColor,
      floorWallColor: this.floorWallColor,
      ceilingWallColor: this.ceilingWallColor,
      ceilingColor : this.ceilingColor
    })

    this.points = null
    this.emit("sectionschanged")
  },

  addBlockPoint: function addBlockPoint(point) {
    var points = this.blockPoints = this.blockPoints || []
    if (!addPointTo(point, points)) return

    // Ended loop of section
    var added = points[points.length - 1]
    addBlock.call(this, {
      id: this.nextBlockId++,
      points: points,
      y: 5,
      height: 1,
      wallColor: this.wallColor,
      floorColor: this.floorColor,
      floorWallColor: this.floorWallColor,
    })

    this.blockPoints = null
    this.emit("sectionschanged")
  },

  findThingUnder: function findThingUnder(point) {
    var things = this.things
      , precision = 16
      , halfPrecision = precision / 2
    for (var i = 0; i < things.length; i++) {
      var thing = things[i]
        , pos = thing.position
      if (point.x >= pos.x - halfPrecision && point.x <= pos.x + halfPrecision &&
        point.y >= pos.y - halfPrecision && point.y <= pos.y + halfPrecision) {
        return thing
      }
    }
    return null
  },

  findBlockUnder: function findBlockUnder(point) {
     var blocks = this.blocks
      , y = Number.NEGATIVE_INFINITY
      , touchedBlock
    for (var i = 0; i < blocks.length; i++) {
      var block = blocks[i]
      if (!isPointInside(point, block.points)) continue

      // higher up should be touched first
      if (block.y > y) {
        touchedBlock = block
        y = block.y
      }
    }

    return touchedBlock
  },

  // find smallest area section underneath x, y
  findSectionUnder: function findSectionUnder(point) {
    var sections = this.sections
      , smallestArea = Number.POSITIVE_INFINITY
      , touchedSection
      , area
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i]
      if (!isPointInside(point, section.points)) continue

      area = computePointsArea(section.points)
      if (area < smallestArea) {
        touchedSection = section
        smallestArea = area
      }
    }

    return touchedSection
  },

  findBlock: function findBlock(id) {
    return find(this.blocks, "id", id)
  },

  findSection: function findSection(id) {
    return find(this.sections, "id", id)
  },

  // Not going to support undo redo since dont want to have to readd id to shared edges after undoing deletion
  deleteSection: function deleteSection(section) {
    if (!section) return false

    var selectedSections = this.selectedSections
      , sections = this.sections
      , index = selectedSections.indexOf(section.id)
      , found = false

    if (index > -1) selectedSections.splice(index, 1)
    for (var i = 0; i < sections.length; i++) {
      if (sections[i] == section) {
        sections.splice(i, 1)
        found = true
        break
      }
    }
    for (var i = 0; i < sections.length; i++) {
      var other = sections[i]
      for (var j = 0; j < other.edges.length; j++) {
        var edges = other.edges[j]
        index = edges.indexOf(section.id)
        if (index > -1) edges.splice(index, 1)
      }
    }
    if (found) mergeUnsharedEdges.call(this)
    return found
  },

  findClosestPoint: function findClosestPoint(x, y, tolerance) {
    var distance = Number.POSITIVE_INFINITY
      , closest = null
      , toleranceSq = tolerance * tolerance
      , sections = this.sections
    for (var i = 0; i < sections.length; i++) {
      var section = sections[i]
      for (var j = 0; j < section.length; j++) {
        var pt = section[j]
        var length = (pt.x - x) * (pt.x - x) + (pt.y - y) * (pt.y - y)
        if (length <= toleranceSq && length < distance) {
          distance = length
          closest = pt
        }
      }
    }
    return closest
  }
}

function getEdgeIntersection(a, b, c, d) {
  // Trying to see if using midpoint instead of checking both points of c and d for colinear is more robust
  //var colinear = isNearColinear(a, b, c) && isNearColinear(a, b, d)
  var colinear = isEdgeNearColinearOther(a, b, c, d)
    , t0 = colinear ? getPointTIntersection(a, b, c) : 0
    , t1 = colinear ? getPointTIntersection(a, b, d) : 0
    , intersection = colinear && (
      (t0 === 0 && t1 > 0) ||
      (t0 === 1 && t1 < 1) ||
      (t1 === 0 && t0 > 0) ||
      (t1 === 1 && t0 < 1) ||
      (t0 > 0 && t0 < 1) ||
      (t1 > 0 && t1 < 1) ||
      (t0 > 1 && t1 < 1) ||
      (t1 > 1 && t0 < 1) ||
      (t0 < 0 && t1 > 0) ||
      (t1 < 0 && t0 > 0)
    )
    // console.log(t0, t1)
  return {
    intersection: intersection,
    t0: t0,
    t1: t1
  }
}

function onSectionsLoaded() {
  for (var i = 0; i < this.sections.length; i++) {
    this.nextSectionId = Math.max(this.nextSectionId, this.sections[i].id + 1)
  }
}

function isNearPoint(a, b) {
  return new Vector3().subVectors(b, a).length() <= pixelTolerance
}

function isEdgeNearColinearOther(a, b, c, d) {
  var midpoint = new Vector3().addVectors(c, d).multiplyScalar(.5)
  var ba = new Vector3().subVectors(b, a)
    , pa = new Vector3().subVectors(d, c)
    , angleLimit = deg2rad(1.0)
    , angle = ba.angleTo(pa)
  // since angle can only be [0, 180], check opposite
  return isNearColinear(a, b, midpoint) && (angle < angleLimit || angle > deg2rad(180) - angleLimit) && lineIntersection(a, b, c, d)
}

function isNearColinear(a, b, point) {
  var ba = new Vector3().subVectors(b, a)
    , pa = new Vector3().subVectors(point, a)
    , cosdeg = Math.cos(deg2rad(6))

  // console.log("Angle", Math.acos(Math.abs(ba.dot(pa)/(ba.length() * pa.length()))) * 180 / Math.PI)
  return pa.lengthSq() <= Number.EPSILON ||
   Math.abs(ba.dot(pa)/(ba.length() * pa.length())) >= cosdeg
}

function getTInPixels(t, a, b) {
  return new Vector3().subVectors(b, a).length() * t
}

function getPointTIntersection(a, b, point) {
  var ba = new Vector3().subVectors(b, a)
    , pa = new Vector3().subVectors(point, a)
    , lenPA = pa.length()
    , lenBA = ba.length()

  if (point.distanceTo(a) <= pixelTolerance) return 0
  if (pa.angleTo(ba) <= deg2rad(90)) return lenPA / lenBA
  else return -lenPA / lenBA
}

function addSectionToAllEdges(edgesOfSection, sectionId) {
  for (var i = 0; i < edgesOfSection.length; i++) {
    addSectionToEdges(edgesOfSection[i], sectionId)
  }
}

function addSectionToEdges(edges, sectionId) {
  if (edges.indexOf(sectionId) == -1)
    edges.push(sectionId)
}

function mergeUnsharedEdges() {
  var sections = this.sections
  for (var i = 0; i < sections.length; i++) {
    var section = sections[i]
      , edges = section.edges
      , points = section.points
    for (var j = 0; j < edges.length - 1; j++) {
      var edge = edges[j]
        , next = edges[j + 1]
      if (!isEdgeNearColinearOther(points[j], points[j + 1], points[j + 1], points[j + 1 + 1]) || 
        edge.length > 1 || next.length > 1)
        continue

      // Otherwise these points are colinear and can be merged since they dont own
      // TODO: need to handle case where it's completely embedded in another,
      edges.splice(j + 1, 1)
      points.splice(j + 1, 1)
      i--
    }
  }
}

// a = edge point of section
// b = edge point of section
// edges = edges of section
// points = points of section
// forwards only applies to split with 1 point. if true, new edge is from (split.points[0] to b) otherwise
// it is from (a to split.points[0])
function splitEdge(edges, edgeIndex, points, forwards, sectionId, split) {
  // NOTE: this needs testing - the removal of split points that are near the points
  // for (var i = 0; i < split.points.length; i++) {
  //   var a = points[edgeIndex]
  //     , b = points[edgeIndex + 1]
  //     , splitPt = split.points[i]
  //   if (isNearPoint(splitPt, a) || isNearPoint(splitPt, b)) {
  //     split.points.splice(i, 1)
  //     i--
  //   }
  // }

  var oldEdgeIds = edges[edgeIndex]
    , mergedEdgeIds = oldEdgeIds.concat([split.sectionId])
  if (split.points.length === 1) {
    var point = split.points[0]
    points.splice(edgeIndex + 1, 0, point)

    // remove edge and replace with 2 edges that would sum up to original edge

    edges.splice(edgeIndex, 1)
    if (forwards) {
      edges.splice(edgeIndex, 0, oldEdgeIds)
      edges.splice(edgeIndex + 1, 0, mergedEdgeIds)
    }
    else {
      edges.splice(edgeIndex, 0, mergedEdgeIds)
      edges.splice(edgeIndex + 1, 0, oldEdgeIds)
    }
  }
  else if (split.points.length === 2) {
    points.splice(edgeIndex + 1, 0, split.points[0], split.points[1])
    // remove edge and replace with 3 edges that would sum up to original edge
    edges.splice(edgeIndex, 1)
    edges.splice(edgeIndex, 0, oldEdgeIds)
    edges.splice(edgeIndex + 1, 0, mergedEdgeIds)
    edges.splice(edgeIndex + 2, 0, oldEdgeIds)
  }
  else {
    console.log("invalid number of splits")
  }
}

function addBlock(block) {
  // Not much special logic for block as opposed to sections
  this.blocks.push(block)
}

// assumes top left is 0, 0 / y growing down
function reversePointsIfClockwise(points) {
  var a = new Vector3().subVectors(points[1], points[0]).normalize()
    , b = new Vector3().subVectors(points[2], points[1]).normalize()
    , c = a.cross(b)
  if (c.z < 0) return points
  var newpoints = []
  for (var i = 0; i < points.length; i++) {
    newpoints[i] = points[points.length - 1 - i]
  }
  return newpoints
}

function addSection(section) {
  // section.edges should be array with length 1 less than points, each array entry should
  // itself be an array with section ids that contains this edge. In the case of a new sector,
  // edge would just be that sector
  var sections = this.sections

  section.points = reversePointsIfClockwise(section.points)
  section.edges = []

  for (var i = 0; i < section.points.length - 1; i++) {
    section.edges.push([
      section.id
    ])
  }

  // Check edges of other sections against new section edges
  for (var i = 0; i < section.edges.length; i++) {
    var a = section.points[i]
      , b = section.points[i + 1]
      , looping = true
      , nonCase1Split = false
      , sectionEdgeIndex = i

    for (var j = 0; j < sections.length && looping; j++) {
      var otherSection = sections[j]

      for (var k = 0; k < otherSection.edges.length; k++) {
        var otherEdgeIndex = k

        if (otherSection.edges[otherEdgeIndex].indexOf(section.id) > -1)
          continue

        var c = otherSection.points[otherEdgeIndex]
          , d = otherSection.points[otherEdgeIndex + 1]
          , info = getEdgeIntersection(c, d, a, b)

        if (!info.intersection) continue

        // In order points to add to respective sections. Each point should have a lower 't' value then next for that edge
        var addedPointsSection = []
        var addedPointsOther = []

        var t0 = Math.min(info.t0, info.t1)
          , t1 = Math.max(info.t0, info.t1)

        console.log("Edge", sectionEdgeIndex, "against", otherEdgeIndex)
        // Case 0: Both edges about equal, no splitting
        if ( (isNearPoint(c, a) && isNearPoint(d, b)) ||
          (isNearPoint(d, a) && isNearPoint(c, b))) {
          console.log("case 0")
          addSectionToEdges(section.edges[sectionEdgeIndex], otherSection.id)
          addSectionToEdges(otherSection.edges[otherEdgeIndex], section.id)
          looping = false
          break
        }
        else if ((t0 >= 0 && t1 <= 1)) {//} ||
          // (Math.abs(getTInPixels(c, d, t0)) <= pixelTolerance && Math.abs(getTInPixels(c, d, t1) - getTInPixels(c, d, 1)) <= pixelTolerance)) {
          console.log("case 1")
          // Case 1: a and b are fully embedded in other sections edge (cd), so only split other section
          // swap if order is inconsistent (this would occur depending on which edge intersects)
          if (info.t0 > info.t1) {
            addedPointsOther.push(b)
            addedPointsOther.push(a)
          }
          else {
            addedPointsOther.push(a)
            addedPointsOther.push(b)
          }

          addSectionToEdges(section.edges[sectionEdgeIndex], otherSection.id)
          splitEdge(otherSection.edges, otherEdgeIndex, otherSection.points, false, otherSection.id, {
            points: addedPointsOther,
            sectionId: section.id
          })

          // If Case 1, then it's fully embedded and we can move on to section's next edge.
          looping = false
          break
        }
        else if (((info.t0 < 0 || info.t0 > 1) && (info.t1 < 0 || info.t1 > 1)) ||
          (isNearPoint(a, d) && info.t1 < 0) || (isNearPoint(b, c) && info.t0 > 1)) {
          console.log("case 2")
          nonCase1Split = true
          // Case 2: c and d are fully embedded in a and b, split edge along a and b of section.
          // check of info.intersection already ensures we can just check for < 0 and > 1
          // Need to find which of c and d come first along ab's edge
          if (getPointTIntersection(a, b, c) < getPointTIntersection(a, b, d)) {
            addedPointsSection.push(c)
            addedPointsSection.push(d)
          }
          else {
            addedPointsSection.push(d)
            addedPointsSection.push(c)
          }

          addSectionToEdges(otherSection.edges[otherEdgeIndex], section.id)
          splitEdge(section.edges, sectionEdgeIndex, section.points, false, section.id, {
            points: addedPointsSection,
            sectionId: otherSection.id
          })
        }
        // Since we already checked fully contained above, there can only be a single point between. a or b between c and d
        else if (info.t0 >= 0 && info.t0 <= 1) {
          console.log("Case 3 a between c d")
          nonCase1Split = true
          // Case 3
          // Add a between c and d to otherSection
          // Add c between a and b to section
          addedPointsOther.push(a)
          addedPointsSection.push(c)

          splitEdge(otherSection.edges, otherEdgeIndex, otherSection.points, false, otherSection.id, {
            points: addedPointsOther,
            sectionId: section.id
          })

          splitEdge(section.edges, sectionEdgeIndex, section.points, false, section.id, {
            points: addedPointsSection,
            sectionId: otherSection.id
          })
        }
        else if (info.t1 >= 0 && info.t1 <= 1) {
          console.log("b between c d case 4")
          nonCase1Split = true
          // Case 4
          // Add b between c and d to otherSection
          // Add d between a and b to section
          addedPointsOther.push(b)
          addedPointsSection.push(d)

          splitEdge(otherSection.edges, otherEdgeIndex, otherSection.points, true, otherSection.id, {
            points: addedPointsOther,
            sectionId: section.id
          })

          splitEdge(section.edges, sectionEdgeIndex, section.points, true, section.id, {
            points: addedPointsSection,
            sectionId: otherSection.id
          })
        }
        else {
          throw new Error("unhandled t0 and t1 values")
        }

        if (nonCase1Split) {
          // Need to recheck edge so decrement i.
          // since a and b should now point to new points / edges if split
          i--
          looping = false
          break
        }
      }
    }
  }

  // Once splits are done, check if section is completely enclosed in any other section.
  // if so, mark every edge in section as being co-owned by other section, but DONT mark
  // othersection edges as owning section. - this is just a semi cheap way to hide all walls
  // if completely self contained
  var insertionIndex = -1
  for (var i = 0; i < sections.length; i++) {
    var other = sections[i]
    if (isSectionInside(section, other)) {
      addSectionToAllEdges(section.edges, other.id)
      console.log("added section inside", other.id)
    }
    else if (isSectionInside(other, section)) {
      insertionIndex = i
      addSectionToAllEdges(other.edges, section.id)
      console.log(other.id, " is inside added section")
    }
  }
  // Finally add section only after checking other section's edges for shared
  if (insertionIndex == -1)
    this.sections.push(section)
  else
    this.sections.splice(insertionIndex, 0, section)
}

function isSectionInside(section, containerSection) {
  for (var i = 0; i < section.points.length; i++) {
    if (!isPointInside(section.points[i], containerSection.points))
      return false
  }
  return true
}

// returns if adding point results in a complete loop
function addPointTo(point, points) {
  var currentPt = point
    , firstPt = points[0]
    , lastPt = points.length > 0 ? points[points.length - 1] : null
    , completeLoop = points.length >= 3 && isNearPoint(currentPt, firstPt)

  // If point added is similar to last, dont add
  if (lastPt && lastPt.x == currentPt.x && lastPt.y == currentPt.y)
    return false

  points.push(completeLoop ? firstPt.clone() : currentPt)
  console.log(points[points.length - 1].x, points[points.length - 1].y)
  return completeLoop
}

emitter(Map.prototype)

function find(array, propName, value) {
  for (var i = 0; i < array.length; i++)
    if (array[i][propName] == value) return array[i]
  return null
}

module.exports = Map
