// runTct.js
const { execSync, spawn } = require("child_process");
const path = require("path");

const binaryPath = path.join(__dirname, "tct-linux");

try {
  // Step 1: Ensure binary is executable
  execSync(`chmod +x "${binaryPath}"`);
  console.log("Binary marked as executable.");

  // Step 2: Spawn the binary
  const child = spawn(binaryPath, [], {
    stdio: "inherit", // forward stdout/stderr to your terminal
  });

  child.on("close", (code) => {
    console.log(`Binary exited with code ${code}`);
  });

  child.on("error", (err) => {
    console.error("Failed to start binary:", err);
  });
} catch (err) {
  console.error("Error running binary:", err);
}
