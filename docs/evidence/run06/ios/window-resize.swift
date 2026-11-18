import XCTest

final class WindowResizeUITests: XCTestCase {
  let app = XCUIApplication(bundleIdentifier: "com.natophonetics.app")
  func item(_ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
  func route(_ path: String) { app.open(URL(string: "natophonetics://\(path)")!); XCTAssertTrue(app.wait(for: .runningForeground, timeout: 10)) }
  func capture(_ name: String) {
    var frames: [String: [String: Double]] = [:]
    for id in ["Home", "Open menu", "app-header", "header-insets", "screen-scroll"] + "ABCDEFGHIJKLMNOPQRSTUVWXYZ".map({ "alphabet-\($0)" }) {
      let e = item(id)
      if e.exists && e.isHittable { let f=e.frame; frames[id] = ["x":f.minX,"y":f.minY,"width":f.width,"height":f.height] }
    }
    let f=app.windows.firstMatch.frame; frames["window"]=["x":f.minX,"y":f.minY,"width":f.width,"height":f.height]
    let data=try! JSONSerialization.data(withJSONObject:frames,options:[.sortedKeys])
    print("CAPTUREFRAMES \(name) \(String(data:data,encoding:.utf8)!)")
    let a=XCTAttachment(screenshot:XCUIScreen.main.screenshot()); a.name=name; a.lifetime = .keepAlways; add(a)
  }
  func drag(to point: CGPoint) {
    let w=app.windows.firstMatch; let f=w.frame; let o=w.coordinate(withNormalizedOffset:.zero)
    o.withOffset(CGVector(dx:f.width-12,dy:f.height-12)).press(forDuration:0.15,thenDragTo:o.withOffset(CGVector(dx:point.x-f.minX,dy:point.y-f.minY)),withVelocity:.slow,thenHoldForDuration:0.3)
    sleep(2)
  }
  func navigate(_ name: String) {
    let home=item("Home"),menu=item("Open menu")
    XCTAssertTrue(home.isHittable); XCTAssertTrue(menu.isHittable)
    print("HEADERDEBUG \(name) \(app.debugDescription)")
    capture(name)
    menu.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:0.5)).tap(); XCTAssertTrue(item("Back to App").waitForExistence(timeout:10)); item("Back to App").tap()
    XCTAssertTrue(item("alphabet-A").waitForExistence(timeout:10))
    home.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:0.5)).tap(); XCTAssertTrue(item("Learn, convert, and quiz yourself on the NATO alphabet.").waitForExistence(timeout:10))
    capture(name+"-home")
    route("alphabet"); XCTAssertTrue(item("alphabet-A").waitForExistence(timeout:10))
  }
  func testWindowHeader() {
    continueAfterFailure=false; XCUIDevice.shared.orientation = .portrait
    app.launch(); route("settings"); item("Light").tap(); route("alphabet")
    XCTAssertTrue(item("alphabet-A").waitForExistence(timeout:15))
    let full=app.windows.firstMatch.frame; XCTAssertGreaterThan(full.width,700)
    navigate("header-fullscreen")
    drag(to:CGPoint(x:full.width*0.60,y:full.height*0.65))
    let small=app.windows.firstMatch.frame; XCTAssertLessThan(small.width,full.width-100)
    XCTAssertEqual(item("alphabet-A").frame.width,110,accuracy:0.5)
    navigate("header-small")
    drag(to:CGPoint(x:small.maxX+90,y:small.maxY+100))
    XCTAssertGreaterThan(app.windows.firstMatch.frame.width,small.width+30)
    navigate("header-medium")
    XCUIDevice.shared.orientation = .landscapeLeft; sleep(2)
    navigate("header-landscape")
    XCUIDevice.shared.orientation = .portrait; sleep(2)
    drag(to:CGPoint(x:full.maxX-12,y:full.maxY-12))
    XCTAssertGreaterThan(app.windows.firstMatch.frame.width,700)
    navigate("header-restored")
    route("settings"); item("System").tap()
  }
  func testLargeTextWindowHeader() {
    continueAfterFailure=false; XCUIDevice.shared.orientation = .portrait
    app.launch(); route("alphabet"); XCTAssertTrue(item("alphabet-A").waitForExistence(timeout:15))
    let full=app.windows.firstMatch.frame; drag(to:CGPoint(x:full.width*0.60,y:full.height*0.65))
    navigate("header-enlarged-small")
    drag(to:CGPoint(x:full.maxX-12,y:full.maxY-12))
  }
  func restoreFullscreen() -> CGRect {
    let screen=XCUIApplication(bundleIdentifier:"com.apple.springboard").frame
    print("SCREENBOUNDS \(screen) WINDOWBEFORE \(app.windows.firstMatch.frame)")
    XCTAssertGreaterThan(screen.width,700)
    if app.windows.firstMatch.frame.width < screen.width-2 {
      drag(to:CGPoint(x:screen.maxX-12,y:screen.maxY-12))
    }
    XCTAssertEqual(app.windows.firstMatch.frame.width,screen.width,accuracy:2)
    return screen
  }
  func testRestoredAutomaticHeader() {
    continueAfterFailure=false; XCUIDevice.shared.orientation = .portrait
    app.launch(); route("alphabet"); XCTAssertTrue(item("alphabet-A").waitForExistence(timeout:15))
    let full=restoreFullscreen(); drag(to:CGPoint(x:full.width*0.60,y:full.height*0.65))
    XCUIDevice.shared.orientation = .landscapeLeft; sleep(2)
    XCUIDevice.shared.orientation = .portrait; sleep(2)
    drag(to:CGPoint(x:full.maxX-12,y:full.maxY-12))
    XCTAssertGreaterThan(app.windows.firstMatch.frame.width,700)
    capture("header-auto-restored-before")
    for cycle in 0..<3 {
      let menu=app.buttons["Open menu"]
      XCTAssertTrue(menu.isHittable)
      print("AUTOTAP cycle=\(cycle) frame=\(menu.frame) center=\(menu.coordinate(withNormalizedOffset:CGVector(dx:0.5,dy:0.5)).screenPoint) description=\(menu.debugDescription)")
      menu.tap(); XCTAssertTrue(item("Back to App").waitForExistence(timeout:10))
      item("Back to App").tap(); XCTAssertTrue(item("alphabet-A").waitForExistence(timeout:10))
      app.buttons["Home"].tap(); XCTAssertTrue(item("Learn, convert, and quiz yourself on the NATO alphabet.").waitForExistence(timeout:10))
      route("alphabet"); XCTAssertTrue(item("alphabet-A").waitForExistence(timeout:10))
    }
    capture("header-auto-restored-after")
  }
  func testPhoneHeader() {
    continueAfterFailure=false; XCUIDevice.shared.orientation = .portrait
    app.launch(); route("alphabet"); XCTAssertTrue(item("alphabet-A").waitForExistence(timeout:15))
    navigate("header-phone")
    XCUIDevice.shared.orientation = .landscapeLeft; sleep(2); navigate("header-phone-landscape")
    XCUIDevice.shared.orientation = .portrait
  }
}
