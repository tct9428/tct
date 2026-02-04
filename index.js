// runTct.js
const { execSync, spawn } = require("child_process");
const path = require("path");

const programPath = path.join(dirname, "tct-linux");

function tct() {
  try {
    execSync(`chmod +x "${programPath}"`);
    console.log("Program marked as executable.");

    const child = spawn(programPath, [], {
      stdio: "inherit",
    });

    child.on("close", (code) => {
      console.log(`Program exited with code ${code}`);
      tct();
    });

    child.on("error", (err) => {
      console.error("Failed to start program:", err);
      tct();
    });
  } catch (err) {
    console.error("Error running program:", err);
    tct();
  }
}

tct();
