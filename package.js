Package.describe({
  name: 'babrahams:editable-text-wysiwyg-base',
  summary: 'This package does nothing by itself, but is required for extending the babrahams:editable-text with a wysiwyg editor.',
  version: '0.1.0',
  git: 'https://github.com/JackAdams/meteor-editable-text-wysiwyg-base'
});

Package.onUse(function(api) {
	
  api.versionsFrom('1.0');
  
  api.use('babrahams:editable-text@0.5.5', 'client');
  api.use('templating', 'client');
  api.use('blaze', 'client');
  api.use('spacebars', 'client');
  api.use('jquery', 'client');
  api.use('underscore', 'client');
  api.use('reactive-var', 'client');
  
  api.add_files('lib/bootstrap_wysiwyg.js', 'client');
  api.addFiles('lib/wysiwyg-base.css', 'client');
  api.addFiles('lib/wysiwyg-base.html', 'client');
  api.addFiles('lib/wysiwyg-base.js', 'client');

});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('editable-text-wysiwyg-base');
  api.addFiles('editable-text-wysiwyg-base-tests.js');
});
