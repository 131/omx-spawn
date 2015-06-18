var Omx = require('.');

var playlist = ['/var/cache/media/4e/a381/4ea381b59889940b18cf0b966b144c39', '/var/cache/media/3a/ea86/3aea86ce941f5bb1ecb1868b82990bfc'];

var player = new Omx();

player.play(playlist, {loop : true});

  //add item to playlist
player.queue(playlist[1], function(){
  player.next();
});

setTimeout(function(){
    //play this video 
  var oldIndex =  player.currrentPlaylistIndex;
  player.play(playlist[1], function(){
    player.play(nextPlaylist, {loop : true, startIndex : oldIndex} );
  });
}, 1000);


setTimeout(player.stop, 10 * 1000);
