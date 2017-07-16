// Every wysiwyg implementation needs to include the following in a client-side js file:
// EditableText.wysiwyg = true;
// This means that the editableText widget will not fall back to a textarea

EditableText._blockFocusoutForWYSIWYG = false;
EditableText.customButtons = {};

EditableText.blockFocusoutForWYSIWYG = function () {
  EditableText._blockFocusoutForWYSIWYG = true;
  Meteor.defer(function () {
    EditableText._blockFocusoutForWYSIWYG = false; 
  });
}

EditableText.overrideAnchorDefault = function () {
    
}

EditableText._customButtons = function (data, position) {
  return _.union(EditableText.customButtons[position] || [], data.customButtons && data.customButtons[position] || []);
}

EditableText.insertHtml = function (evt, tmpl, html) {
  // Focus the editor
  tmpl.$(evt.target).closest('.wysiwyg-container').find('.wysiwyg').focus();
  $._restoreSelection();
  // Insert the html
  document.execCommand('insertHTML', false, html);
  $._saveSelection();
}

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

EditableText._allowedHtmlPasteCleaner = function (maxImageSize) {
  var allowed = EditableText._allowedHtml(maxImageSize);
  return _.reduce(allowed.allowedTags, function (memo, tag) { memo[tag] = allowed.allowedAttributes[tag] || []; return memo;}, {});
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
          fromList(child.attributes).forEach(function (attr) {
            if (allow[tag].indexOf(attr.name.toLowerCase())===-1) {
               child.removeAttribute(attr);
            }
          });
        }
        else {
          // Replace unwanted elements with their contents
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


EditableText._onOpenUrlInput = function (inputElem) {
  inputElem.val('');
  Meteor.defer(function () {
    var selection = window.getSelection();
    var range = selection.getRangeAt(0);
    var parent = range.commonAncestorContainer.parentNode;
    if (_.contains([parent.nodeName, parent.tagName], "A")) {
      inputElem.val(parent.href);
    }
  });
    /*EditableText._blockFocusoutForWYSIWYG = true;
    inputElem.focus();
    Meteor.defer(function () {
      EditableText._blockFocusoutForWYSIWYG = false;
    });*/
}


EditableText._onToggleTools = function (buttonElem, widgetContext, dataContext, forceOpen) {
  if (forceOpen && buttonElem.attr('title') !== 'Show tools') {
    return;
  }
  var elem = buttonElem.closest('.wysiwyg-toolbar').find('.wysiwyg-tools');
  elem.toggle(jQuery.ui && 'stretch' || 'blind'); // Hack for weird way that adding jQuery UI breaks 'blind'
  if (buttonElem.attr('title') === 'Show tools') {
    buttonElem.attr('title','Hide tools').find('i').removeClass('fa-caret-right').addClass('fa-caret-down');
    EditableText._callback.call(widgetContext, 'onShowToolbar', dataContext);
  }
  else {
    buttonElem.attr('title','Show tools').find('i').removeClass('fa-caret-down').addClass('fa-caret-right');
    EditableText._callback.call(widgetContext, 'onHideToolbar', dataContext);
  }    
}


EditableText._wysiwygColors = function () {
  return [
    {name: "Red", code: "#c00000"},
    {name: "Orange", code: "#f08000"},
    {name: "Yellow", code: "#c0c000"},
    {name: "Green", code: "#008000"},
    {name: "Cyan", code: "#0090c0"},
    {name: "Blue", code: "#0900c0"},
    {name: "Magenta", code: "#800080"},
    {name: "Grey", code: "#777777"},
    {name: "Black", code: "#000000"}
  ];    
}


EditableText._toggleEditHTML = function (tmpl) {
  var editHTML = tmpl.editHTML.get();
  if (editHTML) {
    var html = tmpl.$('.wysiwyg').val();
  }
  else {
    var html = tmpl.$('.wysiwyg').html();
    var height = tmpl.$('.wysiwyg').height();
    var width = tmpl.$('.wysiwyg').width();
  }
  tmpl.editHTML.set(!editHTML);
  Tracker.flush();
  if (tmpl.editHTML.get()) {
    tmpl.$('.wysiwyg').val(html).height(height).width(width);
  }
  else {
    tmpl.$('.wysiwyg').html(html);    
  }    
}

EditableText._findWysiwygInstance = function (tmpl) {
  // Recurse upwards until we find a template named 'editable_text_widget'
  var view = _.clone(tmpl.view);
  while (view && view.name !== 'Template.editable_text_widget' && view.parentView) {
    view = _.clone(view.parentView); 
  }
  return view._templateInstance;
}


// Template events -- requires babrahams:editable-text

Template.editable_text_widget.events({
  'mousedown .wysiwyg-content .editable-text a' : function (evt, tmpl) {
    if (EditableText.overrideAnchorDefault(evt, tmpl)) {
      evt.preventDefault();
      evt.stopPropagation();
      return;    
    }
    if (confirm("Click 'OK' to follow this link.\n\nClick 'Cancel' to edit.")) {
      evt.stopPropagation();
      window.open($(evt.currentTarget).attr('href'), '_blank');    
    }
  },
  'click .wysiwyg-content .editable-text a' : function (evt) {
    evt.preventDefault(); 
  },
  'mousedown .wysiwyg-container' : function (evt) {
    EditableText._blockFocusoutForWYSIWYG = true;
    // This is a filthy hack to allow time for checking the document blur event
    // to prevent save on focusout if the whole document is losing focus
    // Important if we want to be able to drag files into the editor
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
    if (evt.which === 75 && evt.metaKey) {
      evt.preventDefault();
      var buttonElem = tmpl.$(evt.currentTarget).find('.wysiwyg-tools-button');
      var forceOpen = true;
      EditableText._onToggleTools(buttonElem, this, tmpl.data.context, forceOpen);
      var elem = tmpl.$('.add-url-trigger');
      elem.dropdown('toggle');
      Tracker.flush();
      var inputElem = tmpl.$('.wysiwyg-tools').find('input[data-edit=createlink]');
      EditableText._onOpenUrlInput(inputElem);
    }
  },
  'paste .wysiwyg' : function (evt, tmpl) {
    // To remove all html on paste, use this:
    // document.execCommand('insertText', false, evt.clipboardData.getData('text/plain'));
    // evt.preventDefault();
    // To remove all but selected elements and attributes, use this:
    var self = this;
    var wysiwygElem = tmpl.$(evt.target).closest('.wysiwyg');
    Meteor.defer(function () {
      var text = wysiwygElem.html();
      var maxImageSize = self.maxImageSize || EditableText.maximumImageSize;
      if (maxImageSize && text && (text.length > (maxImageSize * 1000))) {
        document.execCommand('undo');
        alert('You\'ve tried to paste too much information into the editor. If you\'re pasting an image, try reducing it to less than ' + maxImageSize + 'k.');
        return;  
      }
      EditableText._cleanHTML(wysiwygElem[0], EditableText._allowedHtmlPasteCleaner(self.maxImageSize));
      wysiwygElem.html(EditableText._autoLink(EditableText._sanitizeHTML(wysiwygElem.html())));
      wysiwygElem.focusEnd();
    });
    // To accept all, do nothing
  },
  'click .wysiwyg-container .wysiwyg-save-button, focusout .wysiwyg-container .wysiwyg' : function (evt, tmpl) {
    evt.stopPropagation();
    evt.stopImmediatePropagation();
    var self = this;
    if (tmpl.editHTML.get()) {
      // We need to go back to the contenteditable view
      EditableText._toggleEditHTML(tmpl);    
    }
    Meteor.defer(function () {
      // We need to defer to give time for the document to lose focus if the user has clicked away from the document
      if (!document.hasFocus() || (evt.type === 'focusout' && (EditableText._blockFocusoutForWYSIWYG || !(typeof self.saveOnFocusout !== 'undefined' && self.saveOnFocusout || EditableText.saveOnFocusout)))) {
        // Need to stop clicks on the toolbar from firing the autosave due to loss of focus
        return;    
      }
      var value = $.trim(tmpl.$('.wysiwyg').cleanHtml()).replace(/\n/g, "");
      var sanitizedValue = _.isFunction(EditableText._sanitizeHTML) && EditableText._sanitizeHTML(value) || value;
      tmpl.selected.set(false);
      EditableText.okCancelEvents.ok.call(self, sanitizedValue, evt, tmpl);
    });
  },
  'click .wysiwyg-edit-html' : function (evt, tmpl) {
    EditableText._toggleEditHTML(tmpl);
  },
  'click .custom-wysiwyg-button' : function (evt, tmpl) {
    if (_.isFunction(this.button.click)) {
      this.button.click.call(this, evt, tmpl);    
    }
  }
});

Template.editable_text_widget.onRendered(function () {
  // When we start editing, get the wysiwyg and attach its toolbar
  var self = this;
  this.autorun(function() {
    if (self.selected.get() && self.data.wysiwyg && !self.editHTML.get()) {
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

// HELPERS AND EVENTS FOR BOOTSTRAP WYSIWYG TOOLBARS

Template.wysiwyg.helpers({
  wysiwygToolbar: function () {
    return (Template.wysiwyg_toolbar) ? 'wysiwyg_toolbar' : null;
  }
});

// Events specific to this particular implementation of the bootstrap-wysiwyg editor

Template.wysiwyg.events({
  /*'click .wysiwyg-table-button' : function() {
    document.execCommand('insertHTML', false, '<table><tr><td></td><td></td></tr><tr><td></td><td></td></tr></table>')  
  },*/
  'mousedown .wysiwyg-tools-button' : function (evt, tmpl) {
    evt.preventDefault();
    var buttonElem = $(evt.currentTarget);
    EditableText._onToggleTools(buttonElem, this, tmpl.data.context);
  },
  'click .wysiwyg-toolbar .span2' : function (evt, tmpl) {
    evt.stopPropagation();
  },
  'mouseup .add-url-trigger' : function (evt, tmpl) {
    Meteor.defer(function () {
      var inputElem = tmpl.$(evt.target).closest('.btn-group').find('input[data-edit=createlink]');
      EditableText._onOpenUrlInput(inputElem);
    });
  }
});