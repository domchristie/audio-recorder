import test from 'tape'
import Buffer from '../src/buffer.js'

const frame1 = new Float32Array(2)
frame1.set([0.0, 1.0], 0)
const frame2 = new Float32Array(2)
frame2.set([0.0, -1.0], 0)

test('constructor sets up the initial instance variables', (t) => {
  t.plan(2)
  const buffer = new Buffer()
  t.same(buffer.channels, [])
  t.equal(buffer.sampleCount, 0)
})

test('feed stores the input', (t) => {
  t.plan(1)
  const buffer = new Buffer()
  buffer.feed([frame1])
  buffer.feed([frame2])

  t.same(buffer.channels, [[frame1, frame2]])
})

test('dump returns channel samples in a single array', (t) => {
  t.plan(1)
  const buffer = new Buffer()
  buffer.feed([frame1])
  buffer.feed([frame2])

  const merged = new Float32Array(4)
  merged.set(frame1, 0)
  merged.set(frame2, 2)

  t.same(buffer.dump(), [merged])
})

test('reset resets the instance variables', (t) => {
  t.plan(2)
  const buffer = new Buffer()
  buffer.feed([frame1])
  buffer.reset()

  t.same(buffer.channels, [])
  t.equal(buffer.sampleCount, 0)
})
