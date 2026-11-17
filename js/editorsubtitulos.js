'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const $ = selector => document.querySelector(selector);
  const input = $('#editorFile');
  const drop = $('#editorDrop');
  const rows = $('#editorRows');
  const language = $('#uiLang');
  const status = $('#editorStatus');
  const fileInfo = $('#editorFileName');
  const buttons = [$('#editorSrt'), $('#editorVtt')];
  let subtitles = [];
  let fileName = '';
  let loadRequest = 0;
  let statusTimer;

  function notify(key, isError = false) {
    clearTimeout(statusTimer);
    status.textContent = t(key);
    status.classList.toggle('warn', isError);
    status.hidden = false;
    statusTimer = setTimeout(() => { status.hidden = true; }, 4000);
  }

  function updateLanguage() {
    setUiLang(language.value);
    document.documentElement.lang = language.value;
    document.title = t('editor.title');
    document.querySelectorAll('[data-i]').forEach(node => { node.innerHTML = t(node.dataset.i); });
    document.querySelectorAll('[data-i-aria]').forEach(node => node.setAttribute('aria-label', t(node.dataset.iAria)));
    status.hidden = true;
  }

  language.value = navigator.language.toLowerCase().startsWith('es') ? 'es' : 'en';
  language.addEventListener('change', updateLanguage);
  updateLanguage();

  const preview = VideoPreview.mount({
    panel: $('#videoPreview'),
    drop: $('#previewDrop'),
    input: $('#previewFile'),
    video: $('#previewVideo'),
    goToSegment: $('#goToSegment'),
    onGoToSegment: index => {
      const field = rows.querySelector('[data-index="' + index + '"] textarea');
      field?.scrollIntoView({ block: 'center' });
      field?.focus({ preventScroll: true });
    },
    mode: $('#previewMode'),
    error: $('#previewError'),
    getSubtitles: () => subtitles,
    t,
    onReadyChange: () => {
      rows.querySelectorAll('[data-seek]').forEach(button => { button.hidden = !preview.ready(); });
    },
  });

  function render() {
    const fragment = document.createDocumentFragment();
    subtitles.forEach((subtitle, index) => {
      const row = document.createElement('tr');
      row.innerHTML = `
        <td class="num"></td>
        <td class="trad">
          <textarea data-text data-i-aria="editor.text"></textarea>
          <form class="target-timing">
            <label><span data-i="timing.start"></span> <input name="start" spellcheck="false"></label>
            <label><span data-i="timing.end"></span> <input name="end" spellcheck="false"></label>
            <button class="btn sm" type="submit" data-i="timing.apply"></button>
          </form>
        </td>
        <td class="act"><button type="button" class="icon" data-seek data-i-aria="editor.seek">▶</button></td>`;
      row.dataset.index = index;
      row.querySelector('.num').textContent = index + 1;
      const text = row.querySelector('textarea');
      text.value = subtitle.text;
      text.rows = Math.max(2, subtitle.text.split('\n').length);
      row.querySelector('[name="start"]').value = subtitle.start;
      row.querySelector('[name="end"]').value = subtitle.end;
      row.querySelector('[data-seek]').hidden = !preview.ready();
      fragment.append(row);
    });
    rows.replaceChildren(fragment);
    updateLanguage();
    preview.sync();
  }

  async function openFile(file) {
    if (!file) return;
    const request = ++loadRequest;
    if (!/\.srt$/i.test(file.name)) return notify('editor.invalidFile', true);
    try {
      const parsed = Core.parseSubtitles(await file.text(), file.name);
      if (request !== loadRequest) return;
      if (!parsed.length) return notify('file.noSubs', true);
      subtitles = parsed;
      const detected = Core.detectLang(parsed);
      const spellingLanguage = $('#spellingLanguage');
      if ([...spellingLanguage.options].some(option => option.value === detected)) spellingLanguage.value = detected;
      fileName = file.name.replace(/\.srt$/i, '');
      fileInfo.textContent = file.name;
      fileInfo.hidden = false;
      document.body.classList.add('loaded');
      buttons.forEach(button => { button.disabled = false; });
      $('#sendTranslation').disabled = false;
      render();
    } catch {
      if (request === loadRequest) notify('editor.readError', true);
    }
  }

  drop.addEventListener('click', event => { if (event.target !== input) input.click(); });
  drop.addEventListener('keydown', event => {
    if (event.key !== 'Enter' && event.key !== ' ') return;
    event.preventDefault();
    input.click();
  });
  drop.addEventListener('dragover', event => {
    event.preventDefault();
    drop.classList.add('over');
  });
  drop.addEventListener('dragleave', event => {
    if (!drop.contains(event.relatedTarget)) drop.classList.remove('over');
  });
  drop.addEventListener('drop', event => {
    event.preventDefault();
    drop.classList.remove('over');
    openFile(event.dataTransfer.files[0]);
  });
  input.addEventListener('change', () => {
    openFile(input.files[0]);
    input.value = '';
  });

  function cueFor(element) {
    return subtitles[Number(element.closest('tr').dataset.index)];
  }

  rows.addEventListener('input', event => {
    const field = event.target;
    if (!field.matches('[data-text]')) return;
    cueFor(field).text = field.value;
    field.rows = Math.max(2, field.value.split('\n').length);
    preview.sync();
  });
  rows.addEventListener('submit', event => {
    event.preventDefault();
    const { start, end } = event.target.elements;
    const timing = Core.parseTargetTiming(start.value, end.value);
    if (!timing) return notify('timing.invalid', true);
    Object.assign(cueFor(event.target), timing);
    start.value = timing.start;
    end.value = timing.end;
    preview.sync();
    notify('editor.timingSaved');
  });
  rows.addEventListener('click', event => {
    const button = event.target.closest('[data-seek]');
    if (button) preview.seek(cueFor(button));
  });

  function download(extension, serialize, mime) {
    const content = serialize(subtitles, subtitles.map(cue => cue.text));
    const link = document.createElement('a');
    const url = URL.createObjectURL(new Blob([content], { type: mime + ';charset=utf-8' }));
    link.href = url;
    link.download = `${fileName}.edited.${extension}`;
    document.body.append(link);
    link.click();
    setTimeout(() => { URL.revokeObjectURL(url); link.remove(); }, 1000);
  }

  buttons[0].addEventListener('click', () => download('srt', Core.toSRT, 'application/x-subrip'));
  buttons[1].addEventListener('click', () => download('vtt', Core.toVTT, 'text/vtt'));

  $('#spellingLanguage').value = language.value;
  SpellCheck.mount({
    button: $('#checkSpelling'),
    dialog: $('#spellDialog'),
    getLanguage: () => $('#spellingLanguage').value,
    getTexts: () => subtitles.map(cue => cue.text),
    replaceText: (index, previous, updated) => {
      const cue = subtitles[index];
      if (!cue || cue.text !== previous) return false;
      cue.text = updated;
      const field = rows.querySelector(`[data-index="${index}"] textarea`);
      field.value = updated;
      field.rows = Math.max(2, updated.split('\n').length);
      preview.sync();
      return true;
    },
    t,
  });


  $('#sendTranslation').addEventListener('click', async () => {
    if (!subtitles.length) return;
    const src = $('#spellingLanguage').value;
    const project = {
      app: 'traductor-subtitulos', version: 2, fileName, src,
      tgt: Core.defaultTarget(src), notes: '', removeSpeakers: false,
      subs: subtitles.map(cue => ({ start: cue.start, end: cue.end, raw: cue.text })),
      out: subtitles.map(() => ''), st: subtitles.map(() => 'pending'),
    };
    Core.parseProject(project);
    const payload = { project, video: preview.getFile() };
    const button = $('#sendTranslation');
    button.disabled = true;
    try {
      const target = window.parent !== window ? window.parent : window.open('SubtitleTranslator.html', '_blank');
      if (!target) return notify('editor.popupBlocked', true);
      const accepted = await ProjectTransfer.send(target, payload);
      if (accepted) download('json', () => JSON.stringify(project), 'application/json');
    } catch {
      notify('editor.sendError', true);
    } finally {
      button.disabled = false;
    }
  });
  const keysDialog = $('#keysDlg');
  const providers = { anthropic: '#kAnthropic', openrouter: '#kOpenrouter', openai: '#kOpenai' };
  const keyStorage = 'ts2.keys';
  const rememberStorage = 'ts2.rememberKeys';
  const addressStorage = 'ts2.lmUrl';
  const defaultAddress = 'http://127.0.0.1:1234';
  let config = { remember: true, keys: {}, address: defaultAddress };
  try {
    const remember = JSON.parse(localStorage.getItem(rememberStorage) ?? 'true');
    config = {
      remember,
      keys: JSON.parse((remember ? localStorage : sessionStorage).getItem(keyStorage) || '{}') || {},
      address: JSON.parse(localStorage.getItem(addressStorage) || 'null') || defaultAddress,
    };
  } catch { /* Browser storage may be unavailable. */ }

  $('#openKeys').addEventListener('click', () => {
    for (const [provider, selector] of Object.entries(providers)) {
      const field = $(selector);
      field.type = 'password';
      field.value = config.keys[provider] || '';
    }
    $('#kLm').value = config.address;
    $('#kRemember').checked = config.remember;
    keysDialog.showModal();
  });
  $('#keysCancel').type = 'button';
  $('#keysCancel').addEventListener('click', () => keysDialog.close());
  keysDialog.querySelector('form').addEventListener('submit', event => {
    event.preventDefault();
    config = {
      remember: $('#kRemember').checked,
      keys: Object.fromEntries(Object.entries(providers).map(([provider, selector]) => [provider, $(selector).value.trim()])),
      address: $('#kLm').value.trim() || defaultAddress,
    };
    keysDialog.close();
    try {
      const destination = config.remember ? localStorage : sessionStorage;
      const previous = config.remember ? sessionStorage : localStorage;
      previous.removeItem(keyStorage);
      destination.setItem(keyStorage, JSON.stringify(config.keys));
      localStorage.setItem(rememberStorage, JSON.stringify(config.remember));
      localStorage.setItem(addressStorage, JSON.stringify(config.address));
      notify('keys.saved');
    } catch {
      notify('editor.storageError', true);
    }
  });
  keysDialog.querySelectorAll('[data-eye]').forEach(button => {
    button.addEventListener('click', () => {
      const field = document.getElementById(button.dataset.eye);
      field.type = field.type === 'password' ? 'text' : 'password';
    });
  });
});
