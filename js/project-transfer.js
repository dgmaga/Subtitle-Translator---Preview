'use strict';

const ProjectTransfer = (() => {
  function send(target, payload) {
    const id = crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random();
    const origin = location.protocol === 'file:' ? '*' : location.origin;
    return new Promise((resolve, reject) => {
      function message(event) {
        if (event.source !== target || event.data?.type !== 'subtitle-transfer-result' || event.data.id !== id) return;
        cleanup();
        if (event.data.error) reject(new Error(event.data.error));
        else resolve(event.data.accepted);
      }
      function cleanup() {
        clearInterval(timer);
        clearTimeout(timeout);
        window.removeEventListener('message', message);
      }
      const transmit = () => target.postMessage({ type: 'subtitle-transfer', id, payload }, origin);
      window.addEventListener('message', message);
      const timer = setInterval(transmit, 400);
      const timeout = setTimeout(() => { cleanup(); reject(new Error('Translator did not respond')); }, 20000);
      transmit();
    });
  }

  function receive(allowedSource, accept) {
    const results = new Map();
    window.addEventListener('message', async event => {
      const data = event.data;
      if (data?.type !== 'subtitle-transfer' || typeof data.id !== 'string' ||
          !allowedSource(event.source) ||
          (location.protocol !== 'file:' && event.origin !== location.origin)) return;
      if (!results.has(data.id)) {
        results.set(data.id, Promise.resolve().then(() => accept(data.payload))
          .then(accepted => ({ accepted }), () => ({ error: 'Could not transfer project' })));
      }
      const result = await results.get(data.id);
      event.source.postMessage({ type: 'subtitle-transfer-result', id: data.id, ...result },
        event.origin === 'null' ? '*' : event.origin);
    });
  }
  return { send, receive };
})();