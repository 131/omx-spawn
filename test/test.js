"use strict";

const expect = require('expect.js');
const Player = require('./mock');
const sleep = require('nyks/function/sleep');


//check deviation
const dev = function(player, target, deviance) {
  var history = player.history.map(line => Math.floor(line.duration / 100));
  console.log("Checking", history, "against", target, "accepting", deviance);

  history.map(function(val, i) {
    expect(target[i] - val).to.be.within(-deviance[i], deviance[i]);
  });
};

describe("Mock player test", function() {
  this.timeout(20 * 1000);

  it("should test playlist", function * () {

    var player = new Player();


    player.play(["1000", "1300"]);
    yield sleep(8 * 1000);

    yield player.destroy();

    dev(player, [10, 13, 10, 13, 10, 13], [0, 0, 0, 0, 0, 0]);
  });

  it("should test playlist & next", function * () {
    var player = new Player();

    yield player.play(["2000", "1000"]);

    yield sleep(1000); yield player.next();
    yield sleep(3500); yield player.next();
    yield sleep(1000);  yield player.next();

    yield player.destroy();

    dev(player, [10, 10, 20, 5, 10], [0, 0, 0, 0, 0]);
  });


  it("should test playonce", function *() {
    var player = new Player();


    yield player.play(["2000"]);
    yield sleep(1000);

    player.playonce("3000");
    yield sleep(1000);
    yield player.playonce("3000");

    yield sleep(6 * 1000);
    yield player.destroy();

    dev(player, [15, 10, 30, 20], [5, 1, 0, 0]);
  });

});
