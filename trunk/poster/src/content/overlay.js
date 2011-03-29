function showPoster() {
   window.open(
      'chrome://poster/content/poster-window.xul','poster-'+(new Date()).getTime(),'centerscreen,resizable,width=550,height=700'
   );
}
