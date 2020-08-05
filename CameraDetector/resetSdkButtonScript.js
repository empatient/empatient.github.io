document.getElementById("resetSDK").addEventListener("click", onReset);

//function executes when the Reset button is pushed.
function onReset() {
    log('#logs', "Clicked the reset button");
    if (detector && detector.isRunning) {
      detector.reset();
  
      document.querySelector('#results').innerHTML = "";
    }
  };