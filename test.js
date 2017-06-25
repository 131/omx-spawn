"use strict";

const Player = require('./');
const path   = require('path');
const sleep = require('nyks/function/sleep');
const cp    = require('child_process');


function mockplayer() {
  var player = new Player();
  player._spawn = function(file_path) {
    return cp.spawn('node', [ path.resolve(__dirname, 'test', 'mock') , file_path] )
  }

  var start = Date.now(), playing, took;
  player.history = [];
  player.on('play', function(file_path) {
    took = Date.now() - start; 
    start = Date.now();
    if(playing)
      player.history.push({playing, took});
    playing = file_path;
  });

  return player;
}







class foo {

  * run() {
    var player = mockplayer();
    player.play(["2000", "1000"]);
      yield sleep(8 * 1000);

    yield player.destroy();
    console.log(player.history)
  }

  * run2() {
    var player = mockplayer();

    player.play(["2000"]);
    yield sleep(1100); yield player.next(); 
    yield sleep(200); yield player.next();
    yield sleep(300); yield player.next();
    yield sleep(400); yield player.next();
    yield sleep(1000);

    yield player.destroy();
    console.log(player.history)
  }



}

module.exports = foo;