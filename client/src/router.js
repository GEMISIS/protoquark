var emitter = require("component/emitter");

function isSupported () {
  return !!(window.history && window.history.pushState && 
    window.onpopstate !== undefined);
}

function modifyState(state) {
  if (state === undefined) state = {};
  state._time = (new Date()).getTime();
  return state;
}

function onPopState (e) {
  this.repeat(e.state);
};

function Router () {
  this.routes = {};
  this.cbs = {
    pop: onPopState.bind(this)
  };
}

Router.prototype.isSupported = function() {
  return isSupported();
};

Router.prototype.add = function (name, pattern) {
  this.routes[name] = pattern;
};

Router.prototype.remove = function (name) {
  delete this.routes[name];
};

Router.prototype.listen = function () {
  if (isSupported()) {
    setTimeout((function(){
      window.addEventListener("popstate", this.cbs.pop);
    }).bind(this), 100);
  }
  this.listening = true;

  var state = modifyState();
  history.replaceState(this.oldState, state);
  this.oldState = state;
  this.repeat(state);
};

Router.prototype.unlisten = function () {
  delete this.listening;
  window.removeEventListener("popstate", this.cbs.pop);
};

Router.prototype.changePath = function (path, state)  {
  if (!this.listening) return;

  var handled = false;
  for ( var key in this.routes ) {
    var pattern = this.routes[key];
    if ( pattern.test(path) ) {
      handled = true;

      var matches = path.match(pattern);
      var parameters = matches.splice(1, matches.length);
      parameters.forEach(function ( item, index, arr ) {
        arr[index] = item ? unescape(item) : undefined;
      });
      parameters.unshift("route:"+key);
      this.emit.apply(this, parameters);
      parameters.shift();
      this.emit("route", path, state, key, parameters);
    }
  }

  if (!handled) this.emit("lost", path, state);
};

Router.prototype.go = function (path, state, title) {
  if (!isSupported()) return window.location = path;
  state = modifyState(state);
  history.pushState(state, title || "", path);
  this.changePath(path, state);
};

Router.prototype.repeat = function(state) {
  this.changePath(document.location.pathname, state);
};

emitter(Router.prototype);

module.exports = Router;