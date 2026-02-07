const { execSync, spawn } = require("child_process");
const path = require("path");
const fs = require("fs");

const programPath = path.join(__dirname, "tct-linux");
const DOWNLOAD_URL = "https://github.com/i-tct/tct/releases/latest/download/tct-linux";
const RESTART_DELAY = 2000; // 2 seconds

function downloadBinary() {
  if (!fs.existsSync(programPath)) {
    console.log("Binary not found. Downloading from GitHub Releases...");
    try {
      // Check if curl exists, otherwise you might need a different method
      execSync(`curl -L "${DOWNLOAD_URL}" -o "${programPath}"`);
      execSync(`chmod +x "${programPath}"`);
      console.log("Download complete and marked as executable.");
    } catch (err) {
      console.error("Failed to download binary:", err);
      process.exit(1); // Exit if we can't get the binary
    }
  }
}

function tct() {
  // Ensure binary exists before starting
  downloadBinary();

  try {
    const child = spawn(programPath, [], {
      stdio: "inherit",
    });

    child.on("close", (code) => {
      console.log(`Program exited with code ${code}`);
      console.log(`Restarting in ${RESTART_DELAY / 1000} seconds...`);
      setTimeout(tct, RESTART_DELAY);
    });

    child.on("error", (err) => {
      console.error("Failed to start program:", err);
      console.log(`Retrying in ${RESTART_DELAY / 1000} seconds...`);
      setTimeout(tct, RESTART_DELAY);
    });
  } catch (err) {
    console.error("Error running program:", err);
    console.log(`Retrying in ${RESTART_DELAY / 1000} seconds...`);
    setTimeout(tct, RESTART_DELAY);
  }
}

tct();
