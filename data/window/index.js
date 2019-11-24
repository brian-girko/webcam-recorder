/* globals app */
'use strict';

const record = document.getElementById('record');
const stop = document.getElementById('stop');
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
  player.start = new Date();
  document.title = 'Press ● to start recording';
}).catch(e => {
  notify.textContent = e.message;
}));

record.addEventListener('click', () => {
  const recorder = new MediaRecorder(player.srcObject, {
    'mimeType': 'video/webm'
  });
  const blobs = [];
  recorder.addEventListener('dataavailable', e => {
    blobs.push(e.data);
  });
  recorder.addEventListener('stop', () => {
    const end = new Date();
    const a = document.createElement('a');
    const blob = new Blob(blobs, {
      type: 'video/webm'
    });
    a.href = URL.createObjectURL(blob);
    a.download = app.runtime.manifest.name + ' ' +
      end.toLocaleDateString() + ' - ' +
      readable((end - player.start) / 1000) + '.webm';
    a.click();
    window.setTimeout(() => {
      URL.revokeObjectURL(a.href);
      a.remove();
    }, 10000);
  });

  record.recorder = recorder;
  stop.disabled = false;
  record.disabled = true;
  document.body.dataset.recording = true;
  recorder.start();
  document.title = 'Press ◼ to stop recording';
});
stop.addEventListener('click', () => {
  record.recorder.stop();
  stop.disabled = true;
  record.disabled = false;
  document.body.dataset.recording = false;
  document.title = 'Press ● to start a new recording';
});

audio.addEventListener('change', e => app.storage.set({
  audio: e.target.checked
}).then(() => location.reload()));
