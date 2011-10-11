function SavePrefs() {

}

SavePrefs.prototype.init = function(data) {
   this.data = data;
}

SavePrefs.prototype.onSave = function() {
   var options = {
      url: document.getElementById("url").checked,
      contentType: document.getElementById("content-type").checked,
      timeout: document.getElementById("timeout").checked,
      content: document.getElementById("content").checked,
      headers: document.getElementById("headers").checked,
      parameters: document.getElementById("parameters").checked
   }
   this.data.app.savePreferences(options)
   window.close();
}

