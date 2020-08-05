var JSSDK = JSSDK || {};
JSSDK.Assets = {
  "wasm": {
      "affdex-native-bindings.wasm": "https://download.affectiva.com/js/wasm/affdex-native-bindings.wasm",
      "affdex-native-bindings.js": "https://download.affectiva.com/js/wasm/affdex-native-bindings.js",
      "affdex-native-bindings.data": "https://download.affectiva.com/js/wasm/affdex-native-bindings.data",
      "affdex-worker.js": "https://download.affectiva.com/js/wasm/affdex-worker.js"
  }
};

// SDK Needs to create video and canvas nodes in the DOM in order to function
// Here we are adding those nodes a predefined div.
var divRoot = document.querySelector("#affdex_elements");
var width = 640;
var height = 480;
var faceMode = affdex.FaceDetectorMode.LARGE_FACES;
//Construct a CameraDetector and specify the image width / height and face detector mode.
var detector = new affdex.CameraDetector(divRoot, width, height, faceMode);

//Enable detection of all Expressions, Emotions and Emojis classifiers.
detector.detectAllEmotions();
detector.detectAllExpressions();
detector.detectAllEmojis();
detector.detectAllAppearance();  

//Add a callback to notify when the detector is initialized and ready for runing.
detector.addEventListener("onInitializeSuccess", function() {
  log('#logs', "The detector reports initialized");
  //Display canvas instead of video feed because we want to draw the feature points on it
  document.querySelector("#face_video_canvas").style.display = "block";
  document.querySelector("#face_video").style.display = "none";
});

function log(node_name, msg) {
  document.querySelector(node_name).innerHTML += "<span>" + msg + "</span><br />";
}

//Add a callback to notify when camera access is allowed
detector.addEventListener("onWebcamConnectSuccess", function() {
  log('#logs', "Webcam access allowed");
});

//Add a callback to notify when camera access is denied
detector.addEventListener("onWebcamConnectFailure", function() {
  log('#logs', "webcam denied");
  console.log("Webcam access denied");
});

//Add a callback to notify when detector is stopped
detector.addEventListener("onStopSuccess", function() {
  log('#logs', "The detector reports stopped");
  document.querySelector("#results").innerHTML = "";
});

//Add a callback to receive the results from processing an image.
//The faces object contains the list of the faces detected in an image.
//Faces object contains probabilities for all the different expressions, emotions and appearance metrics
detector.addEventListener("onImageResultsSuccess", function(faces, image, timestamp) {
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

  setTimeout(detector.captureNextImage, 1000);
});

//Draw the detected facial feature points on the image
function drawFeaturePoints(img, featurePoints) {
  var contxt = document.querySelector('#face_video_canvas').getContext('2d');

  var hRatio = contxt.canvas.width / img.width;
  var vRatio = contxt.canvas.height / img.height;
  var ratio = Math.min(hRatio, vRatio);

  contxt.strokeStyle = "#FFFFFF";
  for (var id in featurePoints) {
    contxt.beginPath();
    contxt.arc(featurePoints[id].x,
      featurePoints[id].y, 2, 0, 2 * Math.PI);
    contxt.stroke();
  }
}

(function localFileVideoPlayer() {
  "use strict";
  var URL = window.URL || window.webkitURL;
  var displayMessage = function (message, isError) {
    var element = document.querySelector("#message");
    element.innerHTML = message;
    element.className = isError ? "error" : "info";
  };
  var playSelectedFile = function (event) {
    var file = this.files[0];
    var type = file.type;
    var videoNode = document.querySelector("video");
    var canPlay = videoNode.canPlayType(type);
    if (canPlay === "") canPlay = "no";
    var message = "";
    var isError = canPlay === "no";
    log("#logs", "Video Loaded!");
    displayMessage(message, isError);

    if (isError) {
      return;
    }

    var fileURL = URL.createObjectURL(file);
    videoNode.src = fileURL;
  };
  var inputNode = document.querySelector("input");
  inputNode.addEventListener("change", playSelectedFile, false);
})();
