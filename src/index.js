import AudioRecorder from './audio-recorder'

var AudioContext = window.AudioContext || window.webkitAudioContext
var audioContext
var audioRecorder
var source

document.getElementById('mic').addEventListener('click', function () {
  audioContext = new AudioContext()

  navigator.mediaDevices.getUserMedia({ audio: true, video: false }).then((stream) => {
    source = audioContext.createMediaStreamSource(stream)
    recordSource(source)
  })
})

var audio = document.querySelector('audio')
audio.onplay = function () {
  audioContext = new AudioContext()
  recordSource(audioContext.createMediaStreamSource(audio.mozCaptureStream()))
}

function recordSource (source) {
  var channelCount = source.mediaStream.getAudioTracks()[0].getSettings().channelCount
  if (channelCount) {
    source.channelCountMode = 'explicit'
    source.channelCount = channelCount
  }

  audioRecorder = new AudioRecorder({
    source: source,
    workletUri: 'dist/audio-recorder-worklet.js',
    workerUri: 'dist/audio-recorder-worker.js'
  })
  audioRecorder.on('dataavailable', (event) => {
    const blob = new Blob([event.data.buffer], { type: 'audio/wav' })
    const blobUrl = URL.createObjectURL(blob)
    const audio = document.createElement('audio')
    const anchor = document.createElement('a')
    anchor.setAttribute('href', blobUrl)
    const now = new Date()
    anchor.setAttribute(
      'download',
      `recording-${now.getFullYear()}-${(now.getMonth() + 1).toString().padStart(2, '0')}-${now.getDay().toString().padStart(2, '0')}--${now.getHours().toString().padStart(2, '0')}-${now.getMinutes().toString().padStart(2, '0')}-${now.getSeconds().toString().padStart(2, '0')}.wav`
    );
    anchor.innerText = 'Download'
    audio.setAttribute('src', blobUrl)
    audio.setAttribute('controls', 'controls')
    document.body.appendChild(audio)
    document.body.appendChild(anchor)
  })

  audioRecorder.start()

  setTimeout(function () {
    audioRecorder.stop()
  }, 6000)
}
