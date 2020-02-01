export default class {
  constructor () {
    this.reset()
  }

  reset () {
    this.channels = []
    this.sampleCount = 0
  }

  feed (channels) {
    channels.forEach((samples, i) => {
      this.channels[i] = this.channels[i] || []
      this.channels[i].push(samples)
    })
    this.sampleCount += channels[0].length
  }

  dump () {
    return this.channels.map((frames) => {
      // Reduce 2-dimensional array down to a single Float32Array
      let offset = 0
      return frames.reduce((merged, samples) => {
        merged.set(samples, offset)
        offset += samples.length
        return merged
      }, new Float32Array(this.sampleCount))
    })
  }
}
