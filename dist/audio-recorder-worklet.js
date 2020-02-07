class Buffer {
  constructor () {
    this.reset();
  }

  reset () {
    this.channels = [];
    this.sampleCount = 0;
  }

  feed (channels) {
    channels.forEach((samples, i) => {
      this.channels[i] = this.channels[i] || [];
      this.channels[i].push(samples);
    });
    this.sampleCount += channels[0].length;
  }

  dump () {
    return this.channels.map((frames) => {
      // Reduce 2-dimensional array down to a single Float32Array
      let offset = 0;
      return frames.reduce((merged, samples) => {
        merged.set(samples, offset);
        offset += samples.length;
        return merged
      }, new Float32Array(this.sampleCount))
    })
  }
}

class Sample {
  constructor (float) {
    this.float = float;
  }

  toInt (base) {
    const s = Math.max(-1, Math.min(1, this.float));
    return s < 0 ? s * Math.pow(2, base - 1) : s * (Math.pow(2, base - 1) - 1)
  }
}

class WavEncoder {
  encode (channels, sampleRate) {
    this.bitDepth = 16;
    this.sampleRate = sampleRate;
    this.channelCount = channels.length;
    this.samples = this.interleave(channels);
    this.buffer = new ArrayBuffer(44 + this.samples.length * 2);
    this.view = new DataView(this.buffer);

    return this.toBuffer()
  }

  get bytesPerSample () {
    return this.bitDepth / 8
  }

  get blockAlign () {
    return this.channelCount * this.bytesPerSample
  }

  interleave(channels) {
    const length = channels.reduce((accumulator, samples) => {
      return accumulator += samples.length
    }, 0);

    const interleaved = new Float32Array(length);
    let index = 0;
    let inputIndex = 0;

    while (index < length) {
      channels.forEach((samples, i) => {
        interleaved[index++] = samples[inputIndex];
      });
      inputIndex++;
    }

    return interleaved
  }

  toBuffer () {
    /* RIFF identifier */
    this._setString(0, 'RIFF');
    /* RIFF chunk length */
    this._setUint32(4, 36 + this.samples.length * 2, true);
    /* RIFF type */
    this._setString(8, 'WAVE');
    /* format chunk identifier */
    this._setString(12, 'fmt ');
    /* format chunk length */
    this._setUint32(16, 16, true);
    /* sample format (raw) */
    this._setUint16(20, 1, true);
    /* channel count */
    this._setUint16(22, this.channelCount, true);
    /* sample rate */
    this._setUint32(24, this.sampleRate, true);
    /* byte rate (sample rate * block align) */
    this._setUint32(28, this.sampleRate * this.blockAlign, true);
    /* block align (channel count * bytes per sample) */
    this._setUint16(32, this.blockAlign, true);
    /* bits per sample */
    this._setUint16(34, 16, true);
    /* data chunk identifier */
    this._setString(36, 'data');
    /* data chunk length */
    this._setUint32(40, this.samples.length * this.bytesPerSample, true);

    let offset = 44;
    for (var i = 0; i < this.samples.length; i++, offset += 2) {
      let sample = new Sample(this.samples[i]);
      this._setInt16(offset, sample.toInt(this.bitDepth), true);
    }

    return this.buffer
  }

  _setUint8 (offset, int) {
    this.view.setUint8(offset, int);
  }

  _setUint16 (offset, int, littleEndian) {
    this.view.setUint16(offset, int, littleEndian);
  }

  _setUint32 (offset, int, littleEndian) {
    this.view.setUint32(offset, int, littleEndian);
  }

  _setInt16 (offset, int, littleEndian) {
    this.view.setInt16(offset, int, littleEndian);
  }

  _setString (offset, string) {
    for (var i = 0; i < string.length; i++) {
      this._setUint8(offset + i, string.charCodeAt(i));
    }
  }
}

var encoders = {
  'audio/wav': WavEncoder
};

class Processor {
  constructor (worker) {
    this.worker = worker;
    this.recording = false;
  }

  get buffer () {
    return this._buffer = this._buffer || new Buffer()
  }

  get encoder () {
    return this._encoder = this._encoder || new encoders[this.mimeType]()
  }

  message (event) {
    switch (event.data.type) {
    case 'initialize':
      for (var key in event.data.attributes) {
        this[key] = event.data.attributes[key];
      }
      break
    case 'record':
      this.reset();
      this.sliceSizeInSamples = event.data.sliceSizeInSamples;
      this.recording = true;
      this.worker.message({ type: 'start' });
      break
    case 'pause':
      this.recording = false;
      this.worker.message({ type: 'pause' });
      break
    case 'resume':
      this.recording = true;
      this.worker.message({ type: 'resume' });
      break
    case 'stop':
      this.recording = false;
      this.dump();
      this.worker.message({ type: 'stop' });
      break
    case 'process':
      this.process(event.data.input);
      break
    case 'dump':
      this.dump();
      break
    }
  }

  process (input) {
    if (!this.recording) return

    this.buffer.feed(input);

    if (this.sliceSizeInSamples && this.buffer.sampleCount >= this.sliceSizeInSamples) {
      this.dump();
      this.reset();
    }

    return true
  }

  dump () {
    this.worker.message({
      type: 'dataavailable',
      buffer: this.encoder.encode(this.buffer.dump(), this.sampleRate)
    });
  }

  reset () {
    this.buffer.reset();
  }
}

class Worklet extends AudioWorkletProcessor {
  constructor() {
    super();
    this.processor = new Processor(this);
    this.port.onmessage = (event) => this.processor.message(event);
  }

  process (inputs) {
    this.processor.process(inputs[0]);
    return true
  }

  message (data) {
    this.port.postMessage(data);
  }
}

registerProcessor('audio-recorder-worklet', Worklet);
