const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

/**
 * Metro configuration
 * https://reactnative.dev/docs/metro
 *
 * @type {import('@react-native/metro-config').MetroConfig}
 */
// Gradle's worker limit does not constrain Metro's separate Node processes.
// Reuse the explicit host/native-build limit for memory-constrained builds.
const jobs = process.env.NATO_BUILD_JOBS;
if (jobs !== undefined && (!Number.isInteger(Number(jobs)) || Number(jobs) < 1 || Number(jobs) > 4)) {
  throw new Error('NATO_BUILD_JOBS must be an integer from 1 to 4.');
}
const config = jobs === undefined ? {} : { maxWorkers: Number(jobs) };

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
