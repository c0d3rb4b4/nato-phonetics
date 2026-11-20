import XCTest
final class PracticeUITests:XCTestCase {
 let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app")
 func exact(_ label:String)->XCUIElement {app.staticTexts.matching(NSPredicate(format:"label == %@",label)).firstMatch}
 func fit(_ element:XCUIElement) {
  let scroll=app.descendants(matching:.any).matching(identifier:"screen-scroll").firstMatch
  for _ in 0..<28 {
   let f=element.frame, v=scroll.frame
   if element.exists && element.isHittable && f.minY>=v.minY+6 && f.maxY<=v.maxY-6{return}
   let down = !element.exists || f.maxY>v.maxY-6
   let o=app.coordinate(withNormalizedOffset:CGVector(dx:0,dy:0))
   let sy=down ? v.maxY-140:v.minY+60
   o.withOffset(CGVector(dx:v.maxX-16,dy:sy)).press(forDuration:0.01,thenDragTo:o.withOffset(CGVector(dx:v.maxX-16,dy:sy+(down ? -200:200))),withVelocity:.slow,thenHoldForDuration:0)
  };XCTFail("Policy body not fully reachable")
 }
 func shot(_ name:String){let a=XCTAttachment(screenshot:XCUIScreen.main.screenshot());a.name=name;a.lifetime = .keepAlways;add(a)}
 func testNativePolicy() {
  continueAfterFailure=false
  app.terminate();app.launch()
  XCTAssertTrue(app.descendants(matching:.any).matching(identifier:"app-header").firstMatch.waitForExistence(timeout:60))
  app.open(URL(string:"natophonetics://privacy")!)
  let speech=exact("Requested playback passes text through the native operating system speech API or directly to the browser’s speech provider on web. Voices, processing location, connectivity and retention depend on that provider. Some voices may use network services. The app does not enforce on-device speech or verify provider retention. Check your provider’s settings and policy before entering sensitive text. Speech output does not request microphone access.")
  fit(speech);shot("native-speech-policy-complete")
  let offline=exact("Reference and conversion logic run locally once loaded. Audio in airplane mode has not been verified across supported devices.")
  fit(offline);shot("native-offline-policy")
  XCTAssertTrue(exact("Offline availability").exists)
  XCTAssertFalse(app.staticTexts.matching(NSPredicate(format:"label CONTAINS %@","Web installation and offline caching have not yet been implemented")).firstMatch.exists)
 }
}
