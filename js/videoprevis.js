'use strict';

const VideoPreview = (() => {
  function seconds(timecode) {
    const [hours, minutes, rest] = timecode.replace(',', '.').split(':').map(Number);
    return hours * 3600 + minutes * 60 + rest;
  }

  function mount({ panel, drop, input, video, mode, error, getSubtitles, t, onReadyChange, goToSegment, onGoToSegment }) {
    const track = video.addTextTrack('subtitles');
    let url = null;
    let frame = null;

    function currentSegment() {
      if (!ready() || mode.value === 'off') return -1;
      return getSubtitles(mode.value === 'original').findIndex(subtitle =>
        subtitle.text?.trim() && video.currentTime >= seconds(subtitle.start) &&
        video.currentTime < seconds(subtitle.end));
    }

    function updateNavigation() {
      goToSegment.disabled = currentSegment() < 0;
    }

    goToSegment.addEventListener('click', () => {
      const index = currentSegment();
      if (index >= 0) onGoToSegment(index);
    });
    for (const event of ['timeupdate', 'seeked', 'loadedmetadata', 'emptied']) {
      video.addEventListener(event, updateNavigation);
    }

    function refreshTrack() {
      frame = null;
      updateNavigation();
      track.mode = url && mode.value !== 'off' ? 'showing' : 'disabled';
      if (!url || mode.value === 'off') return;
      for (const cue of Array.from(track.cues || [])) track.removeCue(cue);
      for (const subtitle of getSubtitles(mode.value === 'original')) {
        const { text } = subtitle;
        const start = seconds(subtitle.start);
        const end = seconds(subtitle.end);
        if (!text?.trim() || !Number.isFinite(start) || !Number.isFinite(end) || end <= start) continue;
        const plain = text.replace(/<\/?(?:i|b|u)>|<\/?v(?:[ .][^>]*)?>/gi, '');
        track.addCue(new VTTCue(start, end, plain.replace(/[&<>]/g, char => ({
          '&': '&amp;', '<': '&lt;', '>': '&gt;',
        })[char])));
      }
    }

    function sync() {
      updateNavigation();
      if (url && frame === null) frame = requestAnimationFrame(refreshTrack);
    }

    function clear() {
      if (frame !== null) cancelAnimationFrame(frame);
      frame = null;
      const previousUrl = url;
      url = null;
      video.removeAttribute('src');
      video.hidden = true;
      if (previousUrl) {
        video.load();
        URL.revokeObjectURL(previousUrl);
      }
      track.mode = 'hidden';
      for (const cue of Array.from(track.cues || [])) track.removeCue(cue);
      track.mode = 'disabled';
      error.hidden = true;
      goToSegment.disabled = true;
      onReadyChange();
    }

    function loadFile(file) {
      if (!file) return;
      if (!/\.mp4$/i.test(file.name) && file.type !== 'video/mp4') {
        error.textContent = t('video.invalidFile');
        error.hidden = false;
        return;
      }
      clear();
      url = URL.createObjectURL(file);
      video.src = url;
      video.hidden = false;
      sync();
    }

    drop.addEventListener('click', e => { if (e.target !== input) input.click(); });
    drop.addEventListener('keydown', e => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      e.preventDefault();
      input.click();
    });
    drop.addEventListener('dragover', e => {
      e.preventDefault();
      drop.classList.add('over');
    });
    drop.addEventListener('dragleave', e => {
      if (!drop.contains(e.relatedTarget)) drop.classList.remove('over');
    });
    drop.addEventListener('drop', e => {
      e.preventDefault();
      drop.classList.remove('over');
      loadFile(e.dataTransfer.files[0]);
    });
    input.addEventListener('change', () => {
      const file = input.files[0];
      input.value = '';
      loadFile(file);
    });
    video.addEventListener('loadedmetadata', () => { if (url) onReadyChange(); });
    video.addEventListener('error', () => {
      if (!url) return;
      clear();
      error.textContent = t('video.error');
      error.hidden = false;
    });
    mode.addEventListener('change', sync);

    function ready() {
      return Boolean(url && video.readyState >= 1);
    }

    function seek(subtitle) {
      if (!ready()) return;
      const timing = mode.value === 'translation' ? (subtitle.targetTiming || subtitle) : subtitle;
      const start = seconds(timing.start);
      if (!Number.isFinite(start)) return;
      video.currentTime = start;
      panel.scrollIntoView({ block: 'nearest' });
      video.focus({ preventScroll: true });
    }

    return { clear, ready, seek, sync };
  }

  return { mount };
})();
