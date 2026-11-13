'use strict';

importScripts('dictionaries/typo-js/typo.js');

let dictionary;
let loadedLanguage;

async function loadDictionary(language) {
  if (language === loadedLanguage) return;
  const files = await Promise.all(['aff', 'dic'].map(async extension => {
    const response = await fetch(`dictionaries/${language}/index.${extension}`);
    if (!response.ok) throw new Error('Dictionary unavailable');
    return response.text();
  }));
  dictionary = new Typo(language, ...files);
  loadedLanguage = language;
}

self.onmessage = async ({ data }) => {
  try {
    if (data.suggest) {
      self.postMessage({ word: data.suggest, suggestions: dictionary.suggest(data.suggest.normalize('NFC').replace(/’/g, "'"), 5) });
      return;
    }
    const { language, texts, ignored } = data;
    await loadDictionary(language);
    const skip = new Set(ignored);
    const checked = new Map();
    const issues = [];
    texts.forEach((text, index) => {
      for (const token of text.matchAll(/<[^>]*>|\{[^}]*\}|&(?:#\w+|[a-z]+);|https?:\/\/[^\s<>]+|\p{L}[\p{L}\p{M}]*(?:['’]\p{L}[\p{L}\p{M}]*)*/gu)) {
        const word = token[0];
        if (!/^\p{L}/u.test(word) || word.startsWith('http:') || word.startsWith('https:')) continue;
        const normalized = word.normalize('NFC').replace(/’/g, "'");
        if (skip.has(normalized.toLocaleLowerCase(language))) continue;
        if (!checked.has(normalized)) checked.set(normalized, dictionary.check(normalized));
        if (!checked.get(normalized)) issues.push({ index, offset: token.index, word });
      }
    });
    self.postMessage({ issues });
  } catch {
    self.postMessage({ error: true });
  }
};
