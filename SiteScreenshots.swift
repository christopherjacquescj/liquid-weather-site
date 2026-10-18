import XCTest

/// Not a regression test: drives the app through its screens and saves REAL screenshots (plus the
/// position of every button, so the website can make them clickable). It only runs when an output
/// folder is given, e.g.
///   TEST_RUNNER_LW_SHOTS=/tmp/lwshots/iphone-fr TEST_RUNNER_LW_LANG=fr xcodebuild test … \
///     -only-testing:LiquidWeatherAppUITests/SiteScreenshots/testTabs
final class SiteScreenshots: XCTestCase {
    private var outDir: String { ProcessInfo.processInfo.environment["LW_SHOTS"] ?? "" }
    private var language: String { ProcessInfo.processInfo.environment["LW_LANG"] ?? "fr" }
    private var app = XCUIApplication()
    private var isPad: Bool { UIDevice.current.userInterfaceIdiom == .pad }
    private var prefix: String { "\(isPad ? "ipad" : "iphone")-\(language)" }

    override func setUpWithError() throws {
        continueAfterFailure = true
        try XCTSkipIf(outDir.isEmpty, "Set TEST_RUNNER_LW_SHOTS to run the website screenshot tour")
        try FileManager.default.createDirectory(atPath: outDir, withIntermediateDirectories: true)
    }

    // MARK: Helpers

    private func settle(_ seconds: TimeInterval = 4) { Thread.sleep(forTimeInterval: seconds) }

    private func write(_ data: Data, _ file: String) { FileManager.default.createFile(atPath: "\(outDir)/\(file)", contents: data) }

    /// Screenshot + the accessibility tree (it holds every element's frame, in points).
    private func capture(_ name: String, tree: Bool = true) {
        write(XCUIScreen.main.screenshot().pngRepresentation, "\(prefix)-\(name).png")
        if tree { write(Data(app.debugDescription.utf8), "\(prefix)-\(name).tree.txt") }
    }

    private func launch() {
        // Welcome screens already completed; the language follows the launch arguments.
        app.launchArguments = ["-completedOnboardingVersion", "2",
                               "-AppleLanguages", "(\(language))", "-AppleLocale", language == "fr" ? "fr_FR" : "en_US"]
        addUIInterruptionMonitor(withDescription: "Location") { alert in
            for label in ["Allow While Using App", "Autoriser lors de l’utilisation de l’app", "Autoriser lors de l'utilisation de l'app", "Allow Once", "Autoriser une fois"] {
                if alert.buttons[label].exists { alert.buttons[label].tap(); return true }
            }
            return false
        }
        app.launch()
        app.tap()
        XCTAssertTrue(app.tabBars.firstMatch.waitForExistence(timeout: 25))
        settle(20)   // the first forecast and the AI summary need a moment
    }

    /// A slow drag that ends with a hold: no inertia, so the page moves by a known, repeatable amount
    /// and consecutive screenshots overlap enough to be stitched together.
    private func drag(up: Bool, from: CGFloat = 0.82, to: CGFloat = 0.42) {
        let start = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: up ? from : to))
        let end = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: up ? to : from))
        start.press(forDuration: 0.05, thenDragTo: end, withVelocity: .slow, thenHoldForDuration: 0.6)
    }

    private func flickToTop() {
        for _ in 0..<10 {
            let a = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.30))
            let b = app.coordinate(withNormalizedOffset: CGVector(dx: 0.5, dy: 0.85))
            a.press(forDuration: 0.02, thenDragTo: b)
        }
        settle(1.2)
    }

    /// Top of the screen, then successive pages for as long as the content moves.
    private func scrollTour(_ base: String, maxPages: Int = 16, treeOnFirst: Bool = true) {
        flickToTop()
        var last = XCUIScreen.main.screenshot().pngRepresentation
        write(last, "\(prefix)-\(base)-p0.png")
        if treeOnFirst { write(Data(app.debugDescription.utf8), "\(prefix)-\(base)-p0.tree.txt") }
        for page in 1...maxPages {
            drag(up: true)
            settle(1.0)
            let data = XCUIScreen.main.screenshot().pngRepresentation
            if sameScreen(data, last) { break }
            write(data, "\(prefix)-\(base)-p\(page).png")
            last = data
        }
        flickToTop()
    }

    private func tab(_ index: Int) -> XCUIElement { app.tabBars.buttons.element(boundBy: index) }

    /// A coarse picture of the scrolling band (header and tab bar left out), to tell whether the
    /// content moved. Byte equality is no use: the animated sky changes every frame.
    private func fingerprint(_ data: Data) -> [Int] {
        guard let image = UIImage(data: data)?.cgImage else { return [] }
        let w = 24, h = 48
        var pixels = [UInt8](repeating: 0, count: w * h)
        guard let context = CGContext(data: &pixels, width: w, height: h, bitsPerComponent: 8, bytesPerRow: w,
                                      space: CGColorSpaceCreateDeviceGray(), bitmapInfo: CGImageAlphaInfo.none.rawValue),
              let band = image.cropping(to: CGRect(x: 0, y: CGFloat(image.height) * 0.14, width: CGFloat(image.width), height: CGFloat(image.height) * 0.72))
        else { return [] }
        context.interpolationQuality = .medium
        context.draw(band, in: CGRect(x: 0, y: 0, width: w, height: h))
        return pixels.map(Int.init)
    }

    private func sameScreen(_ a: Data, _ b: Data) -> Bool {
        let fa = fingerprint(a), fb = fingerprint(b)
        guard fa.count == fb.count, !fa.isEmpty else { return a == b }
        let total = zip(fa, fb).reduce(0) { $0 + abs($1.0 - $1.1) }
        return Double(total) / Double(fa.count) < 1.6
    }

    /// Every button of every segmented control of the screen, tapped one after the other.
    private func segmentTour(_ base: String) {
        flickToTop()
        let controls = app.segmentedControls.allElementsBoundByIndex
        for (c, control) in controls.enumerated() where control.exists {
            let buttons = control.buttons.allElementsBoundByIndex
            for (b, button) in buttons.enumerated() where button.exists && button.isHittable {
                button.tap()
                settle(3.5)
                scrollTour("\(base)-seg\(c)-\(b)", maxPages: 14)
            }
            if let first = control.buttons.allElementsBoundByIndex.first, first.exists { first.tap(); settle(1.5) }
        }
    }

    // MARK: Tabs

    /// Each tab, scrolled from top to bottom, plus every state of its segmented controls.
    @MainActor
    func testTabs() throws {
        launch()
        let count = app.tabBars.buttons.count
        for i in 0..<count {
            let button = tab(i)
            let id = button.identifier.replacingOccurrences(of: ".", with: "-")
            button.tap()
            settle(8)
            if app.buttons["plus"].exists { continue }   // Maps have their own test
            scrollTour("tab\(i)-\(id)")
            segmentTour("tab\(i)-\(id)")
        }
    }

    // MARK: Maps

    @MainActor
    func testMaps() throws {
        launch()
        let count = app.tabBars.buttons.count
        for i in 0..<count {
            tab(i).tap(); settle(4)
            guard app.buttons["plus"].exists else { continue }
            settle(8)

            let all = app.buttons.allElementsBoundByIndex
            guard let first = all.firstIndex(where: { $0.identifier == "sidebar.left" }),
                  let last = all.firstIndex(where: { $0.identifier == "plus" }), last > first + 1 else { return }
            let chips = Array(all[(first + 1)..<last])
            capture("maps-base")
            for (n, chip) in chips.enumerated() where chip.exists {
                chip.tap()
                settle(12)
                capture("maps-layer\(n)")
            }
            if let temperature = chips.first, temperature.exists { temperature.tap(); settle(12) }

            // Timeline: the hour is scrubbed, each frame loads on demand.
            let slider = app.sliders.firstMatch
            if slider.exists {
                for (n, position) in [0.0, 0.06, 0.12, 0.2, 0.3, 0.42, 0.55, 0.7, 0.85, 1.0].enumerated() {
                    slider.adjust(toNormalizedSliderPosition: position)
                    settle(12)
                    capture("maps-time\(n)", tree: n == 0)
                }
                slider.adjust(toNormalizedSliderPosition: 0)
                settle(5)
            }

            // Play: the loading ring, then the animation.
            let play = app.buttons["play.fill"]
            if play.exists {
                play.tap()
                settle(2.5); capture("maps-loading-a", tree: false)
                settle(6); capture("maps-loading-b", tree: false)
                settle(40); capture("maps-playing-a", tree: false)
                settle(6); capture("maps-playing-b", tree: false)
                let pause = app.buttons["pause.fill"]
                if pause.exists { pause.tap(); settle(2) }
            }

            // Zoomed in, full screen.
            let plus = app.buttons["plus"]
            if plus.exists { plus.tap(); plus.tap(); settle(10); capture("maps-zoom") }
            let full = app.buttons["arrow.up.left.and.arrow.down.right"]
            if full.exists { full.tap(); settle(8); capture("maps-fullscreen") }
            break
        }
    }

    // MARK: Panels

    /// Cities and settings, then Ask Liquid with a real answer.
    @MainActor
    func testPanels() throws {
        launch()

        // Cities.
        app.buttons["sidebar.left"].tap()
        settle(4)
        capture("panel-cities")
        // Settings (the gear).
        let gear = app.buttons.allElementsBoundByIndex.first { $0.identifier.contains("gear") }
        if let gear, gear.exists {
            gear.tap(); settle(3)
            scrollTour("panel-settings", maxPages: 10)
        }
        app.swipeDown(); settle(1)

        // Ask Liquid.
        let orb = app.buttons["sparkles"].firstMatch
        if orb.waitForExistence(timeout: 5) {
            // The side panel may still be open: close it first.
            if !orb.isHittable { app.swipeLeft(); settle(1.5) }
            orb.tap()
            settle(4)
            capture("ask-open")
            // Ask the first suggestion.
            let suggestions = app.buttons.allElementsBoundByIndex.filter { $0.frame.minY > 250 && $0.frame.height > 40 && $0.label.count > 12 }
            if let first = suggestions.first { first.tap() }
            for step in 0..<12 { settle(5); capture("ask-answer-\(step)", tree: step == 0 || step == 11) }
        }
    }
}
