import XCTest

final class WindowResizeUITests: XCTestCase {
    let app = XCUIApplication(bundleIdentifier: "com.natophonetics.app")
    func item(_ id: String) -> XCUIElement { app.descendants(matching: .any).matching(identifier: id).firstMatch }
    func capture(_ name: String) {
        var frames: [String: [String: Double]] = [:]
        for letter in "ABCDEFGHIJKLMNOPQRSTUVWXYZ" {
            let element = item("alphabet-\(letter)")
            if element.exists && element.isHittable {
                let f = element.frame
                frames["alphabet-\(letter)"] = ["x": f.minX, "y": f.minY, "width": f.width, "height": f.height]
            }
        }
        let data = try! JSONSerialization.data(withJSONObject: frames, options: [.sortedKeys])
        print("CAPTUREFRAMES \(name) \(String(data: data, encoding: .utf8)!)")
        let image = XCTAttachment(screenshot: XCUIScreen.main.screenshot())
        image.name = name; image.lifetime = .keepAlways; add(image)
    }
    func columns() -> Int {
        let top = item("alphabet-A").frame.minY
        return "ABCDEFGHIJKL".filter { letter in
            let e = item("alphabet-\(letter)")
            return e.exists && abs(e.frame.minY - top) < 1
        }.count
    }
    func cornerDrag(to point: CGPoint) {
        let window = app.windows.firstMatch
        let frame = window.frame
        let origin = window.coordinate(withNormalizedOffset: .zero)
        let start = origin.withOffset(CGVector(dx: frame.width - 12, dy: frame.height - 12))
        let end = origin.withOffset(CGVector(dx: point.x - frame.minX, dy: point.y - frame.minY))
        start.press(forDuration: 0.15, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.3)
    }
    func testLiveWindowResize() {
        continueAfterFailure = false
        XCUIDevice.shared.orientation = .portrait
        app.launch(); app.open(URL(string: "natophonetics://alphabet")!)
        XCTAssertTrue(item("alphabet-A").waitForExistence(timeout: 15))
        let original = app.windows.firstMatch.frame
        let originalViewport = item("screen-scroll").frame
        let originalColumns = columns()
        XCTAssertGreaterThan(original.width, 700, "Run on the existing iPad simulator at default text scale")
        capture("window-before")
        print("WINDOWBEFORE frame=\(original) viewport=\(originalViewport) columns=\(originalColumns)")
        cornerDrag(to: CGPoint(x: original.minX + original.width * 0.60, y: original.minY + original.height * 0.65))
        let narrowed = NSPredicate { _, _ in self.item("screen-scroll").frame.width < originalViewport.width - 100 }
        _ = expectation(for: narrowed, evaluatedWith: nil)
        waitForExpectations(timeout: 12)
        let small = app.windows.firstMatch.frame
        let smallViewport = item("screen-scroll").frame
        let smallColumns = columns()
        print("WINDOWSMALL frame=\(small) viewport=\(smallViewport) columns=\(smallColumns)")
        XCTAssertLessThan(smallViewport.width, originalViewport.width - 100, "Actual native scene viewport changed")
        XCTAssertLessThan(smallColumns, originalColumns, "Column count responds within the same running app")
        for letter in "ABCD" {
            let f = item("alphabet-\(letter)").frame
            XCTAssertEqual(f.width, 110, accuracy: 0.5)
            XCTAssertEqual(f.height, 150, accuracy: 0.5)
        }
        capture("window-small")
        cornerDrag(to: CGPoint(x: original.maxX - 12, y: original.maxY - 12))
        let expanded = NSPredicate { _, _ in self.item("screen-scroll").frame.width > smallViewport.width + 100 }
        _ = expectation(for: expanded, evaluatedWith: nil)
        waitForExpectations(timeout: 12)
        print("WINDOWRESTORED frame=\(app.windows.firstMatch.frame) viewport=\(item("screen-scroll").frame) columns=\(columns())")
        XCTAssertEqual(item("alphabet-A").frame.width, 110, accuracy: 0.5)
        capture("window-restored")
    }
}
