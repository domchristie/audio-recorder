import { testFactory } from './helpers'
import {
  processorProxyDouble,
  bufferDouble,
  encoderDouble
} from './doubles'
import Processor from '../src/processor'

function event (data) {
  return { data: data }
}

const channel = new Float32Array(2)
channel.set([0.0, 0.0], 0)
const input = [channel]

let object
const test = testFactory(
  function setup () {
    object = new Processor(processorProxyDouble)
  },
  function teardown () {
    processorProxyDouble.message = (() => {})
  }
)

test('`recording` is initially false', (t) => {
  t.notOk(object.recording)
  t.end()
})

test('`constructor` sets `delegate`', (t) => {
  t.equal(object.delegate, processorProxyDouble)
  t.end()
})

test('`initialize` message sets up attributes', (t) => {
  object.message(event({
    type: 'initialize',
    attributes: { sampleRate: 44100 }
  }))
  t.equal(object.sampleRate, 44100)
  t.end()
})

test('`record` message calls `reset`', (t) => {
  object.reset = () => {
    t.pass()
    t.end()
  }
  object.message(event({ type: 'record' }))
})

test('`record` message sets the `sliceSizeInSamples`', (t) => {
  object.message(event({
    type: 'record',
    sliceSizeInSamples: 88200
  }))
  t.equal(object.sliceSizeInSamples, 88200)
  t.end()
})

test('`record` message sets the `recording` to `true`', (t) => {
  object.message(event({ type: 'record' }))
  t.ok(object.recording)
  t.end()
})

test('`record` message notifies the delegate', (t) => {
  object.delegate.message = (event) => {
    t.equal(event.type, 'start')
    t.end()
  }
  object.message(event({ type: 'record' }))
})

test('`pause` message sets the `recording` to `false`', (t) => {
  object.message(event({ type: 'pause' }))
  t.notOk(object.recording)
  t.end()
})

test('`pause` message notifies the delegate', (t) => {
  object.delegate.message = (event) => {
    t.equal(event.type, 'pause')
    t.end()
  }
  object.message(event({ type: 'pause' }))
})

test('`resume` message sets the `recording` to `true`', (t) => {
  object.message(event({ type: 'resume' }))
  t.ok(object.recording)
  t.end()
})

test('`resume` message notifies the delegate', (t) => {
  object.delegate.message = (event) => {
    t.equal(event.type, 'resume')
    t.end()
  }
  object.message(event({ type: 'resume' }))
})

const stopTest = testFactory(
  function setup (t) {
    object = new Processor(processorProxyDouble)
    object.dump = () => t.pass()
  }
)

stopTest('`stop` message sets the `recording` to `false`', (t) => {
  object.message(event({ type: 'stop' }))
  t.notOk(object.recording)
  t.end()
})

stopTest('`stop` message notifies the delegate', (t) => {
  object.delegate.message = (event) => {
    t.equal(event.type, 'stop')
    t.end()
  }
  object.message(event({ type: 'stop' }))
  object.delegate.message = () => {}
})

stopTest('`stop` calls `dump`', (t) => {
  t.plan(1)
  object.message(event({ type: 'stop' }))
  t.end()
})

test('`process` message calls process with the input', (t) => {
  t.plan(1)
  const input = []
  object.process = (_input) => t.equal(_input, input)
  object.message(event({ type: 'process', input: input }))
})

test('`dump` message calls `dump`', (t) => {
  object = new Processor(processorProxyDouble)
  object.dump = () => t.pass()
  object.message(event({ type: 'dump' }))
  t.end()
})

const processTest = testFactory(
  function setup (t) {
    object = new Processor(processorProxyDouble)
    object.dump = () => t.pass('processor#dump called')
    object.reset = () => t.pass('processor#reset called')
    Object.defineProperty(object, 'buffer', {
      value: bufferDouble
    })
    bufferDouble.feed = (i) => t.equal(i, input)
  }
)

processTest('`process` returns early unless recording', (t) => {
  t.notOk(object.recording)
  t.equals(object.process(input), undefined)
  t.end()
})

processTest('`process` returns `true`', (t) => {
  object.recording = true
  t.ok(object.process(input))
  t.end()
})

processTest('`process` feeds the `buffer`', (t) => {
  t.plan(1)
  object.recording = true
  object.process(input)
  t.end()
})

processTest('`process` dumps and resets if the `buffer` size is greater than the target slice size', (t) => {
  t.plan(2)
  object.recording = true
  object.sliceSizeInSamples = 1
  bufferDouble.feed = () => {}
  bufferDouble.sampleCount = 2
  object.process(input)
  t.end()
})

test('`dump` messages the delegate with an encoded array buffer', (t) => {
  t.plan(4)

  const output = new ArrayBuffer(44)
  const sampleRate = object.sampleRate = 44100
  const channels = []

  // Mock buffer
  Object.defineProperty(object, 'buffer', { value: bufferDouble })
  bufferDouble.dump = () => channels

  // Mock encoder
  Object.defineProperty(object, 'encoder', { value: encoderDouble })
  encoderDouble.encode = (_channels, _sampleRate) => {
    t.equal(_channels, channels)
    t.equal(_sampleRate, sampleRate)
    return output
  }

  // Stub delegate#message
  object.delegate.message = (event) => {
    t.equal(event.type, 'dataavailable')
    t.equal(event.buffer, output)
    t.end()
  }

  object.dump()

  // Teardown
  bufferDouble.dump = () => {}
  encoderDouble.encode = () => {}
  object.delegate.message = () => {}
})

test('`reset` resets the buffer', (t) => {
  t.plan(1)
  Object.defineProperty(object, 'buffer', { value: bufferDouble })
  bufferDouble.reset = () => t.pass('buffer#reset called')
  object.reset()
  bufferDouble.reset = () => {}
})
