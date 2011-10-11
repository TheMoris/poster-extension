function PosterApp() {
   this.inprogress = null;
   this.synopsis = null;
   this.elements = {};
   this.requestHeaders = {};
   this.parameters = {};
   this.lastService = null;
}

window.title = "Poster";

PosterApp.XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
PosterApp.mimeService = Components.classes["@mozilla.org/mime;1"].getService(Components.interfaces.nsIMIMEService);


PosterApp.prototype.getPreferenceString = function(name){
   var preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.poster.");
   if (preferencesService) {
      try {
         return preferencesService.getCharPref(name);
      } catch (ex) {
         // no preference
      }
   }
   return null;
}

PosterApp.prototype.setPreferenceString = function(name,value){
   var preferencesService = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefService).getBranch("extensions.poster.");
   if (preferencesService) {
      preferencesService.setCharPref(name,value);
   }
}

PosterApp.prototype.init = function() {

   this.elements["send-checkbox"] = document.getElementById("send-checkbox");
   this.elements["filename"] = document.getElementById("filename");
   this.elements["contentType"] = document.getElementById("ctype");
   this.elements["username"] = document.getElementById("username");
   this.elements["password"] = document.getElementById("password");
   this.elements["content"] = document.getElementById("content");
   this.elements["url"] = document.getElementById("url");
   this.elements["timeout-slider"] = document.getElementById("timeout-slider");
   this.elements["timeout"] = document.getElementById("timeout");

   this.elements["contentType"].value = this.getPreferenceString("contentType");
   this.elements["content"].value = this.getPreferenceString("content");
   this.elements["url"].value = this.getPreferenceString("url");
   var timeoutPref = this.getPreferenceString("timeout");
   if (timeoutPref) {
      this.elements["timeout"].value = timeoutPref;
   }
   var headersPref = this.getPreferenceString("headers");
   if (headersPref) {
      this.setHeaders(headersPref);
   }
   var parametersPref = this.getPreferenceString("parameters");
   if (parametersPref) {
      this.setParameters(parametersPref);
   }

   var current = this;
   this.elements["timeout-slider"].onchange = function() {
      current.elements["timeout"].value = current.elements["timeout-slider"].value;
   }
   this.elements["timeout"].onchange = function() {
      current.elements["timeout-slider"].value = current.elements["timeout"].value;
   }
   document.getElementById("base64-encode").onclick = function() {
      var value = current.elements["content"].value;
      if (value.length>0) {
         var encoder = new Base64();
         current.elements["content"].value = encoder.encode(value);
      }
   }
   document.getElementById("header-list").onkeypress = function(event) {
      if (event.keyCode==8 || event.keyCode==46){
         current.onDeleteHeader();
      }
   };
   document.getElementById("parameter-list").onkeypress = function(event) {
      if (event.keyCode==8 || event.keyCode==46){
         current.onDeleteParameter();
      }
   };
}

PosterApp.prototype.setHeaders = function(data) {
   var lines = data.split("\n");
   for (var i=0; i<lines.length; i++) {
      var header = lines[i].split(": ");
      this.addRequestHeader(header[0],header[1]);
   }
}

PosterApp.prototype.setParameters = function(data) {
   var parameters = data.split("&");
   for (var i=0; i<parameters.length; i++) {
      var param = parameters[i].split("=");
      this.addParameter(param[0],decodeURIComponent(param[1]));
   }
}

PosterApp.prototype.savePreferences = function(options) {
   if (options.contentType) {
      this.setPreferenceString("contentType",this.elements["contentType"].value);
   }
   if (options.url) {
      this.setPreferenceString("url",this.elements["url"].value);
   }
   if (options.content) {
      this.setPreferenceString("content",this.elements["content"].value);
   }
   if (options.timeout) {
      this.setPreferenceString("timeout",this.elements["timeout-slider"].value);
   }
   if (options.headers) {
      var headerStr = null;
      for (var key in this.requestHeaders) {
         if (headerStr) {
            headerStr += "\n"+key+": "+this.requestHeaders[key];
         } else {
            headerStr = key+": "+this.requestHeaders[key];
         }
      }
      if (!headerStr) {
         headerStr = "";
      }
      this.setPreferenceString("headers",headerStr);
   }
   if (options.parameters) {
      var parametersStr = null;
      for (var key in this.parameters) {
         if (parametersStr) {
            parametersStr += "&"+key+"="+encodeURIComponent(this.parameters[key]);
         } else {
            parametersStr = key+"="+encodeURIComponent(this.parameters[key]);
         }
      }
      if (!parametersStr) {
         parametersStr = "";
      }
      this.setPreferenceString("parameters",parametersStr);
   }
}
   
/*
 * Open a "browse for folder" dialog to locate an extension directory
 * Add the the selected directory to the dropdown list and set it as
 * the current working directory.
 */
PosterApp.prototype.browseForFile = function() {
   var nsIFilePicker = Components.interfaces.nsIFilePicker;
   var fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
   fp.init(window, "Choose File to Upload", nsIFilePicker.modeOpen);
   if(fp.show() == nsIFilePicker.returnOK) {
      var filenm = this.elements["filename"];
      var item = filenm.value = fp.file.path;
      try {
         this.elements["contentType"].value = PosterApp.mimeService.getTypeFromFile(fp.file);
      } catch (ex) {
         this.elements["contentType"].value = "application/binary";
      }
   }
}

PosterApp.prototype.showGoogleLogin = function() {
   var currentApp = this;
   var button = document.getElementById('google-login');
   var data = {
      username: this.elements["username"].value,
      password: this.elements["password"].value,
      auth: null,
      service: "",
      onSuccess: function() {
         currentApp.googleAuth = this.auth;
         currentApp.addRequestHeader("Authorization","GoogleLogin auth="+this.auth);
         button.setAttribute("tooltiptext","Logged into "+data.username+", click to login to a different service.");
         button.setAttribute("authstate","auth");
      },
      onCancel: function() {
         currentApp.googleAuth = null;
         currentApp.deleteHeaderByName("Authorization");
         button.setAttribute("authstate","");
         button.setAttribute("tooltiptext","Login to your google account via ClientLogin.");
      }
   };
   window.openDialog(
      'chrome://poster/content/google-login.xul','google-login','centerscreen,chrome,resizable',
      data
   );
}
   
PosterApp.prototype.showPreferences = function() {
   var data = {
      app: this
   };
   window.openDialog(
      'chrome://poster/content/saving-prefs.xul','saving-prefs','centerscreen,chrome,resizable',
      data
   );
}

PosterApp.prototype.showEncoder = function() {
   var currentApp = this;
   window.openDialog(
      'chrome://poster/content/encoder.xul','encoder','centerscreen,chrome,resizable'
   );
}
   
PosterApp.prototype.doMethodRequest = function() {
   var method = document.getElementById("method").value;
   if (method=="GET") {
      this.getURL();
   } else if (method=="POST") {
      this.postURL();
   } else if (method=="PUT") {
      this.putURL();
   } else if (method=="DELETE") {
      this.deleteURL();
   } else if (method=="HEAD") {
      this.headURL();
   } else if (method=="OPTIONS") {
      this.optionsURL();
   } else if (method=="PROPFIND") {
      this.propfindURL();
   } else if (method=="MKCOL") {
      this.mkcolURL();
   } else if (method=="COPY") {
      this.copyURL();
   } else if (method=="MOVE") {
      this.moveURL();
   } else if (method=="CONNECT") {
      this.connectURL();
   }
}
   
PosterApp.prototype.doContent = function() {
   var value = document.getElementById("content-options").value;
   if (value=="headers") {
      this.showSetHeaders();
   } else if (value=="parameters") {
      this.showSetParameters();
   } else if (value=="parameter-body") {
      this.makeParameterPost();
   } else if (value=="encode") {
      this.showEncoder();
   }

}
   
PosterApp.prototype.postURL = function() {
   this.handleSend("POST");
}
   
PosterApp.prototype.putURL = function() {
   this.handleSend("PUT");
}
   
PosterApp.prototype.getURL = function() {
   if (this.elements["send-checkbox"].checked) {
      this.handleSend("GET",true);
   } else {
      this.handleGet("GET");
   }
}
   
PosterApp.prototype.deleteURL = function() {
   if (this.elements["send-checkbox"].checked) {
      this.handleSend("DELETE",true);
   } else {
      this.handleGet("DELETE");
   }
}
   
PosterApp.prototype.headURL = function() {
   if (this.elements["send-checkbox"].checked) {
      this.handleSend("HEAD",true);
   } else {
      this.handleGet("HEAD");
   }
}
   
PosterApp.prototype.optionsURL = function() {
   if (this.elements["send-checkbox"].checked) {
      this.handleSend("OPTIONS",true);
   } else {
      this.handleGet("OPTIONS");
   }
}

PosterApp.prototype.propfindURL = function() {
   this.handleSend("PROPFIND");
}

PosterApp.prototype.mkcolURL = function() {
   if (this.elements["send-checkbox"].checked) {
      this.handleSend("MKCOL",true);
   } else {
      this.handleGet("MKCOL");
   }
}

PosterApp.prototype.copyURL = function() {
   if (this.elements["send-checkbox"].checked) {
      this.handleSend("COPY",true);
   } else {
      this.handleGet("COPY");
   }
}

PosterApp.prototype.moveURL = function() {
   if (this.elements["send-checkbox"].checked) {
      this.handleSend("MOVE",true);
   } else {
      this.handleGet("MOVE");
   }
}
   
PosterApp.prototype.connectURL = function() {
   if (this.elements["send-checkbox"].checked) {
      this.handleSend("CONNECT",true);
   } else {
      this.handleGet("CONNECT");
   }
}

PosterApp.prototype.handleSend = function(method,allowEmpty) {
   var fpath = this.elements["filename"].value;
   var content = this.elements["content"].value;
   var urlstr = this.elements["url"].value;
   var ctype = this.elements["contentType"].value;
   if (ctype.length==0) {
      this.elements["contentType"].value = "text/xml";
      ctype = "text/xml";
   }
   if (urlstr.length==0) {
      alert("A URL must be specified.");
   } else if (urlstr.indexOf(':')<=0) {
      alert("You have not specified a valid URI.");
      return;
   } else if (fpath.length!=0 && content.length!=0) {
      if (allowEmpty) {
         this.handleGet(method);
      } else {
         alert("You can't have both a file and content to send.");
      }
   } else if (fpath.length!=0) {
      this.synopsis = method+" on "+urlstr;
      this.sendFileToURL(urlstr,method,fpath,ctype);
   } else {
      this.synopsis = method+" on "+urlstr;
      this.sendContentToURL(urlstr,method,content,ctype);
   }
}

PosterApp.prototype.handleGet = function(method) {
   var urlstr = this.elements["url"].value;
   if (urlstr.length==0) {
      alert("A URL must be specified.");
   } else if (urlstr.indexOf(':')<=0) {
      alert("You have not specified a valid URI.");
   } else {
      var needSeparator = false;
      for (var name in this.parameters) {
         if (needSeparator) {
            urlstr += "&";
         } else {
            if (urlstr.indexOf('?')<0) {
               urlstr += "?";
            }
         }
         urlstr += name+"="+encodeURIComponent(this.parameters[name]);
         needSeparator = true;
      }
      this.synopsis = method+" on "+urlstr;
      this.getContentFromURL(urlstr,method);
   }
}
   
PosterApp.prototype.pathToFile = function(path) {
   var file = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
   file.initWithPath(path);
   return file;
}
   
PosterApp.prototype.onResult = function(status,xml,text,headers,statusText) {
   this.inprogress = null;
   if (this.progressDialog) {
      this.progressDialog.close();
      this.progressDialog = null;
   }
   
   if (status==0) {
      window.openDialog(
         'chrome://poster/content/timeout.xul','response'+(new Date()).getTime(),'centerscreen,chrome,resizable',
         {
            title: this.synopsis
         }
      );
   } else {
      window.openDialog(
         'chrome://poster/content/response.xul','response'+(new Date()).getTime(),'centerscreen,chrome,resizable',
         {
            title: this.synopsis,
            status: status,
            statusText: statusText,
            content: text,
            headers: headers
         }
      );
   }
}
   
PosterApp.prototype.sendFileToURL = function(urlstr,method,fpath,ctype) {
   try{
      //alert("Sending "+fpath+" to "+urlstr+" as "+ctype+" via "+method);
      if (this.inprogress) {
         var requestToCancel = this.inprogress;
         this.inprogress = null;
         requestToCancel.abort();
      }
      var currentApp = this;
      var timeout = parseInt(this.elements["timeout-slider"].value)*1000;
      var username = this.elements["username"].value;
      var password = this.elements["password"].value;
      var file = this.pathToFile(fpath);
      var fstream = Components.classes["@mozilla.org/network/file-input-stream;1"]
      .createInstance(Components.interfaces.nsIFileInputStream);
      fstream.init(file, 1, 0, 0);

      var bufferedStream = Components.classes["@mozilla.org/network/buffered-input-stream;1"]
      .createInstance(Components.interfaces.nsIBufferedInputStream);
      bufferedStream.init(fstream, file.fileSize);
      var currentOpenFile = fstream;
      var req = HTTP(
         method,
         urlstr,
         {
            timeout: timeout,
            contentType: ctype,
            body: bufferedStream,
            headers: currentApp.requestHeaders,
            username: username,
            password: password,
            returnHeaders: true,
            onSuccess: function(status,xml,text,headers,statusText) {
               fstream.close();
               currentApp.onResult(status,xml,text,headers,statusText);
            },
            onFailure: function(status,xml,text,headers,statusText) {
               fstream.close();
               currentApp.onResult(status,xml,text,headers,statusText);
            }
         }
      );
      this.inprogress = {
         abort: function() {
            req.abort();
            fstream.close();
         }
      }

   } catch (error) {
      alert("Cannot process request on "+urlstr+" due to: "+error.message);
   }

}

   
PosterApp.prototype.sendContentToURL = function(urlstr,method,content,ctype) {
  //alert(urlstr+" "+method+" "+content+" "+ctype);
  try{
     if (this.inprogress) {
        var requestToCancel = this.inprogress;
        this.inprogress = null;
        requestToCancel.abort();
     }
     var currentApp = this;
     var timeout = parseInt(this.elements["timeout-slider"].value)*1000;
     var username = this.elements["username"].value;
     var password = this.elements["password"].value;
     this.inprogress = HTTP(
        method,
        urlstr,
        {
           timeout: timeout,
           contentType: ctype,
           body: content,
           headers: currentApp.requestHeaders,
           username: username,
           password: password,
           returnHeaders: true,
           onOpened: function(request) {
              if (!currentApp.progressDialog) {
                  currentApp.progressDialog = window.openDialog(
                     'chrome://poster/content/progress.xul','progress'+(new Date()).getTime(),'centerscreen,chrome,resizable',
                     {
                        url: urlstr,
                        status: "Sending...",
                        app: currentApp
                     }
                  );
                  currentApp.progressDialog.focus();
                  currentApp.receivingCount = 0;
              }
           },
           onHeaders: function(request) {
              currentApp.progressDialog.document.getElementById('status').value = 'Headers loaded...';
           },
           onLoading: function(request) {
              currentApp.receivingCount++;
              currentApp.progressDialog.document.getElementById('status').value = '('+currentApp.receivingCount+') Receiving...';
           },
           onSuccess: function(status,xml,text,headers,statusText) {
              currentApp.onResult(status,xml,text,headers,statusText);
           },
           onFailure: function(status,xml,text,headers,statusText) {
              currentApp.onResult(status,xml,text,headers,statusText);
           }
        }
     );
  } catch (error) {
      alert("Cannot process request on "+urlstr+" due to: "+error.message);
  }
}

PosterApp.prototype.getContentFromURL = function(urlstr,method) {
  try{
     if (this.inprogress) {
        var requestToCancel = this.inprogress;
        this.inprogress = null;
        requestToCancel.abort();
     }
     var currentApp = this;
     var timeout = parseInt(this.elements["timeout-slider"].value)*1000;
     var username = this.elements["username"].value;
     var password = this.elements["password"].value;
     this.inprogress = HTTP(
        method,
        urlstr,
        {
           timeout: timeout,
           username: username,
           password: password,
           headers: currentApp.requestHeaders,
           returnHeaders: true,
           onOpened: function(request) {
              if (!currentApp.progressDialog) {
                  currentApp.progressDialog = window.openDialog(
                     'chrome://poster/content/progress.xul','progress'+(new Date()).getTime(),'centerscreen,chrome,resizable',
                     {
                        url: urlstr,
                        status: "Sending...",
                        app: currentApp
                     }
                  );
                  currentApp.progressDialog.focus();
                  currentApp.receivingCount = 0;
              }
           },
           onHeaders: function(request) {
              currentApp.progressDialog.document.getElementById('status').value = 'Headers loaded...';
           },
           onLoading: function(request) {
              currentApp.receivingCount++;
              currentApp.progressDialog.document.getElementById('status').value = '('+currentApp.receivingCount+') Receiving...';
           },
           onSuccess: function(status,xml,text,headers,statusText) {
              currentApp.onResult(status,xml,text,headers,statusText);
           },
           onFailure: function(status,xml,text,headers,statusText) {
              currentApp.onResult(status,xml,text,headers,statusText);
           }
        }
     );
  } catch (error) {
      alert("Cannot process request on "+urlstr+" due to: "+error.message);
  }
}

PosterApp.prototype.showSetHeaders = function() {
  var currentApp = this;
  window.openDialog(
      'chrome://poster/content/headers.xul','headers','centerscreen,chrome,resizable',
      {
         title: "Request Headers",
         headers: currentApp.requestHeaders
      }
  );
}

PosterApp.prototype.showSetParameters = function() {
  var currentApp = this;
  window.openDialog(
      'chrome://poster/content/headers.xul','parameters','centerscreen,chrome,resizable',
      {
         title: "Parameters",
         headers: currentApp.parameters
      }
  );
}

PosterApp.prototype.makeParameterPost = function() {
   this.elements["contentType"].value = "application/x-www-form-urlencoded";
   var body = "";
   for (var name in this.parameters) {
      if (body.length>0) {
         body += "&";
      }
      body += name+"="+encodeURIComponent(this.parameters[name])
   }
   this.elements["content"].value = body;
}

PosterApp.prototype.onAddChangeHeader = function() {
   var name = document.getElementById("header-name").value;
   if (!name) {
      return;
   }
   var value = document.getElementById("header-value").value;
   this.addRequestHeader(name,value);
}

PosterApp.prototype.addRequestHeader = function(name,value) {
   try {
   this.requestHeaders[name] = value;
   var list = document.getElementById("header-list");
   var len = list.getRowCount();
   var item = null;
   for (var i=0; i<len; i++) {
      item = list.getItemAtIndex(i);
      var nameCell = item.getElementsByTagName('listcell').item(0);
      if (nameCell.getAttribute('label')==name) {
         break;
      }
      item = null;
   }
   if (!item) {
      item = document.createElementNS(PosterApp.XUL_NS,"listitem");
      var nameCell = document.createElementNS(PosterApp.XUL_NS,"listcell");
      nameCell.setAttribute("label",name);
      var valueCell = document.createElementNS(PosterApp.XUL_NS,"listcell");
      valueCell.setAttribute("label",value);
      item.appendChild(nameCell);
      item.appendChild(valueCell);
      list.appendChild(item);
   } else {
      var cells = item.getElementsByTagName('listcell');
      var nameCell = cells.item(0);
      var valueCell = cells.item(1);
      nameCell.setAttribute("label",name);
      valueCell.setAttribute("label",value);
   }
   } catch (ex) {
      alert(ex);
   }
}

PosterApp.prototype.onDeleteHeader = function() {
   try {
      var list = document.getElementById("header-list");
      var item = list.getSelectedItem(0);
      while (item) {
         var cells = item.getElementsByTagName('listcell');
         var nameCell = cells.item(0);
         delete this.requestHeaders[nameCell.getAttribute("label")];
         list.removeItemAt(list.getIndexOfItem(item));
         item = list.getSelectedItem(0);
      }
   } catch (ex) {
      alert(ex);
   }
}

PosterApp.prototype.deleteHeaderByName = function(name) {
   var list = document.getElementById("header-list");
   var len = list.getRowCount();
   var item = null;
   for (var i=0; i<len; i++) {
      item = list.getItemAtIndex(i);
      var nameCell = item.getElementsByTagName('listcell').item(0);
      if (nameCell.getAttribute('label')==name) {
         break;
      }
      item = null;
   }
   if (item) {
      var cells = item.getElementsByTagName('listcell');
      var nameCell = cells.item(0);
      delete this.requestHeaders[nameCell.getAttribute("label")];
      list.removeItemAt(list.getIndexOfItem(item));
   }
}

PosterApp.prototype.onSelectHeaderItem = function() {
   var list = document.getElementById("header-list");
   var item = list.getSelectedItem(0);
   var cells = item.getElementsByTagName('listcell');
   var nameCell = cells.item(0);
   var valueCell = cells.item(1);
   document.getElementById("header-name").value = nameCell.getAttribute("label")
   document.getElementById("header-value").value = valueCell.getAttribute("label")
}

PosterApp.prototype.onAddChangeParameter = function() {
   var name = document.getElementById("parameter-name").value;
   if (!name) {
      return;
   }
   var value = document.getElementById("parameter-value").value;
   this.addParameter(name,value);
}

PosterApp.prototype.onSelectParameterItem = function() {
   var list = document.getElementById("parameter-list");
   var item = list.getSelectedItem(0);
   var cells = item.getElementsByTagName('listcell');
   var nameCell = cells.item(0);
   var valueCell = cells.item(1);
   document.getElementById("parameter-name").value = nameCell.getAttribute("label")
   document.getElementById("parameter-value").value = valueCell.getAttribute("label")

}

PosterApp.prototype.addParameter = function(name,value) {
   try {
   this.parameters[name] = value;
   var list = document.getElementById("parameter-list");
   var len = list.getRowCount();
   var item = null;
   for (var i=0; i<len; i++) {
      item = list.getItemAtIndex(i);
      var nameCell = item.getElementsByTagName('listcell').item(0);
      if (nameCell.getAttribute('label')==name) {
         break;
      }
      item = null;
   }
   if (!item) {
      item = document.createElementNS(PosterApp.XUL_NS,"listitem");
      var nameCell = document.createElementNS(PosterApp.XUL_NS,"listcell");
      nameCell.setAttribute("label",name);
      var valueCell = document.createElementNS(PosterApp.XUL_NS,"listcell");
      valueCell.setAttribute("label",value);
      item.appendChild(nameCell);
      item.appendChild(valueCell);
      list.appendChild(item);
   } else {
      var cells = item.getElementsByTagName('listcell');
      var nameCell = cells.item(0);
      var valueCell = cells.item(1);
      nameCell.setAttribute("label",name);
      valueCell.setAttribute("label",value);
   }
   } catch (ex) {
      alert(ex);
   }
},
PosterApp.prototype.onDeleteParameter = function() {
   try {
      var list = document.getElementById("parameter-list");
      var item = list.getSelectedItem(0);
      while (item) {
         var cells = item.getElementsByTagName('listcell');
         var nameCell = cells.item(0);
         delete this.parameters[nameCell.getAttribute("label")];
         list.removeItemAt(list.getIndexOfItem(item));
         item = list.getSelectedItem(0);
      }
   } catch (ex) {
      alert(ex);
   }
}


