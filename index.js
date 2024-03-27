"use strict";

const Events = require('eventemitter-async');
const cp     = require('child_process');

const defer = require('nyks/promise/defer');
const sleep = require('nyks/function/sleep');

const guid  = require('mout/random/guid');

const debug = require('debug')('omx-spawn');

const NEXT_EVENT       = guid(); //private
const EVENT_LOOP_START = guid(); //private
const EVENT_LOOP_END   = guid(); //private


class omxspawn extends Events {

  constructor() {
    super();

    this.layer = 2147483643;
    this.playlist = [];
    this.forced   = [];
    this.playlistIndex = 0;
    this.once(EVENT_LOOP_START, this._run, this);
  }

  async _run() {
    if(this.running)
      return;
    this.running  = true;

    var front;
    try {
      front = await this._load(this._shift());
      this._front = front;
    } catch(err) {

      this.running  = false;
      await sleep(500);
      return await this._run();
    }

    var next = {ready : defer()};

    var shouldkill = false;
    var shouldJump = null;
    this.on(NEXT_EVENT, function(rejectOrResolve, killfront) {
      next.ready[rejectOrResolve]("playonce");
      shouldkill = !!killfront;
      shouldJump = rejectOrResolve;
    });

    var paused = true;
    do {
      front.begin();
      try {
        next = await this._load(this._shift(), paused);
        this._next = next;
      } catch(err) {
        debug(err);
        await sleep(500);
        continue;
      }

      var delay = front.duration - (Date.now() - front.startTiming) - 90;
      if(!paused)
        delay = 0;
      setTimeout(next.ready.resolve, delay);

      try {
        if(shouldJump)
          next.ready[shouldJump]("playonce");
        await next.ready;
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

    this.emit(EVENT_LOOP_END);

    front.destroy();
    next.destroy();
  }


  destroy() {
    this.running = false;
    var defered = defer();
    this.on(EVENT_LOOP_END, defered.resolve);
    return defered;
  }

  playonce(file, shouldkill) {
    this.forced = [file];
    var defered = defer();
    this.once('play', defered.resolve);
    this.emit(NEXT_EVENT, "reject", shouldkill).catch(debug);
    return defered;
  }

  stop() {
    let stopped = this.destroy();
    if(this._front)
      this._front.destroy();
    if(this._next)
      this._next.destroy();
    this.once(EVENT_LOOP_START, this._run, this);
    return stopped;
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
    this.emit(NEXT_EVENT, "resolve").catch(debug);
    return defered;
  }

  play(playlist, shouldkill) {
    this.forced = [];
    if(typeof playlist == "string")
      playlist = [playlist];

    this.playlist = playlist;

    if(this.running) {
      this.playlistIndex = 0;
      this.emit(NEXT_EVENT, "reject", shouldkill).catch(debug);
    } else {
      this.emit(EVENT_LOOP_START).catch(debug);
    }

    var defered = defer();
    this.once('play', defered.resolve);
    return defered;
  }

  _spawn(file_path) {
    var args = ["--no-osd", "-I", "--layer=" + (this.layer--),  file_path];

    return cp.spawn("omxplayer.bin", args);
  }

  _load(file_path, paused) {
    var self = this;
    var child = this._spawn(file_path);

    var media = {
      guid : guid().substr(0, 6),
      pause : false,
      startTiming : null,
      file_path,
      ready : defer(),
      duration  :  0,
      begin : function() {
        if(this.startTiming)
          return;
        if(this.pause)
          this.togglePause();
        this.startTiming = Date.now();
        self.emit('track', this);
        self.emit('play', this.file_path);
      },

      destroy : function() {
        child.kill();
      },

      togglePause : function() {
        this.pause = !this.pause;
        child.stdin.write("p");
      }
    };

    debug("Loading file", media.file_path, media.guid);

    var defered = defer();

    child.on('close', function(code) {
      defered.reject(`child process ${media.guid} exited with code ${code}`);
      media.ready.catch(() => {});
      media.ready.reject();
    });

    if(paused)
      media.togglePause();


    var body = "";// Duration: 00:01:01.07
    var durationMask = new RegExp("Duration:\\s+([0-9]{2}):([0-9]{2}):([0-9]{2})\\.([0-9]{2})");

    var durationReader = function(data) {
      body += data;
      if(!durationMask.test(body))
        return;

      var sp = durationMask.exec(body);
      var time = (Number(sp[1]) * 3600 + Number(sp[2]) * 60 + Number(sp[3]) + Number(sp[4]) / 100) * 1000;
      media.duration = time;

      child.stderr.removeListener('data', durationReader);

      defered.resolve(media);
    };

    child.stderr.on('data', durationReader);
    return defered;
  }
}




module.exports = omxspawn;
