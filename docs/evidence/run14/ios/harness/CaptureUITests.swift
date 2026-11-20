import XCTest
final class IconUITests:XCTestCase {
 func shot(_ name:String){let capture=XCTAttachment(screenshot:XCUIScreen.main.screenshot());capture.name=name;capture.lifetime = .keepAlways;add(capture)}
 func testInstalledIconAndHome(){
  continueAfterFailure=false
  let app=XCUIApplication(bundleIdentifier:"com.natophonetics.app")
  app.launch()
  XCTAssertTrue(app.descendants(matching:.any)["app-header"].waitForExistence(timeout:60))
  XCTAssertTrue(app.staticTexts["NATO Phonetics"].exists)
  shot("home-release")
  XCUIDevice.shared.press(.home)
  let springboard=XCUIApplication(bundleIdentifier:"com.apple.springboard")
  let icon=springboard.icons["NATO Phonetics"]
  if !icon.waitForExistence(timeout:5){
   springboard.swipeLeft()
  }
  XCTAssertTrue(icon.waitForExistence(timeout:10))
  shot("launcher-release")
  icon.tap()
  XCTAssertTrue(app.descendants(matching:.any)["app-header"].waitForExistence(timeout:30))
  shot("home-from-launcher")
 }
}
