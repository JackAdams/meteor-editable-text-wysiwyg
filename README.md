WYSIWYG extension for babrahams:editable-text package
-----------------------------------------------------

__Do not `meteor add babrahams:wysiwyg`__

This package provides the base code for adding a wysiwyg widget to babarahams:editable-text. By itself it has no effect.

Example app: [http://editable-text.meteor.com](http://editable-text.meteor.com)

Example app repo: [https://github.com/JackAdams/editable-text-example](https://github.com/JackAdams/editable-text-example)

#### Quick Start

	meteor add babrahams:editable-text-wysiwyg
	
or

    meteor add babrahams:editable-text-wysiwyg-bootstrap-3
	
(this package will get added automatically)

You can then drop an editable text widget into any Blaze template as follows:

	{{> editableText collection="posts" field="body" wysiwyg=true}}
	
where "posts" is the name of the mongo collection and "body" is the name of a document field for the `posts` collection.

`collection` and `field` are mandatory fields.

Note: The widget assumes that the data context is that of a single document from the `posts` collection (with _id value included).

You can also set the data context explicitly as follows:

    {{> editableText context=singlePostDocument collection="posts" field="body"}}

where `singlePostDocument` can be a single post document already set in the current context, or provided by a template helper from the template that the widget was dropped into.

(You can use `document`, `doc`, `object`, `obj`, `data` or `dataContext` instead of `context` - go with whichever you prefer.)

#### Documentation

Read the [full documentation](https://github.com/JackAdams/meteor-editable-text#editable-text-for-meteor) for the `babrahams:editable-text` package at [https://github.com/JackAdams/meteor-editable-text](https://github.com/JackAdams/meteor-editable-text).