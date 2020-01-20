import ProcessorProxy from './processor-proxy'
import { InvalidStateError } from './errors'

export default class {
  constructor (options) {
    this.state = 'inactive'
    this.workletUri = options.workletUri
    this.workerUri = options.workerUri
    this.source = options.source
    this.context = this.source.context
    this.listeners = {}
  }

  get processor () {
    return this._processor = this._processor || new ProcessorProxy(this, this.workletUri, this.workerUri)
  }

  start (timeslice) {
    if (this.state !== 'inactive') this._throwInvalidStateErrorFor('start')
    this.state = 'recording'

    this.processor.message({
      type: 'record',
      sliceSizeInSamples: timeslice ? (this.context.sampleRate / 1000) * timeslice : null
    })
  }

  pause () {
    if (this.state === 'inactive') this._throwInvalidStateErrorFor('pause')
    this.state = 'paused'
    this.processor.message({ type: 'pause' })
  }

  resume () {
    if (this.state === 'inactive') this._throwInvalidStateErrorFor('resume')
    this.state = 'recording'
    this.processor.message({ type: 'resume' })
  }

  stop () {
    if (this.state === 'inactive') this._throwInvalidStateErrorFor('stop')
    this.state = 'inactive'
    this.processor.message({ type: 'stop' })
  }

  on (type, listener) {
    (this.listeners[type] = this.listeners[type] || []).push(listener)
  }

  off (type, listener) {
    if (!type) {
      this.listeners = {}
      return
    }
    if (listener) {
      this.listeners[type] = (this.listeners[type] || []).filter(l => l !== listener)
    } else {
      delete this.listeners[type]
    }
  }

  trigger (type, data) {
    (this.listeners[type] || []).forEach((listener) => {
      listener({ type: type, data: data })
    })
  }

  _throwInvalidStateErrorFor (action) {
    throw new InvalidStateError(`Failed to execute '${action}' on 'AudioRecorder': The AudioRecorder's state is '${this.state}'.`)
  }
}
