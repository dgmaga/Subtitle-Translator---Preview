'use strict';

const LocalizationTools = (() => {
  const xmlEntities = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' };

  function escapeXml(value) {
    return value
      .replace(/[^\u0009\u000A\u000D\u0020-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/gu, '')
      .replace(/[&<>"]/g, character => xmlEntities[character]);
  }

  function hasTranslation(subtitle, translation, status) {
    return status === 'done' && Boolean(subtitle.text.trim() && translation?.trim());
  }

  function toTmx({ subtitles, translations, statuses, sourceLanguage, targetLanguage }) {
    const source = escapeXml(sourceLanguage);
    const target = escapeXml(targetLanguage);
    const units = [];
    subtitles.forEach((subtitle, index) => {
      const translation = translations[index];
      if (!hasTranslation(subtitle, translation, statuses[index])) return;
      units.push(
        '    <tu>',
        `      <tuv xml:lang="${source}"><seg>${escapeXml(subtitle.text)}</seg></tuv>`,
        `      <tuv xml:lang="${target}"><seg>${escapeXml(translation)}</seg></tuv>`,
        '    </tu>'
      );
    });
    return [
      '<?xml version="1.0" encoding="UTF-8"?>',
      '<tmx version="1.4">',
      `  <header creationtool="Subtitle Translator" creationtoolversion="2.1" segtype="block" o-tmf="Subtitle Translator" adminlang="en" srclang="${source}" datatype="PlainText"/>`,
      '  <body>',
      ...units,
      '  </body>',
      '</tmx>',
      '',
    ].join('\n');
  }

  async function saveTmx(name, content, sourceFileHandle) {
    const options = {
      suggestedName: name,
      types: [{ description: 'TMX', accept: { 'application/xml': ['.tmx'] } }],
    };
    if (sourceFileHandle) options.startIn = sourceFileHandle;
    const handle = await window.showSaveFilePicker(options);
    const writable = await handle.createWritable();
    await writable.write(content);
    await writable.close();
  }

  return { hasTranslation, toTmx, saveTmx };
})();
