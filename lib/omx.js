"use strict";

const fs     = require('fs');
const cp     = require('child_process');
const events = require('events');
const debug  = require('debug')('omx');


class Player extends events.EventEmitter {

  constructor(){
    this.front = null;
    this.back  = null;
    this.layer = 2147483643;
    this.playlistindex   = 0;
    this.nextduration    = null ;
    this.currentPlaylist = null ;
    this.first           = true ;
  }

  playonce(file_path){
    debug('play once !!')
    var self = this ;
    var currentPlaylist  = this.currentPlaylist;
    var currentIndex = this.currentPlaylistIndex;
    if(this.back)
      this.back.inBack = false ;

    var chain = function(child){
        debug("playing " , file_path);
        self._swap();
        self._load_next(currentPlaylist, {pause : true , loop:true, currentIndex:currentIndex});
    }

    this._load_next(file_path, {pause: false}, chain);
  }


  play(playlist, options, chain){
    debug('play')
    this.currentPlaylist = playlist ;
    this.currentPlaylistIndex = (options.currentIndex || 0) ;
    this.first = true ;
    this.kill() ;
    this._load_next(playlist, options, chain);
  }


  _load_next(playlist, options, chain){
    var self = this;

    if(!playlist)
      return;

    if(typeof playlist == "string")
      playlist = [playlist];

    if(typeof options == "function"){
      chain = options ;
      options = {} ;
    }

    if(options.loop)
      options.currentIndex = (options.currentIndex || 0)%playlist.length;
    else if(options.currentIndex > playlist.length)
      return;

    self.currentPlaylistIndex = (options.currentIndex || 0) ;

    var file = playlist[self.currentPlaylistIndex];

    var isFirst = self.first ;

    chain = chain || function(child, err){

      var delay = self.front  ? Math.max((self.front.duration - (Date.now() - self.front.startTiming)) - 200) : 0 ;

      if(isFirst)
        delay = 0;

      debug("will play %s delay %s" , playlist[self.currentPlaylistIndex] , delay);

      self.back.next = setTimeout(function(){
        self._swap() ;
        debug("playlist : %s playing %s ", self.currentPlaylistIndex, playlist[self.currentPlaylistIndex]) ;
        options.currentIndex++ ;
        self._load_next(playlist, options) ;
      }, delay);
    }

    var pause = typeof options.pause !== 'undefined' ? options.pause : true;

    if(this.back)
      clearTimeout(self.back.next);
    this._load(file, chain , pause);
  }

    //at this moment, back is ready, front is ended (maybe)
  _swap(){
    debug('swap')

    var self = this ;

    if(this.back ){
      this.back.startTiming = Date.now();
      this.emit('play' , this.back.media_path); 
      if(this.back.pause){
        this.back.togglePause();
      }
    }

    if(this.front)
      setTimeout(self.front.destroy, 1000);

    this.front = this.back;
    this.front.inBack = false;
    this.back  = null;
  }


  kill(chain){
    if(this.front)
      this.front.destroy(chain) ;

    if(this.back){
      this.back.inBack = false ;
      this.back.destroy(chain) ;
    }
  }
  
   stop(chain){
    if(this.front)
      this.front.destroy(chain) ;

    if(this.back){
      this.back.inBack = false ;
      this.back.destroy(chain) ;
    }
  }


  _load(file_path, chain , pause) {
    debug('load')

    var self = this ;

    this.layer--;
    if(this.back)
      this.back.destroy() ;

    var start = Date.now();


    var args = [
      "--no-osd", "-I", "--layer=" + this.layer,  file_path
    ];

    var child = this.back = cp.spawn("/usr/bin/omxplayer.bin", args, {
      env: {
        LD_LIBRARY_PATH: "/opt/vc/lib:/usr/lib/omxplayer"
      }
    });
    
    child.media_path  = file_path;


    var stdinOpen = true ;
    child.stdin.on("close" , function(){
      stdinOpen = false;
    })


    //start paused
    child.duration  = 0;

    child.destroy = function(chain){
      child.kill();
      if(chain)
        chain();
    }

    child.inBack = true ;

    child.togglePause = function(){
        if(stdinOpen){
          child.pause = !child.pause  ;
          child.stdin.write("p") ;
        }
      }

    child.layer     = this.layer;
    child.on('close', function(code){
      debug(file_path + '   end');
      debug('child process exited with code ' + code);
      debug("DONE");

      if(child.inBack){
        debug('end prematurely')

        var delay = self.front ? Math.max(self.front.duration - self.back.duration , 0 ) : 0;

        setTimeout(function(){
          self.currentPlaylistIndex++ ;
          self.playonce(file_path);
        }, delay)
      }
      self.playedOnce = false ;

    });

    var foo = "", durationMask = new RegExp("Duration:\\s+([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]{2})");

    child.stderr.on('data', function(data){

    if(child.duration)
      return;

    foo += data;
    if(durationMask.test(foo)){
      var sp = durationMask.exec(foo),
          time = (Number(sp[1]) * 3600 + Number(sp[2]) * 60 + Number(sp[3]) + Number(sp[4])/100) * 1000;
      child.duration = time;

      child.pause = false ;

      if(pause && !self.first)
      {
        child.togglePause() ;
      }

      self.first = false ;
      chain() ;
      }
    });
  }
}

module.exports = Player;
