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
