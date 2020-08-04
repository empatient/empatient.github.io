var heartbeat, startTimestamp;

function onVideoPlay() {
  var $this = this; //cache
  (function loop() {
    if (!$this.paused && !$this.ended) {
      ctx.drawImage($this, 0, 0);
      setTimeout(loop, 1000 / 30); // drawing at 30fps
    }
  })();
}

function log(node_name, msg) {
    document.querySelector(node_name).innerHTML += "<span>" + msg + "</span><br />";
  }

function analyzeVideoFrame() {
  //Get a canvas element from DOM
  var aCanvas = document.getElementById("canvas");
  var context = aCanvas.getContext('2d');


  //Get imageData object.
  var imageData = context.getImageData(0, 0, 640, 360);
  console.log("Captured imageData.", imageData);

  //Get current time in seconds
  var now = (new Date()).getTime() / 1000;

  //Get delta time between the first frame and the current frame.
  var deltaTime = now - startTimestamp;

  //Process the frame
  detector.process(imageData, deltaTime);
}

function onImageResultsSuccess(faces, image, timestamp) {
  log('#logs', "onImageResultsSuccess:", timestamp, faces.length, faces[0]);
}

function onImageResultsFailure(image, timestamp, err_detail) {
  log('#logs', "onImageResultsFailure:", timestamp, err_detail);
  clearInterval(heartbeat);
}

function runAnalysis() {
  if (typeof(affdex)=="undefined") {
    log('#logs', "The affdex global variable has not been loaded.");
  }

  var canvas = document.getElementById("canvas");
  var ctx = canvas.getContext('2d');
  var video = document.getElementById('video');
  var detector = new affdex.FrameDetector(affdex.FaceDetectorMode.LARGE_FACES);

  // Set up a loop to draw frames to the canvas element
  video.addEventListener('play', onVideoPlay, 0);
  log('#logs', "Loop set!");


  // Set up and start the detector
  detector.detectAllExpressions();
  detector.detectAllEmotions();
  detector.detectAllAppearance();

  detector.addEventListener("onInitializeSuccess", function() {
  document.getElementById('video').play();
  startTimestamp = (new Date()).getTime() / 1000;
  heartbeat = setInterval(analyzeVideoFrame, 1000);
  });
  detector.addEventListener("onInitializeFailure", function() {
    console.error("Affectiva failed to initialize.");
  });

  detector.addEventListener("onImageResultsSuccess", onImageResultsSuccess);
  detector.addEventListener("onImageResultsFailure", onImageResultsFailure);

  detector.start();
};

(function localFileVideoPlayer() {
	'use strict'
  var URL = window.URL || window.webkitURL
  var displayMessage = function (message, isError) {
    var element = document.querySelector('#message')
    element.innerHTML = message
    element.className = isError ? 'error' : 'info'
  }
  var playSelectedFile = function (event) {
    var file = this.files[0]
    var type = file.type
    var videoNode = document.querySelector('video')
    var canPlay = videoNode.canPlayType(type)
    if (canPlay === '') canPlay = 'no'
    var message = ''
    var isError = canPlay === 'no'
    displayMessage(message, isError)

    if (isError) {
      return
    }

    var fileURL = URL.createObjectURL(file)
    videoNode.src = fileURL
  }
  var inputNode = document.querySelector('input')
  inputNode.addEventListener('change', playSelectedFile, false)
  log('#logs', "Video Loaded!");
})()