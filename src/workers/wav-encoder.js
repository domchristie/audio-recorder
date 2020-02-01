import Sample from './sample'

export default class {
  encode (channels, sampleRate) {
    this.bitDepth = 16
    this.sampleRate = sampleRate
    this.channelCount = channels.length
    this.samples = this.interleave(channels)
    this.buffer = new ArrayBuffer(44 + this.samples.length * 2)
    this.view = new DataView(this.buffer)

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
    }, 0)

    const interleaved = new Float32Array(length)
    let index = 0
    let inputIndex = 0

    while (index < length) {
      channels.forEach((samples, i) => {
        interleaved[index++] = samples[inputIndex]
      })
      inputIndex++
    }

    return interleaved
  }

  toBuffer () {
    /* RIFF identifier */
    this._setString(0, 'RIFF')
    /* RIFF chunk length */
    this._setUint32(4, 36 + this.samples.length * 2, true)
    /* RIFF type */
    this._setString(8, 'WAVE')
    /* format chunk identifier */
    this._setString(12, 'fmt ')
    /* format chunk length */
    this._setUint32(16, 16, true)
    /* sample format (raw) */
    this._setUint16(20, 1, true)
    /* channel count */
    this._setUint16(22, this.channelCount, true)
    /* sample rate */
    this._setUint32(24, this.sampleRate, true)
    /* byte rate (sample rate * block align) */
    this._setUint32(28, this.sampleRate * this.blockAlign, true)
    /* block align (channel count * bytes per sample) */
    this._setUint16(32, this.blockAlign, true)
    /* bits per sample */
    this._setUint16(34, 16, true)
    /* data chunk identifier */
    this._setString(36, 'data')
    /* data chunk length */
    this._setUint32(40, this.samples.length * this.bytesPerSample, true)

    let offset = 44
    for (var i = 0; i < this.samples.length; i++, offset += 2) {
      let sample = new Sample(this.samples[i])
      this._setInt16(offset, sample.toInt(this.bitDepth), true)
    }

    return this.buffer
  }

  _setUint8 (offset, int) {
    this.view.setUint8(offset, int)
  }

  _setUint16 (offset, int, littleEndian) {
    this.view.setUint16(offset, int, littleEndian)
  }

  _setUint32 (offset, int, littleEndian) {
    this.view.setUint32(offset, int, littleEndian)
  }

  _setInt16 (offset, int, littleEndian) {
    this.view.setInt16(offset, int, littleEndian)
  }

  _setString (offset, string) {
    for (var i = 0; i < string.length; i++) {
      this._setUint8(offset + i, string.charCodeAt(i))
    }
  }
}
