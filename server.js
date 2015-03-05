var express = require("express")
var jade    = require("jade")

var app = express()
app.enable("trust proxy")
app.use(express.static("./client/bin"))
app.use(express.static("./client/assets"))

app.get(/^[^.]*$/, function (req, res) {
  jade.renderFile("./html.jade", {}, function(err, html) {
    if (!err) return res.send(html)
    res.status(503).send("Could not render the page.")
  });
});

app.listen(1337)