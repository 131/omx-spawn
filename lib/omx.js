var cp = require('child_process');
var Class = require('uclass');


var Player = new Class({
  Binds : ['play'],
  Implements : [require('events').EventEmitter],

  playlistindex : 0,

  initialize : function(){
    this.front = null;
    this.back  = null;
  },

  play:function(playlist, options){
    var self = this;
    if(typeof playlist == "string")
      playlist = [playlist];
    if(typeof options == "function")
      options = { chain  : options };
    if(! options.chain )
      options.chain = function(){};

    options.currentIndex = (options.currentIndex || 0)%playlist.length;
    var file = playlist[options.currentIndex ++];

    if(options.loop)
      options.chain = self.play.bind(this, playlist, options);


    this.back = this.load(file, function(err, duration){
      var delay = this.front ? duration : 0;
      setTimeout(function(){
        self.swap();
        options.chain();
      }, delay);
    });

  },

    //at this moment, back is ready, front is ended (maybe)
  swap:function(){
    this.back.stdin.write('p');
    if(this.front)
      this.front.kill();
    this.front = this.back;
    this.back  = null;
  },




  load: function(file_path, chain){
    var args = [
      "--no-osd", "-I", "--layer=2147483643",  file_path
    ];

    var start = Date.now();
    var child = cp.spawn("/usr/bin/omxplayer.bin", args, {
      env: {
        LD_LIBRARY_PATH: "/opt/vc/lib:/usr/lib/omxplayer"
      }
    });

      //start paused
    child.stdin.write("p");

    child.on('close', function(code){
      console.log('child process exited with code ' + code);
      console.log("DONE");
    });

    var foo = "", durationMask = new RegExp("Duration:\\s+([0-9]{2}):([0-9]{2}):([0-9]{2})\.([0-9]{2})");
    child.stderr.on('data', function(data){
      foo += data;
      if(durationMask.test(foo)){
        var sp = durationMask.exec(foo),
            time = Number(sp[1]) * 3600 + Number(sp[2]) * 60 + Number(sp[3]) + Number(sp[4])/100;
        chain(null, time);
      }
    });

    console.log(this.playlist, "Now playing");
    return child;
 },


});


module.exports = Player;

