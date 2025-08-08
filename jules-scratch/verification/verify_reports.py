import re
from playwright.sync_api import sync_playwright, Page, expect

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    try:
        # Go to the login page
        page.goto("http://localhost:5173/login")

        # Fill in the login form
        page.get_by_label("Email").fill("admin@example.com")
        page.get_by_label("Senha").fill("password")
        page.get_by_role("button", name="Entrar").click()

        # Check for login error
        try:
            # Wait for a potential error message, but with a short timeout
            error_toast = page.locator("text=/Erro ao fazer login/").wait_for(timeout=3000)

            # If we find an error, it means the user likely doesn't exist, so we register
            print("Login failed, attempting to register...")
            page.goto("http://localhost:5173/register")
            page.get_by_label("Nome").fill("Admin User")
            page.get_by_label("Email").fill("admin@example.com")
            page.get_by_label("Senha").fill("password")
            page.get_by_role("button", name="Registrar").click()

            # Wait for registration success and go back to login
            expect(page.locator("text=/Registro bem-sucedido/")).to_be_visible(timeout=5000)
            page.goto("http://localhost:5173/login")
            page.get_by_label("Email").fill("admin@example.com")
            page.get_by_label("Senha").fill("password")
            page.get_by_role("button", name="Entrar").click()

        except Exception:
            # No error toast appeared, login was likely successful
            print("Login successful.")
            pass

        # After login, we should be on the dashboard. Wait for it to load.
        expect(page.get_by_role("heading", name="Painel Administrativo")).to_be_visible()

        # Navigate to the reports page
        page.get_by_role("link", name="Relatórios").click()

        # Wait for the reports page to load
        expect(page.get_by_role("heading", name="Relatórios")).to_be_visible()

        # Select the "Quantitativo de Documentos" report
        page.locator("#report-type").click()
        page.get_by_role("option", name="Quantitativo de Documentos").click()

        # Generate the report
        page.get_by_role("button", name="Gerar Relatório").click()

        # Wait for the results to load and the chart to be visible
        expect(page.get_by_text("Resultados")).to_be_visible()
        # Wait for the chart to render
        expect(page.locator(".recharts-surface")).to_be_visible(timeout=10000)

        # Take a screenshot
        screenshot_path = "jules-scratch/verification/reports_verification.png"
        page.screenshot(path=screenshot_path)
        print(f"Screenshot saved to {screenshot_path}")

    finally:
        context.close()
        browser.close()

with sync_playwright() as playwright:
    run(playwright)
