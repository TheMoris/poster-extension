function showPoster() {
   window.open(
      'chrome://poster/content/poster-window.xul','poster-'+(new Date()).getTime(),'centerscreen,resizable'
   );
}

var preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.poster.");
if (preferencesService) {
   var loaded = false;
   try {
      loaded = preferencesService.getBoolPref("loaded");
   } catch (ex) {
      // no preference
   }
   if (!loaded) {
      if (gBrowser) {
         setTimeout(function() {
            if (gBrowser.contentDocument.location!="chrome://poster/content/poster-window.xul") {
               if (gBrowser.contentDocument.location=="about:blank") {
                  gBrowser.selectedBrowser.loadURI("chrome://poster/content/first-time.xhtml")
               } else {
                  gBrowser.selectedTab = gBrowser.addTab("chrome://poster/content/first-time.xhtml");
               }
            }
         },500);
      }
   }
   preferencesService.setBoolPref("loaded",true);
}
