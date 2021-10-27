'use strict';

{
  const once = async () => chrome.storage.local.get({
    mode: 'windows' // tabs, windows, popup
  }, prefs => {
    chrome.action.setPopup({
      popup: prefs.mode === 'popup' ? 'data/window/index.html' : ''
    });

    chrome.contextMenus.create({
      contexts: ['action'],
      type: 'radio',
      id: 'tabs',
      title: 'Tab Mode',
      checked: prefs.mode === 'tabs'
    });
    chrome.contextMenus.create({
      contexts: ['action'],
      type: 'radio',
      id: 'windows',
      title: 'Window Mode',
      checked: prefs.mode === 'windows'
    });
    chrome.contextMenus.create({
      contexts: ['action'],
      type: 'radio',
      id: 'popup',
      title: 'Popup Mode',
      checked: prefs.mode === 'popup'
    });
  });
  chrome.runtime.onInstalled.addListener(once);
  chrome.runtime.onStartup.addListener(once);
}
chrome.contextMenus.onClicked.addListener(info => chrome.storage.local.set({
  mode: info.menuItemId
}));

chrome.storage.onChanged.addListener(ps => ps.mode && chrome.action.setPopup({
  popup: ps.mode.newValue === 'popup' ? 'data/window/index.html' : ''
}));

chrome.action.onClicked.addListener(async () => {
  try {
    await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({
        method: 'exists'
      }, r => r ? resolve() : reject(chrome.runtime.lastError));
    });
  }
  catch (e) {
    chrome.storage.local.get({
      mode: 'windows',
      width: 700,
      height: 500
    }, async prefs => {
      if (prefs.mode === 'windows') {
        const win = await chrome.windows.getCurrent();

        chrome.windows.create({
          url: 'data/window/index.html',
          width: prefs.width,
          height: prefs.height,
          left: win.left + Math.round((win.width - prefs.width) / 2),
          top: win.top + Math.round((win.height - prefs.height) / 2),
          type: 'popup'
        });
      }
      else {
        chrome.tabs.create({
          url: 'data/window/index.html'
        });
      }
    });
  }
});

chrome.runtime.onMessage.addListener((request, sender) => {
  if (request.method === 'activate') {
    chrome.tabs.update(sender.tab.id, {
      highlighted: true
    });
    chrome.windows.update(sender.tab.windowId, {
      focused: true
    });
  }
});

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
            tabs.query({active: true, currentWindow: true}, tbs => tabs.create({
              url: page + '?version=' + version + (previousVersion ? '&p=' + previousVersion : '') + '&type=' + reason,
              active: reason === 'install',
              ...(tbs && tbs.length && {index: tbs[0].index + 1})
            }));
            storage.local.set({'last-update': Date.now()});
          }
        }
      }));
    });
    setUninstallURL(page + '?rd=feedback&name=' + encodeURIComponent(name) + '&version=' + version);
  }
}
