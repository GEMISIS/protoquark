var Maths = require("./math").maths
var Matrix4    = require("./math").mat4
var Vector3    = require("./math").vec3
var Quaternion = require("./math").quat

// View interpolation delay as done in Source engine to allow for dropped packets
// var INTERPOLATION_DELAY = .2 // Static latency value

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
  interpolate: function interpolate(time, delay) {
    var snapshot = this.getSnapshot(time - delay)
    if (!snapshot || !snapshot.position) return

    this.position = new Vector3(snapshot.position.x, snapshot.position.y, snapshot.position.z)
    this.rotation = new Quaternion(snapshot.rotation.x, snapshot.rotation.y, snapshot.rotation.z, snapshot.rotation.w)
    this.control = snapshot.control
  },

  getSnapshot: function getSnapshot(time) {
    var snapshots = this.snapshots

    if (!snapshots.length) {
      return
    }

    // Time is more recent than any entry. Return most recent
    if (time > snapshots[snapshots.length - 1].time)
      return snapshots[snapshots.length - 1]

    // Time is older than any snapshot. Return oldest snapshot
    if (time < snapshots[0].time)
      return snapshots[0]

    // Lerp between snapshots, find lower time first
    for (var i = snapshots.length - 2; i > -1; i--) {
      if (snapshots[i].time < time) {
        // Snapshot between i and i + 1
        var before = snapshots[i]
          , after = snapshots[i + 1]
          , t = (time - before.time) / (after.time - before.time)
          , rotation = new Quaternion()

        var beforePosition = new Vector3(before.position.x, before.position.y, before.position.z)
        var afterPosition = new Vector3(after.position.x, after.position.y, after.position.z)
        var position = new Vector3().copy(beforePosition).lerp(afterPosition, t)

        var beforeRotation = new Quaternion(before.rotation.x, before.rotation.y,
          before.rotation.z, before.rotation.w)
        var afterRotation = new Quaternion(after.rotation.x, after.rotation.y,
          after.rotation.z, after.rotation.w)
        rotation = Quaternion.slerp(beforeRotation, afterRotation, rotation, t)

        // Combine keys that were pressed
        var combinedControls = {}
        var controls = [before.control, after.control]
        for (var i = 0; i < controls.length; i++) {
          var control = controls[i]
          var keys = Object.keys(control)
          for (var j = 0; j < keys.length; j++) {
            var key = keys[j]
            combinedControls[key] = combinedControls[key] || control[key]
          }
        }

        return createSnapshot(time, position, rotation, combinedControls)
      }
    }
  },

  addSnapshot: function addSnapshot(time, control) {
    var snapshot = createSnapshot(time, this.position, this.rotation, control)
    this.snapshots.push(snapshot)
  },

  updateRotation: function updateRotation() {
    var euler = this.euler

    this.rotation = new Quaternion().multiplyQuaternions(
      new Quaternion().setFromAxisAngle(new Vector3(1, 0, 0), -euler.x),
      new Quaternion().setFromAxisAngle(new Vector3(0, 1, 0), -euler.y))
  },

  trimSnapshots: function trimSnapshots() {
    // Remove packets if too many
    var snapshots = this.snapshots
    // Roughly 4 seconds worth of history in case of dropped packets
    if (snapshots.length > 240) {
      snapshots.splice(0, snapshots.length - 240)
    }
  }
}

 function createSnapshot(time, position, rotation, control) {
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
    },
    control: control
  }
}

module.exports = Entity
