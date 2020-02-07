# Audio Recorder

An alternative to the `MediaRecorder` API for capturing audio. It wraps the well supported (but deprecated) [`ScriptProcessorNode`](https://developer.mozilla.org/en-US/docs/Web/API/ScriptProcessorNode) as well as the newer (but poorly supported) [`AudioWorkletNode`](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletNode)/[`AudioWorkletProcessor`](https://developer.mozilla.org/en-US/docs/Web/API/AudioWorkletProcessor).

## Getting Started

The library consists of 3 files:

- `audio-recorder.js`: the main entry point
- `audio-recorder-worklet.js`: used in the most recent browsers
- `audio-recorder-worker.js`: used browsers that don't support Audio Worklets

The worklet and worker files need to be referencable via a URI.

### Basic Usage

Import the library, then instantiate an `AudioRecorder`, passing in the [streaming audio source node](https://developer.mozilla.org/en-US/docs/Web/API/MediaStreamAudioSourceNode) and the worker URIs:

```js
import AudioRecorder from './path/to/audio-recorder'

const audioRecorder = new AudioRecorder({
  source: source,
  workletUri: 'path/to/audio-recorder-worklet.js',
  workerUri: 'path/to/audio-recorder-worker.js'
})
```

Start the recording and capture the data when available:

```js
audioRecorder.on('dataavailable', function () {
  const blob = new Blob([event.data.buffer], { type: 'audio/wav' })
})

audioRecorder.start()
```

Stop the recording when done:

```js
audioRecorder.stop()
```

Todo: detail methods

---

Copyright © 2020+ Dom Christie
