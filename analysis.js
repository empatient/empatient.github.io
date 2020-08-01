//Step 1: Load in file using video tag in HTML
//Step 2: Draw to the canvas until the image data can be drawn using getImageData()
//Step 3: Process this data and analyze it

//Loading in the file:

//HTML code required:
//<input type="file" accept="video/*"/>
//<video controls autoplay></video>

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
    var message = 'Can play type "' + type + '": ' + canPlay
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
})()


//Drawing this video file to the canvas and processing it:

//HTML code:
// <html>
//<body>
//<div>
//<video id="video" src="media/video.mp4" controls="true" crossorigin="anonymous"/>
//</div>
//<div>
//<canvas id="c1" width="160" height="96"></canvas>
//<canvas id="c2" width="160" height="96"></canvas>
//</div>
//<script type="text/javascript" src="analysis.js"></script>
//</body>
//</html>
//Note: above code for canvas element dimensions can/should be changed
//Video file must match the one loaded in

var JSSDK = JSSDK || {};
JSSDK.Assets = {
  "wasm": {
      "affdex-native-bindings.wasm": "https://download.affectiva.com/js/wasm/affdex-native-bindings.wasm",
      "affdex-native-bindings.js": "https://download.affectiva.com/js/wasm/affdex-native-bindings.js",
      "affdex-native-bindings.data": "https://download.affectiva.com/js/wasm/affdex-native-bindings.data",
      "affdex-worker.js": "https://download.affectiva.com/js/wasm/affdex-worker.js"
  }
};
/*
   Face detector configuration - If not specified, defaults to F
   affdex.FaceDetectorMode.LARGE_FACES
   affdex.FaceDetectorMode.LARGE_FACES=Faces occupying large portions of the frame
   affdex.FaceDetectorMode.SMALL_FACES=Faces occupying small portions of the frame
*/
var faceMode = affdex.FaceDetectorMode.LARGE_FACES;

// Adding the image width and height
var width = 640;
var height = 480;

//Construct a FrameDetector and specify the image width / height and face detector mode.
var detector = new affdex.FrameDetector(width, height, faceMode);

detector.addEventListener("onInitializeSuccess", function() {
  //Logs the succesful initializaion of detector reports
  log('#logs', "The detector reports initialized");
});
detector.addEventListener("onInitializeFailure", function() {
  log('#logs', "Failure  initializing the detector reports");
});

function log(node_name, msg) {
  document.querySelector(node_name).innerHTML += "<span>" + msg + "</span><br />";
}

detector.addEventListener("onImageResultsFailure", function (image, timestamp, err_detail) {
  log('#logs', "Error Detected:", err_detail);
});

detector.addEventListener("onResetSuccess", function() {
  log('#logs', "Reset!");
});
detector.addEventListener("onResetFailure", function() {});

//Add a callback to notify when detector is stopped
detector.addEventListener("onStopSuccess", function() {
  log('#logs', "The detector reports stopped");
  document.querySelector("#results").innerHTML = "";
});

detector.addEventListener("onStopFailure", function() {});

detector.detectAllExpressions();
detector.detectAllEmotions();
detector.detectAllEmojis();
detector.detectAllAppearance();

/* 
  onImageResults success is called when a frame is processed successfully and receives 3 parameters:
  - Faces: Dictionary of faces in the frame keyed by the face id.
           For each face id, the values of detected emotions, expressions, appearane metrics 
           and coordinates of the feature points
  - image: An imageData object containing the pixel values for the processed frame.
  - timestamp: The timestamp of the captured image in seconds.
*/
detector.addEventListener("onImageResultsSuccess", function (faces, image, timestamp) {
  document.querySelector('#results').innerHTML = "";
  log('#results', "Timestamp: " + timestamp.toFixed(2));
  log('#results', "Number of faces found: " + faces.length);
  if (faces.length > 0) {
    log('#results', "Appearance: " + JSON.stringify(faces[0].appearance));
    log('#results', "Emotions: " + JSON.stringify(faces[0].emotions, function(key, val) {
      return val.toFixed ? Number(val.toFixed(0)) : val;
    }));
    log('#results', "Expressions: " + JSON.stringify(faces[0].expressions, function(key, val) {
      return val.toFixed ? Number(val.toFixed(0)) : val;
    }));
    log('#results', "Emoji: " + faces[0].emojis.dominantEmoji);
    if(document.querySelector('#face_video_canvas') != null)
      drawFeaturePoints(image, faces[0].featurePoints);
  }

  setTimeout(detector.captureNextImage, 150);
});

/* 
  onImageResults failure receives 3 parameters:
  - image: An imageData object containing the pixel values for the processed frame.
  - timestamp: An imageData object contain the pixel values for the processed frame.
  - err_detail: A string contains the encountered exception.
*/


//Get a canvas element from DOM
var aCanvas = document.getElementById("canvas");
var context = aCanvas.getContext('2d');

//Cache the timestamp of the first frame processed
var startTimestamp = (new Date()).getTime() / 1000;

//Get imageData object.
var imageData = context.getImageData(0, 0, 640, 480);

//Get current time in seconds
var now = (new Date()).getTime() / 1000;

//Get delta time between the first frame and the current frame.
var deltaTime = now - startTimestamp;

//Process the frame
detector.process(imageData, deltaTime);