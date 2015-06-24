var Omx = require('./lib/omx');

// var playlist = ['/var/cache/activscreen/media/34/23fb/3423fbbb8d87f503655cddaeb07c10a2' , '/var/cache/activscreen/media/34/23fb/3423fbbb8d87f503655cddaeb07c10a2'];

require('nyks')

var playlist = [ '/var/cache/activscreen/media/1e/ab9b/1eab9b41f860ea15f9620bfcbed6d501',
  '/var/cache/activscreen/media/1f/841c/1f841c9ebe2b64b2b90398d7d4201f30' ]


  /*var playlist = [
  'foo-fast.mp4',
  'foo2-fast.mp4']
*/

var player = new Omx();

player.play(playlist , {loop:true});

//player.kill() ;

/*setTimeout(function(){
player.playonce('/var/cache/activscreen/media/3a/ea86/3aea86ce941f5bb1ecb1868b82990bfc')}, 5000);*/

//---------------------//
/*
player.playonce('/var/cache/activscreen/media/3a/ea86/3aea86ce941f5bb1ecb1868b82990bfc') ;
player.playonce('/var/cache/activscreen/media/3a/ea86/3aea86ce941f5bb1ecb1868b82990bfc') ;
player.playonce('/var/cache/activscreen/media/d6/d933/d6d9331638602d5c6ff674e4900975c8') ;
*/
/*
player.playonce('/var/cache/activscreen/media/3a/ea86/3aea86ce941f5bb1ecb1868b82990bfc') ;
player.playonce('/var/cache/activscreen/media/d6/d933/d6d9331638602d5c6ff674e4900975c8') ;
player.play(playlist , {loop:true});
player.playonce('/var/cache/activscreen/media/3a/ea86/3aea86ce941f5bb1ecb1868b82990bfc') ;
player.playonce('/var/cache/activscreen/media/d6/d933/d6d9331638602d5c6ff674e4900975c8') ;
*/
//---------------------//
