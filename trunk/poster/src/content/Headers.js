var XUL_NS = "http://www.mozilla.org/keymaster/gatekeeper/there.is.only.xul";
var Headers = {
   list: null,
   headers: null,
   nameE: null,
   valueE: null,
   init: function(data) {
      this.headers = data.headers;
      document.title = data.title;
      this.list = document.getElementById('list');
      this.nameE = document.getElementById('name');
      this.valueE = document.getElementById('value');
      for (var name in data.headers) {
         this.addRequestHeader(name,data.headers[name]);
      }
   },
   onAddChange: function() {
      var name = this.nameE.value;
      if (!name) {
         return;
      }
      var value = this.valueE.value;
      this.headers[name] = value;
      this.addRequestHeader(name,value);
   },
   addRequestHeader: function(name,value) {
      var len = this.list.getRowCount();
      var item = null;
      for (var i=0; i<len; i++) {
         item = this.list.getItemAtIndex(i);
         var nameCell = item.getElementsByTagName('listcell').item(0);
         if (nameCell.getAttribute('label')==name) {
            break;
         }
         item = null;
      }
      if (!item) {
         item = document.createElementNS(XUL_NS,"listitem");
         var nameCell = document.createElementNS(XUL_NS,"listcell");
         nameCell.setAttribute("label",name);
         var valueCell = document.createElementNS(XUL_NS,"listcell");
         valueCell.setAttribute("label",value);
         item.appendChild(nameCell);
         item.appendChild(valueCell);
         this.list.appendChild(item);
      } else {
         var cells = item.getElementsByTagName('listcell');
         var nameCell = cells.item(0);
         var valueCell = cells.item(1);
         nameCell.setAttribute("label",name);
         valueCell.setAttribute("label",value);
      }
   },
   doDelete: function() {
      var item = this.list.getSelectedItem(0);
      while (item) {
         var cells = item.getElementsByTagName('listcell');
         var nameCell = cells.item(0);
         delete this.headers[nameCell.getAttribute("label")];
         this.list.removeItemAt(this.list.getIndexOfItem(item));
         var item = this.list.getSelectedItem(0);
      }
   },
   onDeleteAll: function() {
      for (var name in this.headers) {
         delete this.headers[name];
      }
      var length = this.list.getRowCount();
      for (var i=0; i<length; i++) {
         this.list.removeItemAt(0);
      }
   },
   onSelectItem: function() {
      if (this.list.selectedCount==1) {
         var item = this.list.getSelectedItem(0);
         var cells = item.getElementsByTagName('listcell');
         var nameCell = cells.item(0);
         var valueCell = cells.item(1);
         this.nameE.value = nameCell.getAttribute("label");
         this.valueE.value = valueCell.getAttribute("label");
      }
   }
   
}