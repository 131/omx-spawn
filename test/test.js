"use strict";

const path = require('path');
const expect = require('expect.js');
const Player = require('../');


var _spawn = function(file_path) {
  return cp.spawn('node', path.resolve(__dirname, 'mock'), [file_path])
}


describe("Mock player test", function() {

  it("should test playlist", function * () {

    var player = new Player();
    player._spawn = _spawn;


    var start = Date.now(), history = [];
    player.on('play', function(file_path) {
      var line = { file_path };
      history.push(line);
      console.log("Got", line);
    });

    player.play(["500", "700" ]);
      yield sleep(8 * 1000);

    yield player.destroy();
    expect(history).to.eql( {
        //{}
    });

  });

  it("should test playlist & next", function * () {
    var player = new Player();
    player._spawn = _spawn;


    var start = Date.now(), history = [];
    player.on('play', function(file_path) {
      history.push({ file_path });
    });

    player.play(["500", "700" ]);
    yield player.next(); yield sleep(100);
    yield player.next(); yield sleep(200);
    yield player.next(); yield sleep(300);
    yield player.next(); yield sleep(400);
      yield sleep(200);

    yield player.destroy();

    expect(history).to.eql( {
       // {}
    });
  });
  

  it("should test playonce", function *() {
    player._spawn = _spawn;

    player.play(["500", "700" ]);
    yield player.next(); 
    yield player.next(); 

    expect(history).to.eql( {
       // {}
    });

    player.playonce("200");
    yield sleep(500);
    yield player.next();
    yield player.next();
    yield player.next();
    expect(history).to.eql( {
      //  {}
    });

  });

});
