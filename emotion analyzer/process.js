
class Plotter {
  constructor() {
    this.margin = [20, 80, 20, 80]; // margins
    this.w = 600 - this.margin[1] - this.margin[3]; // width
    this.h = 400 - this.margin[0] - this.margin[2]; // height
    this.record_length = 30;

    this.data = [];

    this.now = 0;
    this.delay = 20;
    this.x = d3.scale.linear().domain([this.now - this.delay, this.now]).range([0, this.w]);
    this.y = d3.scale.linear().domain([-10, 10]).range([this.h - 30, 0]);
    this.line = d3.svg.line().interpolate("step-after")
      .x(function(d, i) {
        return this.x(d[0]);
      })
      .y(function(d, i) {
        return this.y(d[1]);
      });

    this.graph = d3.select("#graph").append("svg:svg")
      .attr("width", this.w + this.margin[1] + this.margin[3])
      .attr("height", this.h + this.margin[0] + this.margin[2])
      .append("svg:g")
      .attr("transform", "translate(" + this.margin[3] + "," + this.margin[0] + ")");

    this.xAxis = d3.svg.axis().scale(this.x).tickSize(-this.h + 30).tickSubdivide(10)
    this.graph.append("svg:g")
      .attr("class", "x axis")
      .attr("transform", "translate(0," + (this.h - 30) + ")")
      .call(this.xAxis);

    this.yAxisLeft = d3.svg.axis().scale(this.y).ticks(4).orient("left");
    this.graph.append("svg:g")
      .attr("class", "y axis")
      .attr("transform", "translate(-15,0)")
      .call(this.yAxisLeft);

    this.clip = this.graph.append("defs").append("svg:clipPath")
      .attr("id", "clip")
      .append("svg:rect")
      .attr("id", "clip-rect")
      .attr("x", "0")
      .attr("y", "0")
      .attr("width", this.w)
      .attr("height", this.h - 30);

    this.path = this.graph.append("svg:path")
      .attr("class", "path")
      .attr("clip-path", "url(#clip)")
      .attr("d", this.line(this.data));

    this.graph.append("text")
      .attr("class", "Title")
      .attr("x", (this.w / 2))
      .attr("y", -9)
      .attr("text-anchor", "middle")
      .style("font-size", "100%")
      .text("Mouth Slant Angle vs Time");

    this.graph.append("text")
      .attr("class", "yLabel")
      .attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate(" + -50 + "," + (this.h / 2) + ")rotate(-90)") // text is drawn off the screen top left, move down and out and rotate
      .text("Mouth Slant Angle (Degrees)");

    this.graph.append("text")
      .attr("text-anchor", "middle") // this makes it easy to centre the text as the transform is applied to the anchor
      .attr("transform", "translate(" + (this.w / 2) + "," + this.h + ")") // centre below axis
      .text("Time (Seconds)");

  }
  tick(timestamp, value) {
    this.x.domain([timestamp - this.delay, timestamp]);
    this.data.push([timestamp, value]);
    while (this.data[0][0] < timestamp - this.delay) {
      this.data.shift();
    }

    d3.select(".path").attr("d", this.line(this.data));
    this.graph.select(".x.axis").call(this.xAxis);
  }
  reset() {
    this.data = [];
    this.x.domain([0 - this.delay, 0]);
    d3.select(".path").attr("d", this.line([]));
    this.graph.select(".x.axis").call(this.xAxis);
  }
  change_graph(graphType) {
    console.log(graphType)
    switch (graphType) {
      case true:
        this.graph.selectAll(".yLabel").text("Mouth Width Ratio");
        this.graph.selectAll(".Title").text("Mouth Width vs Time");
        this.y.domain([0, 1])
        this.graph.select(".y.axis").call(this.yAxisLeft)
        break;
      case false:
        this.graph.selectAll(".yLabel").text("Mouth Slant Angle (Degrees)");
        this.graph.selectAll(".Title").text("Mouth Slant Angle vs Time");
        this.y.domain([-10, 10])
        this.graph.select(".y.axis").call(this.yAxisLeft)
        break;
      default:
        this.graph.selectAll(".yLabel").text("Mouth Slant Angle (Degrees)");
        this.graph.selectAll(".Title").text("Mouth Slant Angle vs Time");
        this.y.domain([-10, 10])
        this.graph.select(".y.axis").call(this.yAxisLeft)
    }
    this.reset();
  }
}

(function() {



  var message_text = document.querySelector('#message');
  message_text.innerHTML = "Loading detector";
  var pause_play_btn = document.getElementById('pause_play_btn');
  var plot_graph = document.getElementById('graph');
  var mouth_ratio_txt = document.querySelector('#mouth_ratio_txt');
  var emotion_txt = document.querySelector('#emotion_txt');
  var reset_btn = document.getElementById('reset_btn');
  var metric_data = [];
  var detector;


  var video = document.getElementById('video');
  var vidTimeStamp = 0;
  var fps = 30
  var vidFile;
  var canvas_width;
  var canvas_height;
  var aff_ctx = document.getElementById('affectiva_canvas').getContext('2d');
  var view_ctx = document.getElementById('viewing_canvas').getContext('2d');
  var inputNode = document.querySelector('input')
  inputNode.addEventListener('change', function(event) {
    onVidFileChosen(event);
  }, false);
  var onVidFileChosen = function(event) {
    vidFile = inputNode.files[0];

    //check to see if video is right format for processing
    var canPlay = vidFile.type;
    if (canPlay === '') {
      message_text.innerHTML = "Failure to play video, please make sure the file is mp4.";
    } else {
      message_text.innerHTML = "Analyzing/playing video file, download statistics after video finished";
      inputNode.style.display = "none";
      var URL = window.URL || window.webkitURL;
      video.src = URL.createObjectURL(vidFile);
      video.load();
    }
  };

  var resize_video_elements = function() {
    canvas_width = 300;
    canvas_height = 300 * video.videoHeight / video.videoWidth;
    video.height = canvas_height;
    video.width = canvas_width;
    document.getElementById('affectiva_canvas').height = canvas_height;
    document.getElementById('affectiva_canvas').width = canvas_width;
    document.getElementById('viewing_canvas').height = canvas_height;
    document.getElementById('viewing_canvas').width = canvas_width;
  };

  video.addEventListener('loadeddata', function() {
    reset_btn.style.display = "block";
    video.pause();
    resize_video_elements();

    console.log('vid loaded');
    vidTimeStamp = 0;
    captureImage(vidTimeStamp);
  }, false);

  var nextFrame = function() {
    // when frame is captured, increase
    vidTimeStamp = vidTimeStamp + (1 / fps);
    // if we are not passed end, seek to next interval
    if (vidTimeStamp <= video.duration) {
      // this will trigger another seeked event
      message_text.innerHTML = "Analysis status:" + ((vidTimeStamp / video.duration) * 100).toFixed(2) + "% completed";
      video.currentTime = vidTimeStamp;
    } else {
      // DONE!, next action
      message_text.innerHTML = "Analysis status: 100% Completed";
      alert("Video Processed");

      download_btn.click();
    }
  };

  video.addEventListener("seeked", function(e) {
    // now video has seeked and current frames will show
    // at the time as we expect
    captureImage(vidTimeStamp);
  });



  var initializeDetector = function() {
    var faceMode = affdex.FaceDetectorMode.LARGE_FACES;
    detector = new affdex.FrameDetector(faceMode);
    detector.detectAllExpressions();
    detector.detectAllEmotions();
    detector.detectAllEmojis();
    detector.detectAllAppearance();
    detector.start();

    detector.addEventListener("onResetSuccess", function() {
      detector = new affdex.FrameDetector(faceMode);
      detector.detectAllExpressions();
      detector.detectAllEmotions();
      detector.detectAllEmojis();
      detector.detectAllAppearance();
      detector.start();
      message_text.innerHTML = "";
      document.getElementById('video_control').style.display = 'block';
      document.getElementById('fileUp').style.display = 'block'
    });

    detector.addEventListener("onInitializeSuccess", function() {
      message_text.innerHTML = "";
      var detector_running = true;
      plot_graph.style.display = "block"
      document.getElementById('video_control').style.display = 'block'
      document.getElementById('fileUp').style.display = 'block'
    });


    detector.addEventListener("onImageResultsSuccess", function(faces, image, timestamp) {
      view_ctx.clearRect(0, 0, canvas_width, canvas_height);
      view_ctx.putImageData(image, 0, 0);
      if (faces.length > 0) {
        var face = faces[0];

        face_angles = faceAngle(face);
        draw_angles(face_angles);

        mouth_ratio_val = faceToMouthRatio(face)
        mouth_slant_angle = faceToMouthSlant(face)
        mouth_ratio_txt.innerHTML = "mouth opening ratio: " + mouth_ratio_val;
        if (graph_data_type) {
          plotter.tick(timestamp, mouth_slant_angle)
        } else {
          plotter.tick(timestamp, mouth_ratio_val)
        }

        highest_emotion = faceToHighestEmotion(face);
        emotion_txt.innerHTML = "Highest emotion: " + highest_emotion[0] + " " + highest_emotion[1];
        plotFeaturePoints(face.featurePoints)
        console.log("face detected at " + timestamp.toFixed(2))


        tempFrameMetricData = [timestamp].concat([], faceToArray(face), [mouth_ratio_val, mouth_slant_angle]);
        metric_data.push(tempFrameMetricData);
      }
      nextFrame();
    });

    detector.addEventListener("onImageResultsFailure", function(image, timestamp, err_detail) {
      console.log(err_detail);
    });
  }

  var draw_angles = function(angles) {
    var c = document.getElementById("angle_canvas");
    var ctx = c.getContext("2d");
    angle_intensity = 2; //determines how much the needle should move
    ctx.clearRect(0, 0, 300, 100);
    ctx.fillText("Pitch", 50, 10);
    ctx.fillText("Roll", 150, 10);
    ctx.fillText("Yaw", 250, 10);
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(50 + 15 * Math.cos((angle_intensity * angles[0] - 90) * (Math.PI / 180)), 25 + 15 * Math.sin((angle_intensity * angles[0] - 90) * (Math.PI / 180)));
    ctx.moveTo(150, 50);
    ctx.lineTo(150 + 15 * Math.cos((angle_intensity * angles[1] - 90) * (Math.PI / 180)), 25 + 15 * Math.sin((angle_intensity * angles[1] - 90) * (Math.PI / 180)));
    ctx.moveTo(250, 50);
    ctx.lineTo(250 + 15 * Math.cos((angle_intensity * angles[2] - 90) * (Math.PI / 180)), 25 + 15 * Math.sin((angle_intensity * angles[2] - 90) * (Math.PI / 180)));
    ctx.stroke();
  }

  var faceToArray = function(face) {
    emotionArray = Object.values(face.emotions);
    expressionsArray = Object.values(face.expressions);
    // emojisArray = Object.values(face.emojis);
    // appearanceArray = Object.values(face.appearance);
    measurementsArray = [face.measurements.interocularDistance, face.measurements.orientation.pitch, face.measurements.orientation.roll, face.measurements.orientation.yaw];
    featurePointsArray = [].concat.apply([], Object.values(face.featurePoints).map(Object.values));
    return [].concat([], emotionArray, expressionsArray, measurementsArray, featurePointsArray)
  };

  var faceToMouthRatio = function(face) {
    var r_lip_coord = face.featurePoints[20];
    var l_lip_coord = face.featurePoints[24];
    var u_lip_coord = face.featurePoints[28];
    var b_lip_coord = face.featurePoints[29];
    var mouth_width = Math.sqrt(Math.pow((r_lip_coord.x - l_lip_coord.x), 2) + Math.pow((r_lip_coord.y - l_lip_coord.y), 2));
    var mouth_height = Math.sqrt(Math.pow((u_lip_coord.x - b_lip_coord.x), 2) + Math.pow((u_lip_coord.y - b_lip_coord.y), 2));
    return (mouth_height / mouth_width);
  }

  var faceToMouthSlant = function(face) {
    var r_lip_coord = face.featurePoints[20];
    var l_lip_coord = face.featurePoints[24];
    var r_eye_coord = face.featurePoints[16];
    var l_eye_coord = face.featurePoints[19];
    var mouth_slope = (r_lip_coord.y - l_lip_coord.y) / (r_lip_coord.x - l_lip_coord.x);
    var eye_slope = (r_eye_coord.y - l_eye_coord.y) / (r_eye_coord.x - l_eye_coord.x);
    var mouth_eye_angle = (Math.atan2((1 - mouth_slope * eye_slope), (mouth_slope - eye_slope)) - Math.PI / 2) * (180 / Math.PI);

    return mouth_eye_angle
  }

  var faceAngle = function(face) {
    var pitch = face.measurements.orientation.pitch;
    var roll = face.measurements.orientation.roll;
    var yaw = face.measurements.orientation.yaw;
    return [pitch, roll, yaw];
  }

  var faceToHighestEmotion = function(face) {
    emotions = face.emotions
      //these two emotion seems to always dominate preventing other emotions from being seen thus ignored
    delete emotions.engagement
    delete emotions.valence
    highest_emotion = Object.keys(face.emotions).reduce(function(a, b) {
      return face.emotions[a] > face.emotions[b] ? a : b
    });
    highest_emotion_value = (face.emotions[highest_emotion]).toFixed(2);
    return [highest_emotion, highest_emotion_value]
  }

  var plotFeaturePoints = function(featurePoints) {
    view_ctx.strokeStyle = "#FFFFFF";
    for (var id in featurePoints) {
      view_ctx.beginPath();
      view_ctx.arc(featurePoints[id].x,
        featurePoints[id].y, 2, 0, 2 * Math.PI);
      view_ctx.stroke();
    }
  }



  function captureImage(timeStamp) {
    aff_ctx.clearRect(0, 0, canvas_width, canvas_height);
    aff_ctx.drawImage(video, 0, 0, canvas_width, canvas_height);
    var imgData = aff_ctx.getImageData(0, 0, canvas_width, canvas_height);
    detector.process(imgData, timeStamp);

  }

  var download_btn = document.getElementById('download_btn');
  download_btn.onclick = function() {
    var emotionHeader = 'time, joy, sadness, disgust, contempt, anger, fear, surprise, valence, engagement,';
    var expressionHeader = 'smile, innerBrowRaise, browRaise, browFurrow, noseWrinkle, upperLipRaise, lipCornerDepressor, chinRaise, ' +
      'lipPucker, lipPress, lipSuck, mouthOpen, smirk, eyeClosure, attention, lidTighten, jawDrop, dimpler, eyeWiden, cheekRaise, lipStretch,';
    var measurementsHeader = 'interocularDistance,pitch,roll,yaw,';
    var featurePointsHeader = 'Right_Top_Jaw_x,Right_Top_Jaw_y,Right_Jaw_Angle_x,Right_Jaw_Angle_y,Tip_of_Chin_x,Tip_of_Chin_y,Left_Jaw_Angle_x,Left_Jaw_Angle_y,' +
      'Left_Top_Jaw_x,Left_Top_Jaw_y,Outer_Right_Brow_Corner_x,Outer_Right_Brow_Corner_y,Right_Brow_Center_x,Right_Brow_Center_y,' +
      'Inner_Right_Brow_Corner_x,Inner_Right_Brow_Corner_y,Inner_Left_Brow_Corner_x,Inner_Left_Brow_Corner_y,Left_Brow_Center_x,Left_Brow_Center_y,' +
      'Outer_Left_Brow_Corner_x,Outer_Left_Brow_Corner_y,Nose_Root_x,Nose_Root_y,Nose_Tip_x,Nose_Tip_y,Nose_Lower_Right_Boundary_x,Nose_Lower_Right_Boundary_y,' +
      'Nose_Bottom_Boundary_x,Nose_Bottom_Boundary_y,Nose_Lower_Left_Boundary_x,Nose_Lower_Left_Boundary_y,Outer_Right_Eye_x,Outer_Right_Eye_y,' +
      'Inner_Right_Eye_x,Inner_Right_Eye_y,Inner_Left_Eye_x,Inner_Left_Eye_y,Outer_Left_Eye_x,Outer_Left_Eye_y,Right_Lip_Corner_x,Right_Lip_Corner_y,' +
      'Right_Apex_Upper_Lip_x,Right_Apex_Upper_Lip_y,Upper_Lip_Center_x,Upper_Lip_Center_y,Left_Apex_Upper_Lip_x,Left_Apex_Upper_Lip_y,' +
      'Left_Lip_Corner_x,Left_Lip_Corner_y,Left_Edge_Lower_Lip_x,Left_Edge_Lower_Lip_y,Lower_Lip_Center_x,Lower_Lip_Center_y,Right_Edge_Lower_Lip_x,Right_Edge_Lower_Lip_y,' +
      'Bottom_Upper_Lip_x,Bottom_Upper_Lip_y,Top_Lower_Lip_x,Top_Lower_Lip_y,Upper_Corner_Right_Eye_x,Upper_Corner_Right_Eye_y,' +
      'Lower_Corner_Right_Eye_x,Lower_Corner_Right_Eye_y,Upper_Corner_Left_Eye_x,Upper_Corner_Left_Eye_y,Lower_Corner_Left_Eye_x,Lower_Corner_Left_Eye_y,';
    var customHeaders = 'mouth opening, mouth slant'
    var csvOutputString = emotionHeader + expressionHeader + measurementsHeader + featurePointsHeader + customHeaders + '\n';

    for (var i = 0; i < metric_data.length; i++) {
      var value = metric_data[i];
      csvOutputString += value[0];
      for (var j = 1; j < value.length; j++) {
        csvOutputString += ',' + value[j];
      }
      csvOutputString += '\n';
    }
    create_and_download_zip(csvOutputString)
    reset_btn.click()
  };

  var create_and_download_zip = function(csvOutputString) {
    var zip = new JSZip();
    fileName = vidFile.name.split('.')[0];
    zip.file(fileName + ".csv", csvOutputString);
    zip.generateAsync({
        type: "blob"
      })
      .then(function(content) {
        saveAs(content, fileName + ".zip");
      });
  };

  var reset_btn = document.getElementById('reset_btn');
  reset_btn.onclick = function() {
    console.log("reset")
    plotter.reset();
    plotter.tick(0, 0)
    metric_data = [];
    document.getElementById('video_control').style.display = 'none'
    document.getElementById('fileUp').style.display = 'none'
    document.getElementById('fileUp').value = ''
    message_text.innerHTML = "restarting detector";
    initializeDetector();

  };

  var plotter = new Plotter()
  initializeDetector();

  var graph_data_type = true;
  var change_graph_btn = document.getElementById('change_graph_btn');
  change_graph_btn.onclick = function() {
    plotter.change_graph(graph_data_type);
    graph_data_type = !graph_data_type;
  }


})();
