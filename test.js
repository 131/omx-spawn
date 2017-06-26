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

  var playing;
  player.history = [];
  player.on('play', function(media) {
    if(playing)
      player.history.push({file_path : playing.file_path, guid:playing.guid, duration:media.startTiming - playing.startTiming});

    playing = media;
  });

  return player;
}







class foo {

  * run() {
    var player = mockplayer();
    player.play(["2000", "1000"]);
      yield sleep(6 * 1000);

    yield player.destroy();
    console.log(player.history)
  }

  * run2() {
    var player = mockplayer();

    yield player.play(["2000"]);

    yield sleep(1000); yield player.next();
    yield sleep(1500); yield  player.next();
    yield sleep(500); yield  player.next();

    yield sleep(4 * 1000);

    yield player.destroy();
    console.log(player.history)
  }


  * runonce() {
    var player = mockplayer();

    yield player.play(["2000"]);
    yield player.next();
    yield sleep(1500);

    player.playonce("3000");
    yield sleep(800);
    player.playonce("3000");

    yield sleep(5 * 1000);
    yield player.destroy();
    console.log(player.history)
  }



}

module.exports = foo;