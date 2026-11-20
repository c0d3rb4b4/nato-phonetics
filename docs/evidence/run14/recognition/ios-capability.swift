import Foundation
import Speech
let recognizer = SFSpeechRecognizer(locale: Locale(identifier: "en-GB"))
let values: [String: Any] = [
 "probe": "Availability only; no authorization request, audio engine, recognition task or microphone capture",
 "authorizationStatusRaw": SFSpeechRecognizer.authorizationStatus().rawValue,
 "locale": "en-GB",
 "recognizerConstructed": recognizer != nil,
 "currentlyAvailable": recognizer?.isAvailable ?? false,
 "supportsOnDeviceRecognition": recognizer?.supportsOnDeviceRecognition ?? false,
 "supportedLocaleCount": SFSpeechRecognizer.supportedLocales().count
]
let data = try JSONSerialization.data(withJSONObject: values, options: [.sortedKeys, .prettyPrinted])
print(String(data: data, encoding: .utf8)!)
