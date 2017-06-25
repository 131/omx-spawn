"use strict";

const Event = require('eventemitter-co');
const defer = require('nyks/promise/defer');
const guid  = require('mout/random/guid');
const cp    = require('child_process');
const debug    = require('debug')('omx-spawn');

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

    this.on('next', function(){
      console.log("NEXTING STUFF");
      next.ready.reject();
    })
    do {
      front.begin();
      this.emit('play' , front.file_path);

      try {
        next = yield this._load(this._shift(), true);
        setTimeout(next.ready.resolve, front.duration - (Date.now() - front.startTiming));
        yield next.ready;
      } catch(err) {
        console.log("CATCHING STUFF");
        next.destroy();
        if(this.running)
          continue;
      }

      setTimeout(front.destroy.bind(front), 1000);
      front = next;
    } while(this.running);
  }

  _shift() {
    var entry = this.playlist[this.playlistIndex++ % this.playlist.length];
    return entry;
  }

  next() {
    return this.emit('next').catch(console.log);
  }

  play(playlist) {

    if(typeof playlist == "string")
      playlist = [playlist];
    this.playlist = playlist;

    this.emit('next').catch(console.log);
    this.emit('start').catch(console.log); //first will start all
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