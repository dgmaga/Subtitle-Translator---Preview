'use strict';

const SpellCheck = (() => {
  const languages = new Set(['el', 'de', 'es', 'en']);
  const dictionaryLanguage = code => {
    const base = code.split('-')[0];
    return languages.has(base) ? base : '';
  };

  function mount({ button, dialog, getLanguage, getTexts, replaceText, t }) {
    const status = dialog.querySelector('[data-spell-status]');
    const result = dialog.querySelector('[data-spell-result]');
    let worker;
    let generation = 0;
    let session;

    function stop() {
      generation++;
      worker?.terminate();
      worker = null;
    }

    function personal(language) {
      try {
        const words = JSON.parse(localStorage.getItem(`subtitle.spelling.${language}`) || '[]');
        return Array.isArray(words) ? words : [];
      }
      catch { return []; }
    }

    function render() {
      result.replaceChildren();
      const issue = session.issues[0];
      if (!issue) {
        stop();
        status.textContent = t('spell.done');
        return;
      }
      const { language, texts, issues } = session;
      const normalized = issue.word.normalize('NFC').replace(/’/g, "'").toLocaleLowerCase(language);
      status.textContent = t('spell.found', { n: issues.length, cue: issue.index + 1, word: issue.word });
      const context = document.createElement('p');
      context.textContent = texts[issue.index];
      const replacement = document.createElement('input');
      replacement.value = issue.word;
      replacement.setAttribute('aria-label', t('spell.replacement'));
      const suggestions = document.createElement('select');
      suggestions.hidden = true;
      suggestions.setAttribute('aria-label', t('spell.suggestions'));
      suggestions.addEventListener('change', () => { replacement.value = suggestions.value; });
      session.suggestions = suggestions;
      const actions = document.createElement('div');
      actions.className = 'actions';
      function action(key, handler) {
        const control = document.createElement('button');
        control.type = 'button';
        control.className = 'btn sm';
        control.textContent = t(key);
        control.addEventListener('click', handler);
        actions.append(control);
      }
      action('spell.replace', () => {
        const value = replacement.value.trim();
        if (!value) return;
        const previous = texts[issue.index];
        const end = issue.offset + issue.word.length;
        const updated = previous.slice(0, issue.offset) + value + previous.slice(end);
        if (!replaceText(issue.index, previous, updated)) {
          status.textContent = t('spell.changed');
          result.replaceChildren();
          return;
        }
        texts[issue.index] = updated;
        issues.shift();
        for (const next of issues) {
          if (next.index !== issue.index) break;
          next.offset += value.length - issue.word.length;
        }
        render();
      });
      action('spell.ignore', () => { issues.shift(); render(); });
      action('spell.add', () => {
        try {
          localStorage.setItem(`subtitle.spelling.${language}`, JSON.stringify([...new Set([...personal(language), normalized])]));
        } catch {
          status.textContent = t('spell.storage');
          return;
        }
        session.issues = issues.filter(item => item.word.normalize('NFC').replace(/’/g, "'").toLocaleLowerCase(language) !== normalized);
        render();
      });
      result.append(context, suggestions, replacement, actions);
      worker.postMessage({ suggest: issue.word });
    }

    button.addEventListener('click', () => {
      stop();
      const request = generation;
      const language = dictionaryLanguage(getLanguage());
      const texts = getTexts();
      result.replaceChildren();
      dialog.showModal();
      if (!language) { status.textContent = t('spell.unsupported'); return; }
      if (!texts.some(text => text.trim())) { status.textContent = t('spell.empty'); return; }
      if (location.protocol === 'file:') { status.textContent = t('spell.local'); return; }
      status.textContent = t('spell.loading');
      const fail = () => {
        if (request !== generation) return;
        stop();
        result.replaceChildren();
        status.textContent = t('spell.error');
      };
      try {
        worker = new Worker('spellcheck-worker.js');
        worker.onerror = fail;
        worker.onmessage = ({ data }) => {
          if (request !== generation) return;
          if (data.error) return fail();
          if (data.suggestions) {
            const select = session.suggestions;
            if (!select?.isConnected || data.word !== session.issues[0]?.word || !data.suggestions.length) return;
            select.replaceChildren(new Option(t('spell.suggestions'), '', true, true),
              ...data.suggestions.map(word => new Option(word, word)));
            select.options[0].disabled = true;
            select.hidden = false;
            return;
          }
          session = { language, texts, issues: data.issues };
          render();
        };
        worker.postMessage({ language, texts, ignored: personal(language) });
      } catch { fail(); }
    });
    dialog.addEventListener('close', () => { stop(); session = null; result.replaceChildren(); });
  }

  return { mount };
})();
