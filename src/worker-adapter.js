import AudioWorkletAdapter from './audio-worklet-adapter'
import ScriptProcessorAdapter from './script-processor-adapter'

/**
 * Factory which returns either an AudioWorkletAdapter or
 * ScriptProcessorAdapter, depending on browser support.
 */

export default function (controller) {
  const source = controller.source
  const context = controller.source.context
  var adapter

  if ('AudioWorkletNode' in window) {
    adapter = new AudioWorkletAdapter(controller, 'audio-recorder-worklet', controller.workletUri)
  } else {
    adapter = new ScriptProcessorAdapter(controller, controller.workerUri)
  }

  adapter.message({
    type: 'initialize',
    attributes: { sampleRate: context.sampleRate, mimeType: 'audio/wav' }
  })

  adapter.node.then((node) => {
    node.connect(context.destination)
    source.connect(node)
  })

  return adapter
}
