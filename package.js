Package.describe({
  name: 'babrahams:editable-text-wysiwyg',
  summary: 'This package is required for extending babrahams:editable-text with a wysiwyg editor.',
  version: '0.3.0',
  git: 'https://github.com/JackAdams/meteor-editable-text-wysiwyg'
});

Package.onUse(function(api) {
	
  api.versionsFrom('1.0');
  
  api.use('babrahams:editable-text@0.6.5', 'client');
  api.use('templating', 'client');
  api.use('blaze', 'client');
  api.use('spacebars', 'client');
  api.use('jquery', 'client');
  api.use('underscore', 'client');
  api.use('reactive-var', 'client');
  
  api.add_files('lib/bootstrap_wysiwyg.js', 'client');
  api.addFiles('lib/wysiwyg.css', 'client');
  api.addFiles('lib/wysiwyg.html', 'client');
  api.addFiles('lib/wysiwyg.js', 'client');

});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('babrahams:editable-text-wysiwyg');
  api.addFiles('editable-text-wysiwyg-tests.js');
});
