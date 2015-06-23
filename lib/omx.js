var cp = require('child_process');
var Class = require('uclass');


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

  	var chain = function(child){
  			self.swap();
  			self.load_next(currentPlaylist, {pause : true , loop:true, currentIndex:currentIndex}) ;
  	}

  	this.load_next(file_path, {chain : chain, pause: false});
  },
  
  
  play : function(playlist, options, chain){
  	this.currentPlaylist = playlist ;
  	options.pause = true ;
    this.first = true ;
    this.load_next(playlist, options, chain);
  },

  
  load_next : function(playlist, options, chain){
    var self = this;
	
  if(!playlist)
		return
	
    if(typeof playlist == "string")
      playlist = [playlist];
    if(typeof options == "function")
      options = { chain  : options };	

    self.currentPlaylistIndex = options.currentIndex = (options.currentIndex || 0)
	if(options.loop)
		options.currentIndex = (options.currentIndex || 0)%playlist.length
	else if(options.currentIndex > playlist.length)
		return;

    var file = playlist[options.currentIndex];

	options.chain = chain || options.chain || function(child, err){
		var delay = self.front  ? (self.front.duration - (Date.now() - self.front.startTiming)) : 0 ;
		console.log("will play %s delay %s" , file , delay)
		self.back.next = setTimeout(function(){
			self.swap();
			console.log("playlist : " , self.currentPlaylistIndex)
			self.currentPlaylistIndex = ++options.currentIndex ;
			self.load_next(playlist, options)      
		}, delay);
	}
	
	if(this.back)
		clearTimeout(self.back.next);
	this.load(file, options.chain , options.pause);
  },

    //at this moment, back is ready, front is ended (maybe)
  swap:function(){
  	console.log('swap')

	if(this.back && this.back.pause){
		this.back.stdin.write('p');
	}

	this.back.startTiming = Date.now();

    if(this.front){
      this.front.kill();
	}
    this.front = this.back;
    this.back  = null;
  },
  
  
  kill: function(){
    if(this.front)
      this.front.kill();
    
  	if(this.back)
      this.back.kill();
  	
  },

  
  load: function(file_path , chain , pause){
    this.layer--;
  	if(this.back)
  		this.back.kill();
  	
    
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
  	child.pause = false ;

  	if(pause && !this.first)
  	{
      child.pause = true ;
      child.stdin.write("p") ;
  	}

    this.first = false ;

  	child.layer     = this.layer;	
    child.on('close', function(code){
  	  console.log(file_path + '   end');
      console.log('child process exited with code ' + code);
      console.log("DONE");
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
  		chain(child) ;
      }
    });
  },
});


module.exports = Player;