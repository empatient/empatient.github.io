
//function executes when the Stop button is pushed.
function onStop() {
    if (detector && detector.isRunning) {
      detector.removeEventListener();
      detector.stop();
    }
  };

document.getElementById("stop").addEventListener("click", onStop);
