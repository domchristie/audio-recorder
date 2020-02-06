import AudioRecorder from './audio-recorder'

var AudioContext = window.AudioContext || window.webkitAudioContext
var audioContext
var audioRecorder
var source

var micButton = document.getElementById('mic')
var recordButton = document.getElementById('record')
var stopButton = document.getElementById('stop')
var recording = document.getElementById('recording')

// Get microphone access
micButton.addEventListener('click', function () {
  audioContext = new AudioContext()

  navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
    source = audioContext.createMediaStreamSource(stream)
    hide(micButton)
    show(recordButton)
  })
})

// Record
recordButton.addEventListener('click', function () {
  record(source)
  show(stopButton)
  hide(recordButton)
})

function record (source) {
  audioRecorder = new AudioRecorder({
    source: source,
    workletUri: 'dist/audio-recorder-worklet.js',
    workerUri: 'dist/audio-recorder-worker.js'
  })

  audioRecorder.on('dataavailable', (event) => {
    const blob = new Blob([event.data.buffer], { type: 'audio/wav' })
    const blobUrl = URL.createObjectURL(blob)
    const audio = document.createElement('audio')
    audio.setAttribute('src', blobUrl)
    audio.setAttribute('controls', 'controls')

    var oldAudio = recording.firstElementChild
    if (oldAudio) recording.replaceChild(audio, oldAudio)
    else recording.appendChild(audio)
  })

  audioRecorder.start()
}

// Stop
stopButton.addEventListener('click', function () {
  show(recordButton)
  hide(stopButton)
  audioRecorder.stop()
})

// Utils

function hide (element) {
  element.setAttribute('hidden', '')
}

function show (element) {
  element.removeAttribute('hidden')
}
