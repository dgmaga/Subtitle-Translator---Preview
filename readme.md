# Subtitle Translator

Subtitle Translator is a browser-based tool for translating SubRip (`.srt`) and WebVTT (`.vtt`) subtitle files with AI. It keeps the start and end times of each cue and lets you review and edit translations before downloading them. The interface is available in English and Spanish, with 20 source and target language options, including Greek.

## Get started

1. Open [Traductor subtitulos.html](Traductor%20subtitulos.html) in a browser. Keep `app.js`, `i18n.js`, `Localizationtools.js`, and `styles.css` in the same folder. The app requires no build step or application server.
2. Choose a translation engine and model. For Claude (Anthropic), OpenRouter, or OpenAI, enter your provider's API key under **API keys**. Cloud usage may incur charges from the provider.
3. For local translation, start the LM Studio server with a chat model available and **Enable CORS** turned on. Select **LM Studio** in the app, set the server address under **API keys** if needed, and refresh the model list. The default address is `http://127.0.0.1:1234`.

If your browser blocks requests from a page opened directly from disk, you can serve the folder over HTTP. For example, with Python installed, run `python -m http.server 8000 --bind 127.0.0.1` from the project folder and open `http://127.0.0.1:8000/Traductor%20subtitulos.html`.

## Translate and review

1. Drop an `.srt` or `.vtt` file onto the page, or use the file picker. The app guesses the source language and suggests a target. It recognizes Greek when most letters in the sampled cues use the Greek script. Check both selections before translating. If speaker labels are detected, the app offers to strip them and enables that option by default.
2. Add optional notes about the video, its speakers, or the desired tone. Enter glossary terms one per line in the form `source = translation`.
3. Click **Translate**. The app sends cues in batches, tracks progress, and shows token usage and cost estimates where pricing or usage data is available. You can pause and continue, or use **Retry failed lines** when there are failed cues.
4. Review the original and translated text side by side. Edit a translation directly or use the row's refresh button to translate that cue again. You can filter for untranslated or failed cues, search both columns, and replace text across translations.

**Advanced options** let you set the batch size, parallel requests, a character-per-line target, and whether to send the full transcript as context. LM Studio uses one request at a time. The app uses nearby cues when full-transcript context is disabled or exceeds its estimated size limit. The character target is an instruction to the model, and temperature is adjustable for supported models.

## Export and resume

| Option | What it saves |
| --- | --- |
| **Download .srt** or **.vtt** | Translated subtitles with the original cue timing. Untranslated cues fall back to the source text. |
| **Bilingual .srt** | The translation followed by the source text in each cue. |
| **Download TMX** | A translation memory with one source–translation pair per completed cue, including manual edits. Timestamps and untranslated cues are omitted. |
| **Clean original .srt** | Source subtitles with detected speaker labels removed when that option is enabled. |
| **Save project** | A JSON file containing the original cues, translations, progress, languages, and video notes. Import it later to continue. |

The app also autosaves the current project in browser storage when space allows and can import older `.wrk` projects. **Clear translation** keeps the subtitle file loaded so you can translate it again. **Start over** clears the current project and its autosave.

In browsers with file picker support, **Download TMX** opens a Save As dialog. It starts in the original subtitle's folder when the browser provides access to that location. For restored projects or files opened without folder access, choose the folder in the dialog. Browsers without Save As support for web apps use their usual download settings.

WebVTT exports regenerate the file from cue text and timings. They omit original cue identifiers, positioning settings, and file-level styling. The app takes subtitle files as input. To work with a video, first supply its subtitles as a separate file.

## Privacy

The app sends subtitle text, translation context, and any notes or glossary entries directly to the selected engine. With LM Studio running on your computer, those requests stay local. API keys are stored in browser local storage when **Remember keys in this browser** is selected and in session storage otherwise. Project exports contain subtitle text and translations. API keys are stored separately from projects.

## Project files

| Path | Purpose |
| --- | --- |
| [Traductor subtitulos.html](Traductor%20subtitulos.html) | Browser entry point and interface markup. |
| [app.js](app.js) | Subtitle parsing, provider requests, batch processing, review, project storage, and export. |
| [i18n.js](i18n.js) | English and Spanish interface text. |
| [Localizationtools.js](Localizationtools.js) | TMX translation memory export. |
| [styles.css](styles.css) | Responsive layout and light and dark styling. |
| [Pruebas/](Pruebas/) | Greek and German sample subtitle files for trying the workflow. |

## Credits

This copy comes from [David Arribas's subtitle translator](https://github.com/davidarribas/traductor-de-subtitulos). The app credits [TTomas65's Subtitle Translator for LM Studio](https://github.com/TTomas65/Subtitle-Translator-for-LM-Studio) as its upstream project and identifies the license as MIT.
