#!/usr/bin/env node
const modes = ['android-debug', 'android-develop', 'android-release', 'ios-simulator'];

function selectNativeModes(event, ref, selection) {
  if (!['refs/heads/main', 'refs/heads/develop'].includes(ref)) throw new Error('Select main or develop');
  if (event === 'push') return ref === 'refs/heads/main' ? ['android-release', 'ios-simulator'] : ['android-develop'];
  if (event !== 'workflow_dispatch') throw new Error('Unsupported event');
  if (selection === 'all') return modes.slice();
  if (modes.includes(selection)) return [selection];
  throw new Error('Unsupported native mode');
}

if (require.main === module) {
  console.log(JSON.stringify(selectNativeModes(...process.argv.slice(2))));
}
module.exports = { selectNativeModes };
