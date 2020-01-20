import AudioWorklet from './audio-worklet'
import ScriptProcessor from './script-processor'

/**
 * Factory which returns either an AudioWorklet or ScriptProcessor, depending on
 * browser support.
 */

export default function (controller) {
  const source = controller.source
  const context = controller.source.context
  var proxy

  if ('AudioWorkletNode' in window) {
    proxy = new AudioWorklet(controller, 'audio-recorder-worklet', controller.workletUri)
  } else {
    proxy = new ScriptProcessor(controller, controller.workerUri)
  }

  proxy.message({
    type: 'initialize',
    attributes: { sampleRate: context.sampleRate, mimeType: 'audio/wav' }
  })

  proxy.node.then((node) => {
    node.connect(context.destination)
    source.connect(node)
  })

  return proxy
}
