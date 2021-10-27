/* globals app */
'use strict';

app['single-window'] = {
  bg() {
    app['single-window'].ports = [];
    chrome.runtime.onConnect.addListener(port => {
      if (port.name === 'single-window') {
        const tabId = port.sender.tab.id;
        app['single-window'].ports[tabId] = port;
        port.onDisconnect.addListener(() => {
          delete app['single-window'].ports[tabId];
        });
      }
    });
  },
  page() {
    chrome.runtime.getBackgroundPage(b => {
      chrome.tabs.remove(Object.keys(b.app['single-window'].ports).map(Number));
      chrome.runtime.connect({
        name: 'single-window'
      });
    });
  }
};

if (location.href.indexOf('background') === -1) {
  app['single-window'].page();
}
else {
  app['single-window'].bg();
}
