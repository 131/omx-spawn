"use strict";

const expect = require('expect.js');
const Player = require('./mock');
const sleep = require('nyks/function/sleep');


//check deviation
const dev = function(player, target, deviance) {
  var history = player.history.map(line => line.duration);
  console.log("Checking", history, "against", target, "accepting", deviance);

  for(let step = 0; step < target.length; step++)
    expect(target[step] - history[step]).to.be.within(-deviance[step], deviance[step]);
};

describe("Mock player test", function() {
  this.timeout(20 * 1000);

  it("should test playlist", async () => {

    var player = new Player();


    player.play(["1000", "1300"]);
    await sleep(8 * 1000);
    await player.destroy();
    dev(player, [1000, 1300, 1000, 1300, 1000, 1300], [100, 100, 100, 100, 100, 100]);
  });

  it("should test playlist & next", async () => {
    var player = new Player();

    await player.play(["2000", "1000"]);

    await sleep(1000); await player.next();
    await sleep(3500); await player.next();
    await sleep(1000);  await player.next();

    await player.destroy();

    dev(player, [1000, 1000, 2000, 500, 1000], [100, 100, 100, 250, 100]);
  });


  it("should test playonce", async () => {
    var player = new Player();


    await player.play(["2000"]);
    await sleep(1000);

    player.playonce("3000");
    await sleep(1000);
    await player.playonce("3000");

    await sleep(6 * 1000);
    await player.destroy();

    dev(player, [1500, 1000, 3000, 2000], [500, 100, 100, 100]);
  });

});
