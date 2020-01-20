import Buffer from './buffer'
import encoders from './encoders'

export default class {
  constructor (delegate) {
    this.delegate = delegate
    this.recording = false
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
        this[key] = event.data.attributes[key]
      }
      break
    case 'record':
      this.reset()
      this.sliceSizeInSamples = event.data.sliceSizeInSamples
      this.recording = true
      this.delegate.message({ type: 'start' })
      break
    case 'pause':
      this.recording = false
      this.delegate.message({ type: 'pause' })
      break
    case 'resume':
      this.recording = true
      this.delegate.message({ type: 'resume' })
      break
    case 'stop':
      this.recording = false
      this.dump()
      this.delegate.message({ type: 'stop' })
      break
    case 'process':
      this.process(event.data.input)
      break
    case 'dump':
      this.dump()
      break
    }
  }

  process (input) {
    if (!this.recording) return

    this.buffer.feed(input)

    if (this.sliceSizeInSamples && this.buffer.sampleCount >= this.sliceSizeInSamples) {
      this.dump()
      this.reset()
    }

    return true
  }

  dump () {
    this.delegate.message({
      type: 'dataavailable',
      buffer: this.encoder.encode(this.buffer.dump(), this.sampleRate)
    })
  }

  reset () {
    this.buffer.reset()
  }
}
