export const contextDouble = {
  sampleRate: 44100,
  audioWorklet: {
    addModule: () => {
      return new Promise((resolve, reject) => {
        resolve(audioWorkletNode)
      })
    }
  }
}

export const audioWorkletNodeDouble = {
  port: {
    postMessage: () => {},
    onmessage: () => {}
  }
}

export const scriptProcessorNodeDouble = {
  postMessage: () => {},
  onmessage: () => {},
  onaudioprocess: () => {}
}

export const sourceDouble = {
  context: contextDouble
}

export const workerAdapterDouble = {
  source: sourceDouble,
  context: contextDouble,
  node: new Promise((resolve, reject) => resolve({})),
  message: () => {}
}

export const workerDouble = {
  message: () => {},
  onmessage: () => {},
}

export const audioRecorderDouble = {
  state: 'inactive',
  workletUri: 'audio-recorder-worklet.js',
  workerUri: 'audio-recorder-worker.js',
  source: sourceDouble,
  context: contextDouble,
  listeners: {},
}

export const bufferDouble = {
  reset: () => {},
  feed: () => {},
  dump: () => {}
}

export const encoderDouble = {
  encode: () => {}
}
