//Load Affectiva API
<script type="text/javascript" src="https://download.affectiva.com/js/3.2.1/affdex.js"></script>
/*
   Face detector configuration - If not specified, defaults to F
   affdex.FaceDetectorMode.LARGE_FACES
   affdex.FaceDetectorMode.LARGE_FACES=Faces occupying large portions of the frame
   affdex.FaceDetectorMode.SMALL_FACES=Faces occupying small portions of the frame
*/
var faceMode = affdex.FaceDetectorMode.LARGE_FACES;

//Demo values of width and height for the frame

var width = 640;
var height = 480;

//Construct a FrameDetector and specify the image width / height and face detector mode.
var detector = new affdex.FrameDetector(width, height, faceMode);

detector.detectAllExpressions();
detector.detectAllEmotions();
detector.detectAllEmojis();
detector.detectAllAppearance();

// Track smiles
detector.detectExpressions.smile = true;

// Track joy emotion
detector.detectEmotions.joy = true;

// Detect person's gender
detector.detectAppearance.gender = true;

detector.addEventListener("onInitializeSuccess", function() {});
detector.addEventListener("onInitializeFailure", function() {});

/* 
  onImageResults success is called when a frame is processed successfully and receives 3 parameters:
  - Faces: Dictionary of faces in the frame keyed by the face id.
           For each face id, the values of detected emotions, expressions, appearane metrics 
           and coordinates of the feature points
  - image: An imageData object containing the pixel values for the processed frame.
  - timestamp: The timestamp of the captured image in seconds.
*/
detector.addEventListener("onImageResultsSuccess", function (faces, image, timestamp) {});

/* 
  onImageResults success receives 3 parameters:
  - image: An imageData object containing the pixel values for the processed frame.
  - timestamp: An imageData object contain the pixel values for the processed frame.
  - err_detail: A string contains the encountered exception.
*/
detector.addEventListener("onImageResultsFailure", function (image, timestamp, err_detail) {});

detector.addEventListener("onResetSuccess", function() {});
detector.addEventListener("onResetFailure", function() {});

detector.addEventListener("onStopSuccess", function() {});
detector.addEventListener("onStopFailure", function() {});

var startButton = document.getElementById('start');
    startButton.addEventListener('click', function() {
      detector.start();
      print("started!") 
    }, false);

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

var stopButton = document.getElementById('stop');
    stopButton.addEventListener('click', function() {
      detector.stop();
      detector.reset(); 
    }, false);