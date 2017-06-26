"use strict";

const Event = require('eventemitter-co');
const defer = require('nyks/promise/defer');
const guid  = require('mout/random/guid');
const cp    = require('child_process');
const debug    = require('debug')('omx-spawn');

const NEXT_EVENT       = guid(); //private
const START_LOOP_EVENT = guid(); //private
const END_LOOP_EVENT = guid(); //private

class omxspawn extends Event {

  constructor() {


    super();

    this.layer = 2147483643;
    this.playlist = [];
    this.forced   = [];
    this.playlistIndex = 0;
    this.once(START_LOOP_EVENT, this._run, this);
  }


  * _run() {
    if(this.running)  
      return;
    this.running  = true;


    var front = yield this._load(this._shift());
    var next = {ready : defer() };

    var shouldkill = false;
    var shouldJump = null;
    this.on(NEXT_EVENT, function(reject, shouldIkillfront) {
       console.log()
       next.ready[reject]("playonce");
       shouldkill = !!shouldIkillfront;
       shouldJump = reject;
    });

    var paused = true;
    do {
      front.begin();

      console.log("Should pause is", paused);
      next = yield this._load(this._shift(), paused);

      var delay = front.duration - (Date.now() - front.startTiming);
      if(!paused)
        delay = 0;
        
      setTimeout(next.ready.resolve, delay);

      try {
        if(shouldJump)
          next.ready[shouldJump]("playonce");
        yield next.ready;
      } catch(err) {
        if(err == "playonce") {
          if(shouldkill)
            front.destroy();
          shouldkill = false;
          paused     = false;
        }
        next.destroy();
        continue;
      } finally {
        shouldJump = null;
      }

      paused = true;
      setTimeout(front.destroy, 1000);

      front = next;

    } while(this.running);

    this.emit(END_LOOP_EVENT);

    front.destroy();
    next.destroy();
  }



  destroy() {
    this.running = false;
    var defered = defer();
    this.on(END_LOOP_EVENT, defered.resolve);
    return defered;
  }



  playonce(file, shouldkill) {
    this.forced = [file];
    var defered = defer();
    this.once('play', defered.resolve);
    this.emit(NEXT_EVENT, "reject", shouldkill).catch(console.log);
    return defered;
  }

  stop(){
  }

  _shift() {
    if(this.forced.length)
      return this.forced.shift();

    var entry = this.playlist[this.playlistIndex++ % this.playlist.length];
    return entry;
  }

  next() {
    var defered = defer();
    this.once('play', defered.resolve);
    this.emit(NEXT_EVENT, "resolve").catch(console.log);
    return defered;
  }

  play(playlist, shouldkill) {
    this.forced = [];
    if(typeof playlist == "string")
      playlist = [playlist];
    this.playlist = playlist;


    if(this.running){
      this.playlistIndex = 0
      this.emit(NEXT_EVENT, "reject", shouldkill).catch(console.log);
    } else {
      this.emit(START_LOOP_EVENT).catch(console.log);
    }

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
    var self = this;
    var child = this._spawn(file_path);

    var media = {
      guid : guid().substr(0,6),
      pause : false,
      startTiming : null,
      file_path,
      ready : defer(),
      duration  :  0,
      begin : function() {
        if(this.startTiming)
          return;
        console.log("BEGINING", this.file_path, this.guid);
        if(this.pause)
          this.togglePause();
        this.startTiming = Date.now();
        self.emit('play' , this);
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
