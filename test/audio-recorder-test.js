import { testFactory } from './helpers'
import { sourceDouble, workerAdapterDouble } from './doubles'
import AudioRecorder from '../src/audio-recorder'
import { InvalidStateError } from '../src/errors'

var object
const test = testFactory(
  function setup () {
    object = new AudioRecorder({
      source: sourceDouble,
      workerUri: 'audio-recorder-worker.js',
      workletUri: 'audio-recorder-worklet.js'
    })
    Object.defineProperty(object, 'workerAdapter', {
      value: workerAdapterDouble,
    })
  },
  function teardown () {
    workerAdapterDouble.message = () => {}
  }
)

test('`state` is initially `inactive`', (t) => {
  t.equal(object.state, 'inactive')
  t.end()
})

test('`constructor` sets up the `source` instance variable', (t) => {
  t.equal(object.source, sourceDouble)
  t.end()
})

test('`constructor` sets up the `context` instance variable', (t) => {
  t.equal(object.context, sourceDouble.context)
  t.end()
})

test('`start` sets the state to `recording`', (t) => {
  object.start()
  t.equal(object.state, 'recording')
  t.end()
})

test('`start` messages the processor', (t) => {
  workerAdapterDouble.message = (data) => {
    t.equal(data.type, 'record')
    t.equal(data.sliceSizeInSamples, null)
    t.end()
  }
  object.start()
})

test('`start` messages the processor with a slice size', (t) => {
  workerAdapterDouble.message = (data) => {
    t.equal(data.type, 'record')
    t.equal(data.sliceSizeInSamples, 44100)
    t.end()
  }
  object.start(1000)
})

test('`start` throws an error for an invalid state', (t) => {
  object.start()
  t.throws(() => object.start(), InvalidStateError)
  t.end()
})

test('`pause` sets the state to `paused`', (t) => {
  object.start()
  object.pause()
  t.equal(object.state, 'paused')
  t.end()
})

test('`pause` messages the processor', (t) => {
  object.start()
  workerAdapterDouble.message = (data) => {
    t.equal(data.type, 'pause')
    t.end()
  }
  object.pause()
})

test('`pause` throws an error for an invalid state', (t) => {
  t.throws(() => object.pause(), InvalidStateError)
  t.end()
})

test('`resume` sets the state to `recording`', (t) => {
  object.start()
  object.pause()
  object.resume()
  t.equal(object.state, 'recording')
  t.end()
})

test('`resume` messages the processor', (t) => {
  object.start()
  object.pause()
  workerAdapterDouble.message = (data) => {
    t.equal(data.type, 'resume')
    t.end()
  }
  object.resume()
})

test('`resume` throws an error for an invalid state', (t) => {
  t.throws(() => object.resume(), InvalidStateError)
  t.end()
})

test('`stop` sets the state to `inactive`', (t) => {
  object.start()
  object.stop()
  t.equal(object.state, 'inactive')
  t.end()
})

test('`stop` messages the processor', (t) => {
  object.start()
  workerAdapterDouble.message = (data) => {
    t.equal(data.type, 'stop')
    t.end()
  }
  object.stop()
})

test('`stop` throws an error for an invalid state', (t) => {
  t.throws(() => object.stop(), InvalidStateError)
  t.end()
})

test('`on` adds listeners', (t) => {
  t.same(object.listeners, {})
  function listener1 () {}
  function listener2 () {}
  function listener3 () {}
  object.on('start', listener1)
  object.on('dataavailable', listener2)
  object.on('dataavailable', listener3)
  t.equal(object.listeners.start[0], listener1)
  t.equal(object.listeners.dataavailable[0], listener2)
  t.equal(object.listeners.dataavailable[1], listener3)
  t.equal(object.listeners.start.length, 1)
  t.equal(object.listeners.dataavailable.length, 2)
  t.end()
})

test('`off` removes all listeners', (t) => {
  function listener1 () {}
  function listener2 () {}
  object.on('start', listener1)
  object.on('pause', listener2)
  object.off()
  t.equal(object.listeners.start, undefined)
  t.equal(object.listeners.pause, undefined)
  t.end()
})

test('`off` removes listeners for a given type', (t) => {
  function listener1 () {}
  function listener2 () {}
  object.on('dataavailable', listener1)
  object.on('dataavailable', listener2)
  object.off('dataavailable')
  t.equal(object.listeners.dataavailable, undefined)
  t.end()
})

test('`off` removes a specific listener', (t) => {
  function listener1 () {}
  function listener2 () {}
  object.on('dataavailable', listener1)
  object.on('dataavailable', listener2)
  object.off('dataavailable', listener1)
  t.equal(object.listeners.dataavailable[0], listener2)
  t.end()
})

test('`trigger` calls the listeners for a given type', (t) => {
  t.plan(2)
  function listener1 () { t.ok(true) }
  function listener2 () { t.ok(true) }
  object.on('dataavailable', listener1)
  object.on('dataavailable', listener2)
  object.trigger('dataavailable')
})

test('`trigger` calls the listeners with the given data', (t) => {
  const data = {}
  function listener (event) {
    t.equal(event.type, 'dataavailable')
    t.equal(event.data, data)
    t.end()
  }
  object.on('dataavailable', listener)
  object.trigger('dataavailable', data)
})
