var Router = require("./router")

function onRoom (name) {
  console.log("connect to or create room:", name)
}

document.addEventListener("DOMContentLoaded", function (e) {
  // Main entry point.
  console.log("Hello World.")

  var router = new Router()
  router.add("room", /^\/([^\/]+)\/?$/)
  router.on("route:room", onRoom)
  router.listen()
})