var Router = require("./router")
var Connection = require("./connection")

function onRoom (name) {
  console.log("connect to or create room:", name)

  window.connection = new Connection(name);
  window.connection.connect()
}

document.addEventListener("DOMContentLoaded", function (e) {
  // Main entry point.
  console.log("Hello World.")

  var router = new Router()
  router.add("room", /^\/([^\/]+)\/?$/)
  router.on("route:room", onRoom)
  router.listen()
})