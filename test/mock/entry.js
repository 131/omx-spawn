"use strict";

var duration  = Number(process.argv[2]);
var paused = false;

var destroy;
process.stdin.on('data', function(line) {
  line = ("" + line).trim();

  if(line == "p") {
    if(!paused)
      clearTimeout(destroy);
    else
      destroy = setTimeout(process.exit, duration);

    paused = !paused;
  }

});

var z2 = function(a) {
  return ("00" + Math.floor(a)).substr(-2);
};

var time = new Date(duration);

// Duration: 00:01:01.07
var str = [z2(time.getUTCHours()), ":", z2(time.getUTCMinutes()), ":", z2(time.getUTCSeconds()), ".", z2(time.getUTCMilliseconds() / 10, 2)].join('');

console.error("Duration: ", str);
destroy = setTimeout(process.exit, duration);
