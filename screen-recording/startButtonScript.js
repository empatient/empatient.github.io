//function executes when Start button is pushed.
function onStart() {
	runSDK();
    if (detector && !detector.isRunning) {
      document.getElementById("logs").innerHTML = "";
      detector.start();
    }
  }

document.getElementById("startSDK").addEventListener("click", onStart);
