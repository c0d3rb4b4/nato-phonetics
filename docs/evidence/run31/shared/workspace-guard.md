# Original workspace installation

The existing Windows `node_modules` contained React Native 0.81.5 with the 13 original, reviewed source hashes. Before preparation, `node scripts/prepare-android-source.cjs --check` exited 1 and reported 13 source files requiring preparation. Under the ambient Node 24.15.0, an explicit `npm.cmd run postinstall` prepared those 13 files, then exited 1 in the speech-provider script because this dependency tree lacked `react-native-tts/package.json`. The subsequent read-only renderer check exited 0. The original workspace also lacked the community CLI package manifest.

The qualification runs used fresh dependency trees with the pinned Node 22.23.0 and npm 10.9.4. The complete locked install executed both the renderer and speech-provider preparations. [Clean install record](clean-install.json), [actual lifecycle output](clean-install.log).
