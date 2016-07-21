// Every wysiwyg implementation needs to include the following in a client-side js file:
// EditableText.wysiwyg = true;
// This means that the editableText widget will not fall back to a textarea

EditableText._blockFocusoutForWYSIWYG = false;

// Utility functions

$.fn.focusEnd = function () {
  $(this).focus();
  var tmp = $('<span />').appendTo($(this)),
	node = tmp.get(0),
	range = null,
	sel = null;

  if (document.selection) {
	range = document.body.createTextRange();
	range.moveToElementText(node);
	range.select();
  }
  else if (window.getSelection) {
	range = document.createRange();
	range.selectNode(node);
	sel = window.getSelection();
	sel.removeAllRanges();
	sel.addRange(range);
  }
  tmp.remove();
  return this;
}

EditableText._allowedHtmlPasteCleaner = function () {
  var allowed = EditableText._allowedHtml();
  return _.reduce(allowed.allowedTags,function(memo, tag) { memo[tag] = allowed.allowedAttributes[tag] || []; return memo;}, {});
}

EditableText._cleanHTML = function (element, allow) {
  
  // fromList is a utility function used by EditableText._cleanHTML. This is really just `Array.prototype.slice()`
  // except that the ECMAScript standard doesn't guarantee we're allowed to call that on
  // a host object like a DOM NodeList, boo.
  var fromList = function (list) {
	var array= new Array(list.length);
	for (var i= 0, n= list.length; i<n; i++)
	  array[i]= list[i];
	return array;
  };
  
  // Recurse into child elements
  fromList(element.childNodes).forEach(function (child) {
      if (child.nodeType===1) {
        EditableText._cleanHTML(child, allow);
        var tag= child.tagName.toLowerCase();
        if (tag in allow) {
          // Remove unwanted attributes
          //
          fromList(child.attributes).forEach(function (attr) {
              if (allow[tag].indexOf(attr.name.toLowerCase())===-1) {
                 child.removeAttribute(attr);
              }
          });
        }
        else {
          // Replace unwanted elements with their contents
          //
          while (child.firstChild)
              element.insertBefore(child.firstChild, child);
          element.removeChild(child);
        }
      }
      else if (child.nodeType===3) {
        child.textContent = child.textContent.replace(/<!--[\s\S]*?-->/g," ");
      }
  });
}


EditableText._sanitizeHTML = function (html) {
  // Find all instances of href=" and if the first four letters aren't "http", put in "http://"
  var currentIndex = 0, newIndex;
  do {
    newIndex = html.substr(currentIndex).indexOf('href="');
    if (newIndex !== -1) {
      // Check whether the next four characters are http
      currentIndex += newIndex;
      if (html.substr(currentIndex + 6, 4) !== 'http') {
        currentIndex += 6;
        html = [html.slice(0, currentIndex), 'http://', html.slice(currentIndex)].join('');
      }
      else {
        currentIndex += 4;  
      }
    }
  }
  while (newIndex !== -1);
  return html;
}

// Template events -- requires babrahams:editable-text

Template.editable_text_widget.events({
  'mousedown .wysiwyg-content .editable-text a' : function (evt) {
    if (confirm("Click 'OK' to follow this link.\n\nClick 'Cancel' to edit.")) {
      evt.stopPropagation();
      window.open($(evt.target).attr('href'), '_blank');    
    }
  },
  'mousedown .wysiwyg-container' : function (evt) {
    EditableText._blockFocusoutForWYSIWYG = true;
    // This is a filthy hack to allow time for checking the document blur event
    // to prevent save on focusout if the whole document is losing focus
    // Important if we want to be able to drag files in to the editor
    Meteor.setTimeout(function () {
      EditableText._blockFocusoutForWYSIWYG = false;
    }, 100);
  },
  'keydown .wysiwyg-container' : function (evt, tmpl) {
    if (evt.which === 27) {
      evt.stopImmediatePropagation();
      tmpl.selected.set(false);
      EditableText._callback.call(this, 'onStopEditing', tmpl.data.context);
    }
  },
  'paste .wysiwyg' : function (evt) {
    // To remove all html on paste, use this:
    // document.execCommand('insertText', false, evt.clipboardData.getData('text/plain'));
    // evt.preventDefault();
    // To remove all but selected elements and attributes, use this:
    Meteor.defer(function () {
      var text = $(evt.target).closest('.wysiwyg').html();
      if (EditableText.maximumImageSize && text && (text.length > EditableText.maximumImageSize)) {
        document.execCommand('undo');
        alert('You\'ve tried to paste too much information into the editor. If you\'re pasting an image, try reducing it to less than ' + EditableText.maximumImageSize + 'k.');
        return;  
      }
      EditableText._cleanHTML($(evt.target).closest('.wysiwyg')[0], EditableText._allowedHtmlPasteCleaner());
    });
    // To accept all, do nothing
  },
  'click .wysiwyg-container .wysiwyg-save-button, focusout .wysiwyg-container .wysiwyg' : function (evt, tmpl) {
    evt.stopPropagation();
    evt.stopImmediatePropagation();
    var self = this;
    Meteor.defer(function () {
      // We need to defer to give time for the document to lose focus if the user has clicked away from the document
      if (!document.hasFocus() || (evt.type === 'focusout' && (EditableText._blockFocusoutForWYSIWYG || !(typeof self.saveOnFocusout !== 'undefined' && self.saveOnFocusout || EditableText.saveOnFocusout)))) {
        // Need to stop clicks on the toolbar from firing the autosave due to loss of focus
        return;    
      }
      var value = $.trim(tmpl.$('.wysiwyg').cleanHtml()).replace(/\n/g, "");
      var sanitizedValue = _.isFunction(EditableText._sanitizeHTML) && EditableText._sanitizeHTML(value) || value;
      EditableText.okCancelEvents.ok.call(self, sanitizedValue, evt, tmpl);
      if (evt.type === 'click') {
        tmpl.selected.set(false);
      }
    });
  }
});

Template.editable_text_widget.onRendered(function () {
  // When we start editing, get the wysiwyg and attach its toolbar
  var self = this;
  this.autorun(function() {
    if (self.selected.get() && self.data.wysiwyg) {
      Meteor.defer(function() {
        var wysiwyg = self.$('.wysiwyg');
        if (wysiwyg.length) { // Might have disappeared from the DOM in some rare circumstances
          wysiwyg.wysiwyg({toolbarSelector: ".wysiwyg-toolbar"});
          wysiwyg.focusEnd();
        }
      });
    }
  });
});