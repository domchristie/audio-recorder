/**
 * Wrapper around the AudioWorkletNode.
 * Sets up the worker and the node to provide a standard interface for
 * processing audio.
 */

class AudioWorkletAdapter {
  constructor (controller, name, uri) {
    this.source = controller.source;
    this.context = this.source.context;
    this.name = name;
    this.uri = uri;

    this.node.then((node) => {
      node.port.onmessage = function (event) {
        controller.trigger(event.data.type, event.data);
      };
    });
  }

  get node () {
    if (this._node) return this._node

    this._node = new Promise((resolve, reject) => {
      return this.context.audioWorklet.addModule(this.uri).then(() => {
        return resolve(new AudioWorkletNode(this.context, this.name))
      }).catch(reject)
    });

    return this._node
  }

  message (data) {
    this.node.then((node) => node.port.postMessage(data));
  }
}

/**
 * Wrapper around the ScriptProcessorNode.
 * Sets up the worker and the node to provide a standard interface for
 * processing audio.
 */

class ScriptProcessorAdapter {
  constructor (controller, path) {
    this.source = controller.source;
    this.context = this.source.context;
    this.worker = new Worker(path);

    this.node.then((node) => {
      node.onaudioprocess = (event) => {
        const channels = [];
        for (var i = 0; i < this.source.channelCount; i++) {
          channels[i] = event.inputBuffer.getChannelData(i);
        }
        this.worker.postMessage({ type: 'process', input: channels });
      };
    });

    this.worker.onmessage = (event) => {
      controller.trigger(event.data.type, event.data);
    };
  }

  get node () {
    if (this._node) return this._node

    this._node = new Promise((resolve, reject) => {
      resolve(this._createNode(4096, this.source.channelCount, this.source.channelCount));
    });

    return this._node
  }

  message (data) {
    this.worker.postMessage(data);
  }

  _createNode () {
    return (
      this.context.createScriptProcessor || this.context.createJavaScriptNode
    ).apply(this.context, arguments)
  }
}

/**
 * Factory which returns either an AudioWorkletAdapter or
 * ScriptProcessorAdapter, depending on browser support.
 */

function WorkerAdapter (controller) {
  const source = controller.source;
  const context = controller.source.context;
  var adapter;

  if ('AudioWorkletNode' in window) {
    adapter = new AudioWorkletAdapter(controller, 'audio-recorder-worklet', controller.workletUri);
  } else {
    adapter = new ScriptProcessorAdapter(controller, controller.workerUri);
  }

  adapter.message({
    type: 'initialize',
    attributes: { sampleRate: context.sampleRate, mimeType: 'audio/wav' }
  });

  adapter.node.then((node) => {
    node.connect(context.destination);
    source.connect(node);
  });

  return adapter
}

class InvalidStateError extends Error {
  constructor (message) {
    super(message);
    this.name = 'InvalidStateError';
  }
}

class AudioRecorder {
  constructor (options) {
    this.state = 'inactive';
    this.workletUri = options.workletUri;
    this.workerUri = options.workerUri;
    this.source = options.source;
    this.context = this.source.context;
    this.listeners = {};
  }

  get workerAdapter () {
    return this._workerAdapter = this._workerAdapter || new WorkerAdapter(this, this.workletUri, this.workerUri)
  }

  start (timeslice) {
    if (this.state !== 'inactive') this._throwInvalidStateErrorFor('start');
    this.state = 'recording';

    this.workerAdapter.message({
      type: 'record',
      sliceSizeInSamples: timeslice ? (this.context.sampleRate / 1000) * timeslice : null
    });
  }

  pause () {
    if (this.state === 'inactive') this._throwInvalidStateErrorFor('pause');
    this.state = 'paused';
    this.workerAdapter.message({ type: 'pause' });
  }

  resume () {
    if (this.state === 'inactive') this._throwInvalidStateErrorFor('resume');
    this.state = 'recording';
    this.workerAdapter.message({ type: 'resume' });
  }

  stop () {
    if (this.state === 'inactive') this._throwInvalidStateErrorFor('stop');
    this.state = 'inactive';
    this.workerAdapter.message({ type: 'stop' });
  }

  on (type, listener) {
    (this.listeners[type] = this.listeners[type] || []).push(listener);
  }

  off (type, listener) {
    if (!type) {
      this.listeners = {};
      return
    }
    if (listener) {
      this.listeners[type] = (this.listeners[type] || []).filter(l => l !== listener);
    } else {
      delete this.listeners[type];
    }
  }

  trigger (type, data) {
    (this.listeners[type] || []).forEach((listener) => {
      listener({ type: type, data: data });
    });
  }

  _throwInvalidStateErrorFor (action) {
    throw new InvalidStateError(`Failed to execute '${action}' on 'AudioRecorder': The AudioRecorder's state is '${this.state}'.`)
  }
}

export default AudioRecorder;
