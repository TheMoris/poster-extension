function showPoster() {
   window.openDialog(
      'chrome://poster/content/poster-window.xul','poster-'+(new Date()).getTime(),'centerscreen,chrome,resizable'
   );
}
