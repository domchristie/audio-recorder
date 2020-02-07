import AudioRecorder from './dist/audio-recorder.js'

;(function () {
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

      audioRecorder = new AudioRecorder({
        source: source,
        workletUri: 'dist/audio-recorder-worklet.js',
        workerUri: 'dist/audio-recorder-worker.js'
      })

      audioRecorder.on('dataavailable', renderAudio)

      hide(micButton)
      show(recordButton)
    })
  })

  // Record
  recordButton.addEventListener('click', function () {
    audioRecorder.start()
    goRed()
    show(stopButton)
    hide(recordButton)
  })

  // Stop
  stopButton.addEventListener('click', function () {
    audioRecorder.stop()
    unRed()
    show(recordButton)
    hide(stopButton)
  })

  // UI Utils
  function hide (element) {
    element.setAttribute('hidden', '')
  }

  function show (element) {
    element.removeAttribute('hidden')
  }

  function goRed () {
    document.body.style.backgroundColor = 'red'
  }

  function unRed () {
    document.body.style.backgroundColor = ''
  }

  function renderAudio (event) {
    const blob = new Blob([event.data.buffer], { type: 'audio/wav' })
    const blobUrl = URL.createObjectURL(blob)
    const audio = document.createElement('audio')
    audio.setAttribute('src', blobUrl)
    audio.setAttribute('controls', 'controls')

    var oldAudio = recording.firstElementChild
    if (oldAudio) recording.replaceChild(audio, oldAudio)
    else recording.appendChild(audio)
  }
})()
