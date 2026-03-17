/* eslint-disable */

module.exports = async function () {
  // Kill the server process we started in global-setup
  const serverProcess = globalThis.__SERVER_PROCESS__;
  if (serverProcess) {
    serverProcess.kill();
  }
  console.log(globalThis.__TEARDOWN_MESSAGE__);
};
