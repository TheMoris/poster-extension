var Response = {
   init: function(data) {
      var titleE = document.getElementById("title");
      titleE.appendChild(document.createTextNode(data.title));
      this.setResponseStatus(data.status+" "+data.statusText);
      this.setResponseContent(data.content);
      for (var name in data.headers) {
         this.addResponseHeader(name,data.headers[name]);
      }
   },
   timeout: function(data) {
      var titleE = document.getElementById("title");
      titleE.appendChild(document.createTextNode(data.title));
   },
   setResponseStatus: function(status) {
      document.getElementById("code").value = status;
   },
   setResponseContent: function(content) {
      document.getElementById("content").value = content ? content : "";
   },
   addResponseHeader: function(name,value) {
      var grid = document.getElementById("headers");
      var row = grid.ownerDocument.createElement("row");
      grid.appendChild(row);
      var nameLabel = row.ownerDocument.createElement("description");
      nameLabel.appendChild(row.ownerDocument.createTextNode(name));
      //nameLabel.setAttribute("value",name);
      row.appendChild(nameLabel);
      var valueLabel = row.ownerDocument.createElement("textbox");
      valueLabel.setAttribute("value",value);
      row.appendChild(valueLabel);
   }
   
}