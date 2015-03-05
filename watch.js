#!/usr/bin/env node
var spy = require("eye-spy")
var spawn = require('child_process').spawn

var server

function start(done) {
  if (server) {
    console.log("Restarting server.")
    server.kill()
  }
  else {
    console.log("Starting server.")
  }

  server = spawn("node", ["server.js"], {
    stdio: "inherit",
    env: process.env
  })

  if (done) setTimeout(done, 2000)
}

function build (done) {
  console.log("Building client.")
  builder = spawn("./build.sh", [], { stdio: "inherit" });
  builder.on("close", function (code) {
    done()
  })
}

spy(".", /^server\.js$/, function (path, done){
  start(done)
})

spy(".", /^(client\/src)\/.*\.(json|js|css)$/, function (path, done) {
  build(done)
})

start()