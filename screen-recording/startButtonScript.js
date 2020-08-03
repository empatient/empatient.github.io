document.getElementById("start").addEventListener("click", onStart);

//function executes when Start button is pushed.
function onStart() {
    if (detector && !detector.isRunning) {
      document.querySelector("#logs").innerHTML = "";
      detector.start(JSSDK.Assets.wasm);
    }
    log('#logs', "Clicked the start button");
  }