/* globals app */
'use strict';

const record = document.getElementById('record');
const stop = document.getElementById('stop');
const pause = document.getElementById('pause');
const notify = document.getElementById('notify');
const player = document.getElementById('player');
const audio = document.getElementById('audio');

const readable = seconds => {
  seconds = parseInt(seconds);
  const levels = [
    [Math.floor(seconds / 31536000), 'years'],
    [Math.floor((seconds % 31536000) / 86400), 'days'],
    [Math.floor(((seconds % 31536000) % 86400) / 3600), 'hrs'],
    [Math.floor((((seconds % 31536000) % 86400) % 3600) / 60), 'mins'],
    [(((seconds % 31536000) % 86400) % 3600) % 60, 'secs']
  ];
  let returntext = '';

  for (let i = 0, max = levels.length; i < max; i++) {
    if (levels[i][0] === 0) {
      continue;
    }
    returntext += ' ' + levels[i][0] + ' ';
    returntext += (levels[i][0] === 1 ? levels[i][1].substr(0, levels[i][1].length - 1) : levels[i][1]);
  }
  return returntext.trim();
};

app.storage.get({
  video: true,
  audio: true
}).then(prefs => navigator.mediaDevices.getUserMedia(prefs).then(e => {
  audio.checked = prefs.audio;
  notify.textContent = '';
  player.srcObject = e;
  player.play();
  record.disabled = false;
  record.stream = e;
  player.start = new Date();
  document.title = 'Press ● to start recording';
}).catch(e => {
  notify.textContent = e.message;
}));

record.addEventListener('click', async () => {
  const recorder = new MediaRecorder(player.srcObject, {
    'mimeType': 'video/webm'
  });
  const capture = {
    progress: 0,
    offset: 0,
    request() {
      recorder.requestData();
      clearTimeout(capture.id);
      setTimeout(capture.request, 10000);
    },
    download() {
      if (capture.progress === 0 && recorder.state === 'inactive') {
        const end = new Date();
        const filename = app.runtime.manifest.name + ' ' +
          end.toLocaleDateString().replace(/\//g, '_') + ' - ' +
          readable((end - player.start) / 1000) + '.webm';

        capture.file.download(filename, 'video/webm').then(() => capture.file.remove()).catch(e => {
          console.warn(e);
          notify.textContent = 'An error occurred during saving: ' + e.message;
        });
      }
    }
  };
  capture.file = new File();
  await capture.file.open();

  recorder.addEventListener('dataavailable', e => {
    if (e.data.size) {
      capture.progress += 1;
      const reader = new FileReader();
      reader.onload = e => {
        capture.file.chunks({
          offset: capture.offset,
          buffer: new Uint8Array(e.target.result)
        }).then(() => {
          capture.progress -= 1;
          capture.download();
        });
      };
      reader.readAsArrayBuffer(e.data);
      capture.offset += 1;
    }
  });
  recorder.addEventListener('stop', () => {
    clearTimeout(capture.id);
    capture.download();
  });

  record.recorder = recorder;
  stop.disabled = false;
  pause.disabled = false;
  record.disabled = true;
  document.body.dataset.recording = true;
  recorder.start();
  capture.request();
  document.title = 'Press ◼ to stop recording or press ❚❚ to pause recording';
  document.body.dataset.state = record.recorder.state;
});
stop.addEventListener('click', () => {
  record.recorder.stop();
  // try {
  //   record.stream.getTracks().forEach(e => e.stop());
  // }
  // catch (e) {}

  stop.disabled = true;
  pause.disabled = true;
  record.disabled = false;
  document.body.dataset.recording = false;
  document.title = 'Press ● to start a new recording';
});

audio.addEventListener('change', e => app.storage.set({
  audio: e.target.checked
}).then(() => location.reload()));

// save files from indexdb and remove the
{
  const restore = async () => {
    const os = 'databases' in indexedDB ? await indexedDB.databases() : Object.keys(localStorage)
      .filter(name => name.startsWith('file:'))
      .map(name => ({
        name: name.replace('file:', '')
      }));
    for (const o of os) {
      const file = new File(o.name);
      await file.open();
      try {
        await file.download('restored.webm', 'video/webm');
      }
      catch (e) {
        console.warn(e);
      }
      file.remove();
    }
  };
  restore();
}

document.getElementById('pause').addEventListener('click', e => {
  if (record.recorder.state === 'recording') {
    record.recorder.pause();
    player.pause();
    e.target.classList.add('active');
  }
  else {
    player.play();
    record.recorder.resume();
    e.target.classList.remove('active');
  }
  document.body.dataset.state = record.recorder.state;
});
