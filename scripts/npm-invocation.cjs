// npm.cmd is a batch launcher on Windows. Callers pass only fixed commands
// and options. Paths such as the checkout stay in the child process options.
module.exports = process.platform === 'win32'
  ? { executable: 'cmd.exe', prefix: ['/d', '/c', 'npm.cmd'] }
  : { executable: 'npm', prefix: [] };
