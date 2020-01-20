export default class Sample {
  constructor (float) {
    this.float = float
  }

  toInt (base) {
    const s = Math.max(-1, Math.min(1, this.float))
    return s < 0 ? s * Math.pow(2, base - 1) : s * (Math.pow(2, base - 1) - 1)
  }
}
