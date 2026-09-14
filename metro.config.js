const { getDefaultConfig } = require("expo/metro-config");
const config = getDefaultConfig(__dirname);
// Reliable on constrained Windows development hosts; avoids worker-spawn failures.
config.maxWorkers = 1;
module.exports = config;
