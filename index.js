"use strict";

const Event = require('eventemitter-co');
const defer = require('nyks/promise/defer');
const guid  = require('mout/random/guid');
const cp    = require('child_process');
const debug    = require('debug')('omx-spawn');

const NEXT_EVENT = guid(); //private
class omxspawn extends Event {

  constructor() {
    super();

    this.layer = 2147483643;
    this.playlist = [];
    this.playlistIndex = 0;
    this.once('start', this._run, this);
  }

  destroy() {
    this.running = false;
    return this.next();
  }

  * _run() {
    if(this.running)  
      return;
    this.running  = true;

    var next = {ready : defer() };
    var front = yield this._load(this._shift());
    var self  = this, skipped = false;
    
    this.on(NEXT_EVENT, function() {
      console.log("Skipping to ", next.guid);
      next.ready.resolve("GOTNEXT"); //this might be an old reference
      skipped = true;
    })

    front.begin();
    this.emit('play' , front);

    do {
      try {
        next = yield this._load(this._shift(), true);
        if(skipped)
          next.ready.resolve("2NSKIP");
        var delay = front.duration - (Date.now() - front.startTiming);
        console.log("Waiting %s for %s (%s after %s startup time)", next.guid, delay, front.duration, front.guid);
        setTimeout(next.ready.resolve, delay, "TIEMOUT");
        var why = yield next.ready;
        skipped = false;
        console.log("Now ready", next.guid, why);
      } catch(err) {
        console.log("CATCHING STUFF", next.guid);
        next.destroy();
        if(this.running)
          continue;
      }

      setTimeout(front.destroy.bind(front), 1000);
      front = next;

      front.begin();
      this.emit('play' , front);
    } while(this.running);
    console.log("ALL DONE");
  }

  _shift() {
    var entry = this.playlist[this.playlistIndex++ % this.playlist.length];
    return entry;
  }

  next() {
    var defered = defer();
    this.once('play', defered.resolve);
    this.emit(NEXT_EVENT).catch(console.log);
    return defered;
  }

  play(playlist) {

    if(typeof playlist == "string")
      playlist = [playlist];
    this.playlist = playlist;

    this.emit('start').catch(console.log);

    var defered = defer();
    this.once('play', defered.resolve);
    return defered;
  }



  _spawn(file_path) {
    var args = ["--no-osd", "-I", "--layer=" + (this.layer--),  file_path];

    return cp.spawn("/usr/bin/omxplayer.bin", args, {
      env: {
        LD_LIBRARY_PATH: "/opt/vc/lib:/usr/lib/omxplayer"
      }
    });
  }

  _load(file_path, paused) {

    var child = this._spawn(file_path);

    var media = {
      guid : guid(),
      pause : false,
      startTiming : null,
      file_path,
      ready : defer(),
      duration  :  0,
      begin : function() {
        this.running = true;
        this.startTiming = Date.now();
      },

      destroy : function() {
        child.kill();
      },

      togglePause : function() {
        this.pause = !this.pause;
        child.stdin.write("p");
      }
    };

    console.log("Loading file ", media.file_path, media.guid);

    var defered = defer();

    child.on('close', function(code) {
      debug('child process %s exited with code ', media.guid, code);
      media.ready.reject();
    });

    if(paused)
      media.togglePause();


    var body = "";
    var durationMask = new RegExp("Duration:\\s+([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]{2})");

    var durationReader = function(data) {
      body += data;
      if(!durationMask.test(body))
        return;

      var sp = durationMask.exec(body);
      var time = (Number(sp[1]) * 3600 + Number(sp[2]) * 60 + Number(sp[3]) + Number(sp[4])/100) * 1000;
      media.duration = time;

      child.stderr.removeListener('data', durationReader);

      defered.resolve(media);
    };

    child.stderr.on('data', durationReader);
    return defered;
  }
}




module.exports = omxspawn;