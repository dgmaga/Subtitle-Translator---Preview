# Subtitle Translator and Editor

The project has two browser pages with English and Spanish interfaces.

- [Subtitle Translator](Traductor%20subtitulos.html) translates SRT and WebVTT files with an AI provider and supports 20 source and target language options.
- [Subtitle Editor](EditorSubt%C3%ADtulos.html) edits the text and timing of an SRT in its original language.

## Edit subtitles in one language

1. Open **Subtitle Editor** and drop an SRT onto the subtitle box or click the box to browse.
2. Edit the text directly in each row. To adjust timing, enter **Start** and **End** as `HH:MM:SS,mmm` and select **Apply timing**.
3. Optionally load a matching MP4 and use the play icon beside a cue to check its position in the video. Switch between **Edited subtitles** and **No subtitles**.
4. Download the edited text and timings as `.edited.srt` or `.edited.vtt`.

The editor's **API keys** dialog can store provider settings for future use. Editing, preview, spelling, and export run without an AI provider.

## Check spelling

Both pages support Spanish, English (US), Modern Greek, and German spelling review. The translator checks completed translations in the target language. The editor has a **Spelling language** selector. Click **Check spelling** to review each flagged word in context, select a suggestion or type a replacement, skip the occurrence, or add the word to your browser's personal dictionary for that language.

Serve the project folder over HTTP or HTTPS so the browser can load the spelling worker and dictionaries. For offline use, run `python -m http.server 8000 --bind 127.0.0.1` in the project folder and open either page via `http://127.0.0.1:8000/`. Only dictionary and application files are requested from the server. Spelling runs in the browser.

The bundled engine is [Typo.js 1.4.0](https://github.com/cfinke/Typo.js). The [Hunspell dictionary packages](https://github.com/wooorm/dictionaries) are `dictionary-el` 4.0.0, `dictionary-de` 3.0.0, `dictionary-es` 4.0.0, and `dictionary-en` 4.0.0. The engine code is in `js/typo.js`. Source attributions and licenses are in [dictionaries/](dictionaries/).

## Set up the translator

1. Open [Traductor subtitulos.html](Traductor%20subtitulos.html) in a browser. Keep the project files and dictionary folders together. The pages need no build step.
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
| **Download .srt** | Translated subtitles with any timing adjustments applied. Untranslated cues fall back to the source text. |
| **.vtt** | Translated subtitles at the source times. Untranslated cues fall back to the source text. |
| **Bilingual .srt** | The translation followed by the source text in each cue. |
| **Download TMX** | A translation memory with one source–translation pair per completed cue, including manual edits. Timestamps and untranslated cues are omitted. |
| **Clean original .srt** | Source subtitles with detected speaker labels removed when that option is enabled. |
| **Save project** | A JSON file containing the original cues, translations, timing adjustments, progress, languages, and video notes. Import it later to continue. |

The app also autosaves the current project in browser storage when space allows and can import older `.wrk` projects. **Clear translation** keeps the subtitle file loaded so you can translate it again. **Start over** clears the current project and its autosave.

In browsers with file picker support, **Download TMX** opens a Save As dialog. It starts in the original subtitle's folder when the browser provides access to that location. For restored projects or files opened without folder access, choose the folder in the dialog. Browsers without Save As support for web apps use their usual download settings.

WebVTT exports regenerate the file from cue text and timings. They omit original cue identifiers, positioning settings, and file-level styling.

## Preview with a video

On either page, drop a matching local MP4 into **Video preview** or click the box to browse. The translator offers **Translation**, **Original**, and **No subtitles**. The player reflects text edits, including spelling corrections. Once the video is ready, the play icon on each row jumps to that cue. The video stays on your device, so select the MP4 again after reopening a project.

To retime a translation, edit **Start** and **End** in its row using `HH:MM:SS,mmm`, then select **Apply timing**. The translated preview and translated SRT use the adjusted times. The original preview and other subtitle exports use the source times. Saved projects retain timing edits for later review.

## Privacy

The app sends subtitle text, translation context, and any notes or glossary entries directly to the selected engine. With LM Studio running on your computer, those requests stay local. API keys are stored in browser local storage when **Remember keys in this browser** is selected and in session storage otherwise. Project exports contain subtitle text and translations. API keys are stored separately from projects.

## Project files

| Path | Purpose |
| --- | --- |
| [Traductor subtitulos.html](Traductor%20subtitulos.html) | Browser entry point and interface markup. |
| [EditorSubtítulos.html](EditorSubt%C3%ADtulos.html) and [editorsubtitulos.js](js/editorsubtitulos.js) | Monolingual editing interface, timing controls, and export. |
| [app.js](js/app.js) | Subtitle parsing, provider requests, batch processing, review, project storage, and export. |
| [i18n.js](js/i18n.js) | English and Spanish interface text. |
| [Localizationtools.js](js/Localizationtools.js) | TMX translation memory export. |
| [videoprevis.js](js/videoprevis.js) | Local MP4 player and synchronized subtitle preview. |
| [spellcheck.js](js/spellcheck.js), [spellcheck-worker.js](js/spellcheck-worker.js), and [dictionaries/](dictionaries/) | Spelling review, browser-side checking, and bundled dictionaries. |
| [styles.css](styles.css) | Responsive layout and light and dark styling. |
| [Pruebas/](Pruebas/) | Greek and German sample subtitle files for trying the workflow. |

## Credits

This copy comes from [David Arribas's subtitle translator](https://github.com/davidarribas/traductor-de-subtitulos). The app credits [TTomas65's Subtitle Translator for LM Studio](https://github.com/TTomas65/Subtitle-Translator-for-LM-Studio) as its upstream project and identifies the license as MIT.
