var consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);


function PosterComponent() {
   this.wrappedJSObject = this;
   this.username = null;
   this.password = null;
}

PosterComponent.prototype = {
  urlValue : "",
  contentTypeValue : "",
  fileValue : "",

  get url() { return this.urlValue; },
  set url(value) { this.urlValue = value; },
  get contentType() { return this.contentTypeValue; },
  set contentType(value) { this.contentTypeValue = value; },
  get file() { return this.fileValue; },
  set file(value) { this.fileValue = value; },

  QueryInterface: function (iid) 
  {
     //consoleService.logStringMessage("Querying for "+iid);
     if (!iid.equals(Components.interfaces.nsIPoster) && !iid.equals(Components.interfaces.nsISupports)) {
        throw Components.results.NS_ERROR_NO_INTERFACE;
     }
     return this;
  }

};

var theInstance = new PosterComponent();
var Module = {

  //firstTime: true,

    registerSelf: function (compMgr, fileSpec, location, type) {
    //if (this.firstTime) {
    //        dump("*** Deferring registration of URL Poster JS components\n");
    //        this.firstTime = false;
    //        throw Components.results.NS_ERROR_FACTORY_REGISTER_AGAIN;
    //    }
        debug("*** Registering sample JS components\n");
        compMgr = compMgr.QueryInterface(Components.interfaces.nsIComponentRegistrar);
        compMgr.registerFactoryLocation(this.myCID,
                                        "URL Poster Component",
                                        this.myProgID,
                                        fileSpec,
                                        location,
                                        type);
    },

    getClassObject : function (compMgr, cid, iid) {
       //consoleService.logStringMessage("Getting class for "+cid);
    
       if (cid.equals(this.myCID)) {
          return this.myFactory;
       }
       if (!iid.equals(Components.interfaces.nsIFactory)) {
          throw Components.results.NS_ERROR_NOT_IMPLEMENTED;
       }
       throw Components.results.NS_ERROR_NO_INTERFACE;
    },

    myCID: Components.ID("{bd0c9c72-7c66-4728-a59e-b0e95ca2be5f}"),
    myProgID: "@milowski.com/url_poster;1",

    myFactory: {
        getService: function(outer,iid) {
           dump("CI: " + iid + "\n");
           if (outer != null) {
              throw Components.results.NS_ERROR_NO_AGGREGATION;
	   }
	   return theInstance.QueryInterface(iid);
        },
        createInstance: function (outer, iid) {
            dump("CI: " + iid + "\n");
            if (outer != null) {
               throw Components.results.NS_ERROR_NO_AGGREGATION;
	    }
            return (new PosterComponent()).QueryInterface(iid);
        }
    },

    canUnload: function(compMgr) {
        dump("****** Unloading: URL Poster JS component! ****** \n");
        return true;
    }
}; // END Module

function NSGetModule(compMgr, fileSpec) { return Module; }
