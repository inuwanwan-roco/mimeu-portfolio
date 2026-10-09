"""UI regression checks: start the static server on port 8000 before running.

Requires Python Playwright and Chromium. Run: python3 -m unittest discover -s tests
External font requests are excluded so these checks depend only on local code.
"""

import unittest

from playwright.sync_api import sync_playwright


class PortfolioUITests(unittest.TestCase):
    def setUp(self):
        self.playwright = sync_playwright().start()
        self.browser = self.playwright.chromium.launch(
            executable_path="/usr/bin/chromium", args=["--no-sandbox"]
        )
        self.addCleanup(self.playwright.stop)
        self.addCleanup(self.browser.close)
        self.page = self.browser.new_page(viewport={"width": 390, "height": 844})
        self.page.route("https://**", lambda route: route.abort())
        self.errors = []
        self.page.on("pageerror", lambda error: self.errors.append(str(error)))
        self.page.goto("http://127.0.0.1:8000/", wait_until="load")
        self.page.locator("#js-loading").wait_for(state="detached")

    def tearDown(self):
        self.assertEqual(self.errors, [], "Unexpected JavaScript runtime errors")

    def test_accordion_initial_state_and_repeated_toggles(self):
        accordions = self.page.locator(".c-accordion")
        self.assertEqual(accordions.count(), 2)
        for accordion, initial in zip(accordions.all(), [True, False]):
            trigger = accordion.locator(".c-accordion__trigger")
            panel = accordion.locator(".c-accordion__panel")
            for expected in [initial, not initial, initial]:
                self.assertEqual(trigger.get_attribute("aria-expanded"), str(expected).lower())
                self.assertEqual(
                    "is-open" in accordion.get_attribute("class").split(), expected
                )
                self.assertIsNone(panel.get_attribute("hidden"))
                self.assertEqual(accordion.locator(".c-accordion__icon").inner_text(), "")
                trigger.click()

    def test_contact_initialization_continues_after_accordion(self):
        prevented = self.page.evaluate("""() => {
            const event = new Event('submit', {cancelable: true});
            document.querySelector('#js-contact-form').dispatchEvent(event);
            return event.defaultPrevented;
        }""")
        self.assertTrue(prevented, "Design-only form must not submit to the static server")

    def test_mobile_menu_closes_with_escape(self):
        button = self.page.locator("#js-menu-button")
        button.click()
        self.assertEqual(button.get_attribute("aria-expanded"), "true")
        self.page.keyboard.press("Escape")
        self.assertEqual(button.get_attribute("aria-expanded"), "false")
        self.assertTrue(self.page.locator("#js-global-menu").evaluate("menu => menu.hidden"))


if __name__ == "__main__":
    unittest.main()
