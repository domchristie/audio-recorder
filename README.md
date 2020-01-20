Audio processing in the browser is relatively new. As such, the APIs are in flux and lack documentation, making it difficult to decide how to approach them.

For example, the `MediaRecorder` API aims to provide a simple mechanism for recording audio and video. Most modern browsers support it apart from Safari and Safari iOS, where it requires manually enabling via a developer flag. Not ideal, but we'll go along with it. Then we figure out that `MediaRecorder` output formats differ from browser to browser. This _might_ be fine, but for manipulating the generated recordings, it's necessary to know the format. The newness of these APIs means that it's unclear what the defaults are, or what formats each browser supports, leaving us a bit stuck.

At this stage, we might consider installing a library. For audio recording, [Recorder.js](https://github.com/mattdiamond/Recorderjs) is a popular choice, and outputs lossless recordings formatted as WAVs. Perfect, right? Unfortunately it is no longer maintained, and behind the scenes, uses the deprecated [`ScriptProcessorNode`](https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode). This API won't be disappearing anytime soon, but it's perhaps not ideal for the long-term. Maybe we could replace `ScriptProcessorNode` with its successor, `AudioWorkletProcessor`? Unfortunately not—it's only supported in recent versions of Chrome.

Once we've crawled out of this rabbit hole, we'd have probably forgotten how we got there, return to the `MediaRecorder` API, and face the same dilemmas all over again!

Todo: describe aims, explain architecture

---

Copyright © 2020+ Dom Christie
