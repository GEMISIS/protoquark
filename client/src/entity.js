var Maths = require("./math").maths
var Matrix4    = require("./math").mat4
var Vector3    = require("./math").vec3
var Quaternion = require("./math").quat

// View interpolation delay as done in Source engine to allow for dropped packets
var INTERPOLATION_DELAY = .2

function Entity(context, id) {
  this.context = context

  this.position = new Vector3()
  this.rotation = new Quaternion()
  this.euler = new Vector3()

  this.id = id

  // ordered array of snapshots based on time with most recent snapshot at end of list.
  this.snapshots = []
}

Entity.prototype = {
  interpolate: function interpolate(time) {
    var snapshot = this.getSnapshot(time - INTERPOLATION_DELAY)
    if (!snapshot || !snapshot.position) return

    this.position = new Vector3(snapshot.position.x, snapshot.position.y, snapshot.position.z)
  },

  getSnapshot: function getSnapshot(time) {
    var snapshots = this.snapshots

    if (!snapshots.length) return

    // Time is more recent than any entry. Return most recent
    if (time > snapshots[snapshots.length - 1].time) 
      return snapshots[snapshots.length - 1];

    // Time is older than any snapshot. Return oldest snapshot
    if (time < snapshots[0].time)
      return snapshots[0]

    // Lerp between snapshots, find lower time first
    for (var i = snapshots.length - 2; i > -1; i--) {
      if (snapshots[i].time < time) {
        // Snapshot between i and i + 1
        var snapshotBefore = snapshots[i]
          , snapshotAfter = snapshots[i + 1]
          , t = (time - snapshotBefore.time) / (snapshotAfter.time - snapshotBefore.time)
          , position = new Vector3(snapshotBefore.x, snapshotBefore.y, snapshotBefore.z).lerp(snapshotAfter, t)
          , rotation = new Quaternion()

        var beforeRotation = new Quaternion(snapshotBefore.rotation.x, snapshotBefore.rotation.y,
          snapshotBefore.rotation.z, snapshotBefore.rotation.w)
        var afterRotation = new Quaternion(snapshotAfter.rotation.x, snapshotAfter.rotation.y,
          snapshotAfter.rotation.z, snapshotAfter.rotation.w)
        Quaternion.slerp(rotation, beforeRotation, afterRotation, t)

        return this.createSnapshot(time, position, rotation)
      }
    }
  },

  createSnapshot: function createSnapshot(time, position, rotation) {
    return {
      time: time,
      // peerjs throws type error function (x, y, z) if using threejs obj created with Vector3
      position : {
        x: position.x,
        y: position.y,
        z: position.z
      },
      rotation: {
        x: rotation.x,
        y: rotation.y,
        z: rotation.z,
        w: rotation.w
      }
    }
  },

  addSnapshot: function addSnapshot(time) {
    var snapshot = this.createSnapshot(time, this.position, this.rotation)
    this.snapshots.push(snapshot)
  },

  updateRotation: function updateRotation() {
    var euler = this.euler

    this.rotation = new Quaternion().multiplyQuaternions(
      new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -euler.y),
      new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -euler.x))
  },

  trimSnapshots: function trimSnapshots() {
    // Remove packets if too many
    var snapshots = this.snapshots
    if (snapshots.length > 50) {
      snapshots.splice(0, snapshots.length - 50)
    }
  }
}

module.exports = Entity
