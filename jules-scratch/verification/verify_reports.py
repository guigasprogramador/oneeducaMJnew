import re
from playwright.sync_api import Page, expect
import sys

def run_verification(page: Page):
    """
    This test verifies that an admin can log in, navigate to the reports page,
    generate a report, and see the results.
    """
    try:
        # 1. Arrange: Go to the login page.
        page.goto("http://127.0.0.1:8084/login", timeout=60000)

        # 2. Act: Log in as an admin.
        # Assuming the user is admin@example.com with password 'password'
        page.get_by_label("E-mail").fill("admin@example.com")
        page.get_by_label("Senha").fill("password")
        page.get_by_role("button", name="Entrar").click()

        # 3. Assert: Wait for navigation to the dashboard.
        expect(page).to_have_url(re.compile(r".*/admin/dashboard"), timeout=30000)

        # 4. Act: Navigate to the reports page.
        report_link = page.get_by_role("link", name="Relatórios")
        expect(report_link).to_be_visible()
        report_link.click()

        # 5. Assert: Check if we are on the reports page.
        expect(page).to_have_url(re.compile(r".*/admin/reports"), timeout=30000)
        expect(page.get_by_role("heading", name="Sistema de Relatórios")).to_be_visible()

        # 6. Act: Generate a report.
        # Select the "Inscritos por Cargo" report
        page.locator('label:has-text("Relatório") + button').click()
        page.get_by_role("option", name=re.compile(r"Inscritos por Cargo")).click()

        # Select a date range.
        page.get_by_role("button", name=re.compile(r"Escolha um período")).click()
        page.get_by_role("gridcell", name="1", exact=True).first.click()
        page.get_by_role("gridcell", name="31", exact=True).first.click()

        # Click the generate button
        page.get_by_role("button", name="Gerar Relatório").click()

        # 7. Assert: Wait for the results to appear.
        expect(page.get_by_role("heading", name="Resultados do Relatório")).to_be_visible(timeout=15000)

        print("Verification successful: Report generated and displayed.")

    except Exception as e:
        print(f"An error occurred during verification: {e}")
        page.screenshot(path="jules-scratch/verification/error_screenshot.png")
        raise e

    finally:
        # 8. Screenshot: Capture the final result.
        page.screenshot(path="jules-scratch/verification/reports_verification.png")
        print("Screenshot captured at jules-scratch/verification/reports_verification.png")

# This part allows the script to be run directly.
if __name__ == "__main__":
    from playwright.sync_api import sync_playwright

    with sync_playwright() as p:
        # Install browsers if not present
        try:
            p.chromium.launch()
        except Exception:
            sys.exit(p.driver.install())

        browser = p.chromium.launch(headless=True)
        page = browser.new_page()
        try:
            run_verification(page)
        finally:
            browser.close()
