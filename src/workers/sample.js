export default class Sample {
  constructor (value) {
    this.value = value
  }

  scale (bitDepth) {
    const s = Math.max(-1, Math.min(1, this.value))
    return s < 0 ? s * Math.pow(2, bitDepth - 1) : s * (Math.pow(2, bitDepth - 1) - 1)
  }
}
