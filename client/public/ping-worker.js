let intervalId;

self.addEventListener('message', (e) => {
  if (e.data === 'start') {
    intervalId = setInterval(() => {
      self.postMessage('ping');
    }, 10000);
  } else if (e.data === 'stop') {
    clearInterval(intervalId);
  }
});