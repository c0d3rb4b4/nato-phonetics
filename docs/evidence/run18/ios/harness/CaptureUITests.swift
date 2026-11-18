import XCTest
import UIKit
import Vision
final class PolicyUITests: XCTestCase {
 func testTextKitHeightBoundary() {
  let body = "Requested playback passes text through the native operating system speech API or directly to the browser’s speech provider on web. Voices, processing location, connectivity and retention depend on that provider. Some voices may use network services. The app does not enforce on-device speech or verify provider retention. Check your provider’s settings and policy before entering sensitive text. Speech output does not request microphone access."
  let text = NSMutableAttributedString(string: "Speech and connectivity\n", attributes: [.font: UIFont.boldSystemFont(ofSize: 20)])
  text.append(NSAttributedString(string: body, attributes: [.font: UIFont.systemFont(ofSize: 16)]))
  let style = NSMutableParagraphStyle(); style.minimumLineHeight = 25; style.maximumLineHeight = 25
  text.addAttributes([.paragraphStyle: style, .baselineOffset: (25 - UIFont.boldSystemFont(ofSize: 20).lineHeight)/2], range: NSRange(location: 0, length: text.length))
  for height in [CGFloat.greatestFiniteMagnitude, 274.9998779296875, 275, 275.3333333333333, 276] {
   let storage = NSTextStorage(attributedString: text), manager = NSLayoutManager()
   let container = NSTextContainer(size: CGSize(width: 370, height: height)); container.lineFragmentPadding = 0; container.lineBreakMode = .byClipping
   manager.usesFontLeading = false; manager.addTextContainer(container); storage.addLayoutManager(manager); manager.ensureLayout(for: container)
   var lines: [String] = []
   let range = manager.glyphRange(for: container)
   manager.enumerateLineFragments(forGlyphRange: range) { _, _, _, glyphs, _ in
    lines.append((storage.string as NSString).substring(with: manager.characterRange(forGlyphRange: glyphs, actualGlyphRange: nil)))
   }
   let json = try! String(data: JSONSerialization.data(withJSONObject: ["height": height, "usedHeight": manager.usedRect(for: container).height, "lines": lines]), encoding: .utf8)!
   print("TEXTKIT_JSON \(json)")
  }
 }

 func screenshot(_ name: String, requireWords: String? = nil) {
  let screen = XCUIScreen.main.screenshot()
  let a = XCTAttachment(screenshot: screen); a.name = name; a.lifetime = .keepAlways; add(a)
  if let words = requireWords {
   let request = VNRecognizeTextRequest(); request.recognitionLevel = .accurate; request.recognitionLanguages = ["en-US"]
   do {
    try VNImageRequestHandler(cgImage: screen.image.cgImage!, options: [:]).perform([request])
    let text = (request.results ?? []).compactMap { $0.topCandidates(1).first?.string }.joined(separator: " ")
    print("OCR_\(name) \(text)")
    let normalize: (String) -> String = { $0.lowercased().filter { $0.isLetter } }
    XCTAssertTrue(normalize(text).contains(normalize(words)), "Actual screenshot must contain \(words): \(text)")
   } catch { XCTFail("Screenshot OCR failed: \(error)") }
  }
 }
 func item(_ id: String) -> XCUIElement { XCUIApplication(bundleIdentifier: "com.natophonetics.app").descendants(matching: .any).matching(identifier: id).firstMatch }
 func align(_ element: XCUIElement, edge: String = "top") {
  let app = XCUIApplication(bundleIdentifier: "com.natophonetics.app"), scroll = app.scrollViews.firstMatch
  for _ in 0..<100 {
   let v = scroll.frame, f = element.frame
   let position = edge == "bottom" ? f.maxY : f.minY
   let target = edge == "bottom" ? v.maxY-35 : v.minY+25
   if abs(position-target)<30 { return }
   let delta = max(-300, min(300, position-target))
   let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.94, dy: delta>0 ? 0.8 : 0.2))
   start.press(forDuration: 0.01, thenDragTo: start.withOffset(CGVector(dx: 0, dy: -delta)), withVelocity: .slow, thenHoldForDuration: 0)
  }
  XCTFail("Could not align \(element)")
 }
 func launchPolicy() -> (XCUIApplication, XCUIElement) {
  continueAfterFailure = false
  let app = XCUIApplication(bundleIdentifier: "com.natophonetics.app"); app.terminate(); app.launch()
  XCTAssertTrue(item("app-header").waitForExistence(timeout: 60)); app.open(URL(string:"natophonetics://privacy")!)
  let speech = app.staticTexts.matching(NSPredicate(format:"label BEGINSWITH %@", "Speech and connectivity\n")).firstMatch
  XCTAssertTrue(speech.waitForExistence(timeout: 15)); return (app, speech)
 }
 func testFinalPolicyDefault() {
  let (app, speech) = launchPolicy(); align(speech)
  XCTAssertEqual(speech.frame.height, 275, accuracy: 0.00001)
  screenshot("policy-default-complete", requireWords: "microphone access")
  XCTAssertFalse(item("paragraph-metrics").exists)
  let offline = app.staticTexts.matching(NSPredicate(format:"label BEGINSWITH %@", "Offline availability\n")).firstMatch
  XCTAssertTrue(offline.exists); print("FINAL_SPEECH_FRAME \(speech.frame)")
 }
 func testFinalPolicyMaximum() {
  let (_, speech) = launchPolicy(); XCTAssertGreaterThan(speech.frame.height, 1500)
  align(speech); screenshot("policy-maximum-opening", requireWords: "Speech and connectivity")
  align(speech, edge:"bottom"); screenshot("policy-maximum-complete-ending", requireWords: "microphone access")
  print("MAXIMUM_SPEECH_FRAME \(speech.frame)")
 }
 func testMaximumPolicyEndingFromRetainedState() {
  continueAfterFailure = false
  let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app"); app.activate()
  let speech=app.staticTexts.matching(NSPredicate(format:"label BEGINSWITH %@","Speech and connectivity\n")).firstMatch
  XCTAssertTrue(speech.exists); XCTAssertGreaterThan(speech.frame.height,1500)
  align(speech,edge:"bottom"); screenshot("policy-maximum-complete-ending",requireWords:"microphone access")
  print("MAXIMUM_SPEECH_FRAME \(speech.frame)")
 }

 func testFinalMaximumTiles() {
  continueAfterFailure = false
  let app = XCUIApplication(bundleIdentifier:"com.natophonetics.app"); app.terminate(); app.launch()
  XCTAssertTrue(item("app-header").waitForExistence(timeout:60)); app.open(URL(string:"natophonetics://alphabet")!)
  XCTAssertTrue(item("alphabet-A").waitForExistence(timeout:15)); XCTAssertGreaterThan(item("alphabet-A").frame.height,400)
  for symbol in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" {
   let tile=item("alphabet-\(symbol)"); XCTAssertTrue(tile.exists)
   XCTAssertEqual(tile.frame.width/tile.frame.height,11.0/15.0,accuracy:0.004)
  }
  align(item("alphabet-I")); screenshot("maximum-reference-india")
  align(item("alphabet-J")); screenshot("maximum-reference-juliett")
 }

 func testFinalCoreLayouts() {
  continueAfterFailure = false
  let app = XCUIApplication(bundleIdentifier:"com.natophonetics.app"); app.terminate(); app.launch()
  XCTAssertTrue(item("app-header").waitForExistence(timeout:60)); app.open(URL(string:"natophonetics://alphabet")!)
  XCTAssertTrue(item("alphabet-A").waitForExistence(timeout:20))
  for symbol in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" {
   let tile = item("alphabet-\(symbol)"); XCTAssertTrue(tile.exists)
   XCTAssertEqual(tile.frame.width/tile.frame.height, 11.0/15.0, accuracy:0.004)
  }
  align(item("alphabet-J")); screenshot("reference-juliett")
  app.open(URL(string:"natophonetics://converter")!); XCTAssertTrue(item("converter-input").waitForExistence(timeout:15))
  item("converter-input").coordinate(withNormalizedOffset:CGVector(dx:0.3,dy:0.5)).tap()
  XCTAssertTrue(app.keyboards.firstMatch.waitForExistence(timeout:5))
  for key in "a3 b!" { item("converter-input").typeText(String(key)) }
  XCTAssertEqual(item("converter-input").value as? String,"a3 b!")
  screenshot("converter-retained-input")
  app.open(URL(string:"natophonetics://letter-quiz")!); XCTAssertTrue(item("quiz-start").waitForExistence(timeout:15))
  align(item("quiz-start"),edge:"bottom"); item("quiz-start").tap()
  XCTAssertTrue(item("quiz-letter").waitForExistence(timeout:10)); screenshot("quiz-question")
  app.open(URL(string:"natophonetics://progress")!); XCTAssertTrue(item("progress-summary").waitForExistence(timeout:15)); screenshot("progress-summary")
  app.open(URL(string:"natophonetics://settings")!); XCTAssertTrue(item("System").waitForExistence(timeout:15)); screenshot("settings")
 }

 func testSpeechParagraphMetrics() {
  continueAfterFailure = false
  let app = XCUIApplication(bundleIdentifier: "com.natophonetics.app")
  app.terminate(); app.launch()
  XCTAssertTrue(app.descendants(matching: .any).matching(identifier: "app-header").firstMatch.waitForExistence(timeout: 60))
  app.open(URL(string: "natophonetics://privacy")!)
  let p = app.staticTexts.matching(NSPredicate(format: "label BEGINSWITH %@", "Speech and connectivity\n")).firstMatch
  let scroll = app.scrollViews.firstMatch
  XCTAssertTrue(p.waitForExistence(timeout: 15)); XCTAssertTrue(scroll.exists)
  for _ in 0..<24 {
   if p.frame.minY >= scroll.frame.minY+12 && p.frame.maxY <= scroll.frame.maxY-12 { break }
   if p.frame.minY > scroll.frame.minY+12 {
    let delta = min(240, p.frame.minY-scroll.frame.minY-20)
    let start = scroll.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.75))
    start.press(forDuration: 0.05, thenDragTo: start.withOffset(CGVector(dx: 0, dy: -delta)))
   } else { scroll.swipeDown(velocity: .slow) }
  }
  XCTAssertTrue(p.frame.minY >= scroll.frame.minY)
  XCTAssertTrue(p.frame.maxY <= scroll.frame.maxY)
  print("PARAGRAPH_FRAME \(p.frame)")
  let metrics = app.staticTexts["paragraph-metrics"]
  if metrics.exists { print("METRICS_JSON \(metrics.label)") }
  let a = XCTAttachment(screenshot: XCUIScreen.main.screenshot()); a.name = "speech-paragraph"; a.lifetime = .keepAlways; add(a)
 }
}
