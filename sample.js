var Omx = require('./lib/omx');

// var playlist = ['/var/cache/activscreen/media/34/23fb/3423fbbb8d87f503655cddaeb07c10a2' , '/var/cache/activscreen/media/34/23fb/3423fbbb8d87f503655cddaeb07c10a2'];



var playlist = [ '/var/cache/activscreen/media/34/23fb/3423fbbb8d87f503655cddaeb07c10a2',
  '/var/cache/activscreen/media/ff/6c5a/ff6c5a2e92bc1db711843c65f8c478b5',
  '/var/cache/activscreen/media/3a/ea86/3aea86ce941f5bb1ecb1868b82990bfc',
  '/var/cache/activscreen/media/4e/a381/4ea381b59889940b18cf0b966b144c39',
  '/var/cache/activscreen/media/d6/d933/d6d9331638602d5c6ff674e4900975c8' ]

var player = new Omx();

player.play(playlist , {loop:true});

player.kill() ;

setTimeout(function(){
player.playonce('/var/cache/activscreen/media/3a/ea86/3aea86ce941f5bb1ecb1868b82990bfc')}, 5000)


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
