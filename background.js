/* globals app */
'use strict';

app.runtime.on('start', async () => {
  const {mode} = await app.storage.get({
    mode: 'windows' // tabs, windows, popup
  });
  app.button.set({
    popup: mode === 'popup' ? 'data/window/index.html' : ''
  });
  app.menus.add({
    type: 'radio',
    id: 'tabs',
    title: 'Tab Mode',
    checked: mode === 'tabs'
  }, {
    type: 'radio',
    id: 'windows',
    title: 'Window Mode',
    checked: mode === 'windows'
  }, {
    type: 'radio',
    id: 'popup',
    title: 'Popup Mode',
    checked: mode === 'popup'
  });
});
app.storage.on('changed', ps => ps.mode && app.button.set({
  popup: ps.mode.newValue === 'popup' ? 'data/window/index.html' : ''
}));

app.button.on('clicked', async () => {
  const {mode} = await app.storage.get({
    mode: 'windows'
  });
  app[mode].open({
    url: 'data/window/index.html'
  });
});

app.menus.on('clicked', info => app.storage.set({
  mode: info.menuItemId
}));

/* FAQs & Feedback */
{
  const {management, runtime: {onInstalled, setUninstallURL, getManifest}, storage, tabs} = chrome;
  if (navigator.webdriver !== true) {
    const page = getManifest().homepage_url;
    const {name, version} = getManifest();
    onInstalled.addListener(({reason, previousVersion}) => {
      management.getSelf(({installType}) => installType === 'normal' && storage.local.get({
        'faqs': true,
        'last-update': 0
      }, prefs => {
        if (reason === 'install' || (prefs.faqs && reason === 'update')) {
          const doUpdate = (Date.now() - prefs['last-update']) / 1000 / 60 / 60 / 24 > 45;
          if (doUpdate && previousVersion !== version) {
            tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install'
            });
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
