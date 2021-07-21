Package.describe({
  name: 'babrahams:editable-text-wysiwyg',
  summary: 'Don\'t add this - done automatically when adding a wysiwyg editor to babrahams:editable-text',
  version: '0.6.21',
  git: 'https://github.com/JackAdams/meteor-editable-text-wysiwyg'
});

Package.onUse(function(api) {
    
  api.versionsFrom(['1.8.2', '2.3']);
  
  api.use('babrahams:editable-text@0.9.17', 'client');
  api.use(['templating@1.3.2', 'blaze@2.3.4', 'spacebars@1.0.15', 'jquery@1.11.11'], 'client');
  api.use('underscore', 'client');
  api.use('reactive-var', 'client');
  
  api.addFiles('lib/bootstrap_wysiwyg.js', 'client');
  api.addFiles('lib/wysiwyg.css', 'client');
  api.addFiles('lib/wysiwyg.html', 'client');
  api.addFiles('lib/wysiwyg.js', 'client');

});

Package.onTest(function(api) {
  api.use('tinytest');
  api.use('babrahams:editable-text-wysiwyg');
  api.addFiles('editable-text-wysiwyg-tests.js');
});
