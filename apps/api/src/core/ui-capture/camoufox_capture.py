#!/usr/bin/env python3
"""
Camoufox UI capture script.
Called by Node.js to perform browser automation using Camoufox's custom Firefox.
Reads config from stdin JSON, outputs result as stdout JSON.

Supports headful mode so the user can see the browser window.
"""
import asyncio
import json
import os
import sys
import time

# Camoufox dependencies
from browserforge.fingerprints import Screen as BFScreen
from camoufox import AsyncCamoufox


class CaptureError(Exception):
    pass


def log(msg: str):
    print(msg, file=sys.stderr, flush=True)


async def has_visible(page, selector: str) -> bool:
    try:
        el = page.locator(selector).first()
        return await el.is_visible()
    except Exception:
        return False


async def find_visible(page, selectors: list[str]):
    for sel in selectors:
        try:
            el = page.locator(sel).first()
            if await el.is_visible():
                return el
        except Exception:
            continue
    return None


async def wait_for_editor(page, selectors: list[str], timeout=15_000):
    deadline = time.monotonic() + timeout / 1000
    while time.monotonic() < deadline:
        editor = await find_visible(page, selectors)
        if editor and await editor.is_enabled():
            return editor
        await asyncio.sleep(0.3)
    raise CaptureError(f"Editor not found with selectors: {', '.join(selectors)}")


async def wait_for_response_stable(
    page, stop_selectors: list[str], response_selector: str,
    no_output_timeout=75_000, force_exit_timeout=40_000
):
    start = time.monotonic()
    first_response = None
    last_hash = None
    stable_since = None

    while True:
        elapsed = (time.monotonic() - start) * 1000
        if elapsed > no_output_timeout:
            log("No output timeout reached")
            return

        is_generating = await has_stop_button(page, stop_selectors)

        try:
            el = page.locator(response_selector).last()
            visible = await el.is_visible()
        except Exception:
            visible = False

        response_text = ""
        child_count = 0
        if visible:
            try:
                response_text = await el.inner_text()
                child_count = await el.locator("> *").count()
            except Exception:
                pass

        if response_text.strip():
            if first_response is None:
                first_response = time.monotonic()

            current_hash = f"{len(response_text)}:{child_count}:{response_text[-50:]}"
            if current_hash == last_hash:
                if stable_since is None:
                    stable_since = time.monotonic()
                stable_ms = (time.monotonic() - stable_since) * 1000
                if stable_ms > 1500 and not is_generating:
                    log(f"Response stable after {elapsed:.0f}ms")
                    return
                if elapsed > force_exit_timeout:
                    log(f"Force exit after {elapsed:.0f}ms")
                    return
            else:
                last_hash = current_hash
                stable_since = None

        if first_response and elapsed > force_exit_timeout:
            log(f"Force exit with response after {elapsed:.0f}ms")
            return

        await asyncio.sleep(0.2 + (0.2 if first_response and elapsed > 10_000 else 0))


async def has_stop_button(page, selectors: list[str]) -> bool:
    for sel in selectors:
        if await has_visible(page, sel):
            return True
    return False


async def capture(config: dict) -> dict:
    provider = config["provider"]
    prompt = config["prompt"]
    provider_url = config["url"]
    editor_selectors = config.get("editorSelectors", [])
    send_selectors = config.get("sendButtonSelectors", [])
    response_selector = config.get("responseSelector", "body")
    stop_selectors = config.get("stopSelectors", [])
    submit_method = config.get("submitMethod", "enter")
    screenshot_path = config.get("screenshotPath")
    headless = config.get("headless", False)

    launch_kwargs: dict = {
        "headless": headless,
        "humanize": 1.5,
        "geoip": config.get("geoip", True),
        "locale": config.get("locale", "en-US"),
        "os": config.get("os"),
        "block_images": config.get("blockImages", False),
        "block_webrtc": config.get("blockWebrtc", False),
        "enable_cache": config.get("enableCache", False),
        "fingerprint_preset": config.get("fingerprintPreset", True),
    }

    # Window size -- must use Screen object, not dict
    launch_kwargs["screen"] = BFScreen(max_width=1920, max_height=1080)
    launch_kwargs["window"] = (1365, 900)

    if config.get("proxyServer"):
        launch_kwargs["proxy"] = {
            "server": config["proxyServer"],
            "username": config.get("proxyUsername"),
            "password": config.get("proxyPassword"),
        }

    start_time = time.monotonic()

    log(f"Launching Camoufox (headless={headless})...")
    async with AsyncCamoufox(**launch_kwargs) as browser:
        log("Camoufox browser launched")

        context = await browser.new_context(
            locale=config.get("locale", "en-US"),
            timezone_id=config.get("location", "UTC"),
            viewport={"width": 1365, "height": 900},
        )
        page = await context.new_page()
        page.set_default_timeout(30_000)
        page.set_default_navigation_timeout(60_000)

        # Navigate to provider
        log(f"Navigating to {provider_url}...")
        await page.goto(provider_url, wait_until="domcontentloaded", timeout=45_000)
        try:
            await page.wait_for_load_state("networkidle", timeout=10_000)
        except Exception:
            pass
        await asyncio.sleep(1)

        # Find editor and type prompt
        log("Finding editor...")
        editor = await wait_for_editor(page, editor_selectors)
        await editor.click()
        await asyncio.sleep(0.5)
        await editor.fill(prompt)
        log(f"Typed prompt ({len(prompt)} chars)")
        await asyncio.sleep(0.5)

        # Submit
        log("Submitting...")
        if submit_method == "enter":
            await page.keyboard.press("Enter")
        else:
            send_btn = await find_visible(page, send_selectors)
            if send_btn:
                await send_btn.click()
            else:
                await page.keyboard.press("Enter")

        # Wait for response
        log("Waiting for response...")
        no_output_timeout = config.get("noOutputTimeoutMs", 75_000)
        force_exit_timeout = config.get("forceExitStableMs", 40_000)
        await wait_for_response_stable(
            page, stop_selectors, response_selector,
            no_output_timeout=no_output_timeout,
            force_exit_timeout=force_exit_timeout,
        )

        # Extract response
        log("Extracting response...")
        title = await page.title()
        response_html = ""
        try:
            el = page.locator(response_selector).last()
            if await el.is_visible():
                response_html = await el.inner_html()
        except Exception:
            pass

        if not response_html:
            try:
                response_html = await page.locator("main").inner_html()
            except Exception:
                pass

        if not response_html:
            try:
                response_html = await page.content()
            except Exception:
                pass

        # Extract sources (all links)
        sources = []
        try:
            links = await page.locator("a[href^='http']").evaluate_all(
                "links => links.map((a, i) => ({"
                "    url: a.href,"
                "    title: a.innerText.trim() || a.href,"
                "    domain: new URL(a.href).hostname,"
                "    position: i + 1"
                "})).slice(0, 20)"
            )
            sources = links
        except Exception:
            pass

        # Full page text for fallback
        full_text = ""
        try:
            full_text = await page.locator("body").inner_text()
        except Exception:
            pass

        # Screenshot
        if screenshot_path:
            try:
                os.makedirs(os.path.dirname(screenshot_path), exist_ok=True)
                await page.screenshot(path=screenshot_path, full_page=True)
                log(f"Screenshot saved to {screenshot_path}")
            except Exception as e:
                log(f"Screenshot failed: {e}")

        latency_ms = (time.monotonic() - start_time) * 1000

        # Classify capture
        current_url = page.url
        status = classify_capture(current_url, full_text)

        result = {
            "provider": provider,
            "prompt": prompt,
            "url": current_url or provider_url,
            "title": title,
            "status": status["status"],
            "failureReason": status.get("failureReason"),
            "responseHtml": response_html,
            "fullText": full_text,
            "sources": sources,
            "screenshotPath": screenshot_path,
            "capturedAt": time.strftime("%Y-%m-%dT%H:%M:%S", time.gmtime()),
            "latencyMs": int(latency_ms),
        }

        return result


def classify_capture(url: str, text: str) -> dict:
    lower_url = url.lower()
    lower_text = text.lower()

    if "/sorry/" in lower_url or "unusual traffic" in lower_text:
        return {"status": "blocked", "failureReason": "Provider returned bot-detection page."}
    if any(phrase in lower_text for phrase in ["log in", "sign in", "continue with google"]):
        return {"status": "auth_required", "failureReason": "Provider requires login."}
    if not text.strip():
        return {"status": "partial", "failureReason": "No visible response text extracted."}
    return {"status": "success"}


async def main():
    raw = sys.stdin.read()
    config = json.loads(raw)

    try:
        result = await capture(config)
        print(json.dumps(result), flush=True)
    except Exception as e:
        error_result = {
            "error": str(e),
            "status": "error",
        }
        print(json.dumps(error_result), flush=True)
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())
