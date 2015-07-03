var cp = require('child_process');
var Class = require('uclass');
var fs = require('fs')

var Player = new Class({
  Binds : ['play' , 'swap' , 'kill' , 'load_next' , 'playonce'],
  Implements : [require('events').EventEmitter],

  playlistindex : 0,
  nextduration : null ,
  currentPlaylist : null ,
  first : true ,

  initialize : function(){
    this.front = null;
    this.back  = null;
    this.layer = 2147483643;
  },
  
  playonce : function(file_path){
    console.log('play once !!')
    var self = this ;
    var currentPlaylist  = this.currentPlaylist;
    var currentIndex = this.currentPlaylistIndex;
    if(this.back)
      this.back.inBack = false ;

    var chain = function(child){
        console.log("playing " , file_path);
        self.swap();
        self.load_next(currentPlaylist, {pause : true , loop:true, currentIndex:currentIndex});
    }

    this.load_next(file_path, {pause: false}, chain);
  },
  
  
  play : function(playlist, options, chain){
    console.log('play')
    this.currentPlaylist = playlist ;
    this.currentPlaylistIndex = (options.currentIndex || 0) ;
    this.first = true ;
    this.kill() ;
    this.load_next(playlist, options, chain);
  },

  
  load_next : function(playlist, options, chain){
    var self = this;

  
  if(!playlist)
    return
  
    if(typeof playlist == "string")
      playlist = [playlist];
    if(typeof options == "function"){
      chain = options ; 
      options = {} ;
    }


  if(options.loop)
    options.currentIndex = (options.currentIndex || 0)%playlist.length
  else if(options.currentIndex > playlist.length)
    return;

  self.currentPlaylistIndex = (options.currentIndex || 0) ;

  var file = playlist[self.currentPlaylistIndex];

  var isFirst = self.first ;

  chain = chain || function(child, err){

    var delay = self.front  ? (self.front.duration - (Date.now() - self.front.startTiming)) : 0 ;
    if(isFirst)
      delay = 0 ;
    console.log("will play %s delay %s" , playlist[self.currentPlaylistIndex] , delay)
    self.back.next = setTimeout(function(){
      self.swap() ;
      console.log("playlist : %s playing %s ", self.currentPlaylistIndex, playlist[self.currentPlaylistIndex]) ;
      options.currentIndex++ ;
      self.load_next(playlist, options) ;
    }, delay);
  }
  
  var pause = typeof options.pause !== 'undefined' ? options.pause : true;

  if(this.back)
    clearTimeout(self.back.next);
  this.load(file, chain , pause);
  },

    //at this moment, back is ready, front is ended (maybe)
  swap:function(){
    console.log('swap')

      if(this.back ){
        this.back.startTiming = Date.now();
        if(this.back.pause){
          this.back.togglePause('resum');
        }
      }


      if(this.front){
        this.front.destroy() ;
      }
      this.front = this.back;
      this.front.inBack = false ;
      this.back  = null;
  },
    
    
  kill: function(){
    if(this.front)
      this.front.destroy() ;
    
    if(this.back){
      this.back.inBack = false ;
      this.back.destroy() ;
    }
  },

  
  load: function(file_path , chain , pause){
    console.log('laod')

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


    //start paused
    child.duration  = 0;  

    child.destroy = function(chain){
      child.kill();
    }

    child.inBack = true ;

    child.togglePause = function(f){
        child.pause = !child.pause  ;
        child.stdin.write("p") ;
      }

    child.layer     = this.layer; 
    child.on('close', function(code){
      console.log(file_path + '   end');
      console.log('child process exited with code ' + code);
      console.log("DONE");
      
      if(child.inBack){
        console.log('end prematurely')

        var delay = Math.max(self.front.duration - self.back.duration , 0 ) ;

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
  },
});


module.exports = Player;

