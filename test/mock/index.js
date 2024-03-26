"use strict";

const path   = require('path');
const cp    = require('child_process');

const Player = require('../../');


function mockplayer() {
  var player = new Player();
  player._spawn = function(file_path) {
    return cp.spawn('node', [path.resolve(__dirname, 'entry'), file_path]);
  };

  var playing;
  player.history = [];
  player.on('track', function(media) {
    if(playing)
      player.history.push({file_path : playing.file_path, guid : playing.guid, duration : media.startTiming - playing.startTiming});

    playing = media;
  });

  return player;
}


module.exports = mockplayer;
