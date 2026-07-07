#!/usr/bin/env python3
"""
Create fake 100Bocas session → join → open liquidation → scroll → screenshot.
"""
import asyncio
import json
from playwright.async_api import async_playwright

BASE = "https://100bocas.cabrasky.net"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu',
                '--disable-dev-shm-usage', '--window-size=1440,900',
            ]
        )
        context = await browser.new_context(
            viewport={"width": 1440, "height": 900},
            device_scale_factor=2,
            locale="es-ES",
            color_scheme="dark",
        )
        page = await context.new_page()

        errors = []
        page.on("pageerror", lambda e: errors.append(str(e)))

        # Step 1: Open app once
        await page.goto(BASE)
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(1000)
        print("✓ App loaded")

        # Step 2: Create session + data via API
        code = await page.evaluate("""
            async () => {
                const r = await fetch('/api/session', {method: 'POST'});
                return (await r.json()).code;
            }
        """)
        print(f"✓ Created: {code}")

        result = await page.evaluate(f"""
            async () => {{
                const c = '{code}';
                // People
                for (const n of ['Javier','Ana','Carlos','Laura','Miguel'])
                    await fetch(`/api/session/${{c}}/person`, {{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{name:n}})}});

                // Round 1 (paid_by Javier)
                const r1 = [
                    ["Javier","casa:01","Jamón Gran Reserva y aceite de oliva","01","casa",1],
                    ["Javier","casa:05","Carrillera al vino tinto","05","casa",2],
                    ["Ana","casa:04","Pollo y salsa alioli","04","casa",1],
                    ["Ana","casa:08","Bacon ahumado y queso madurado","08","casa",1],
                    ["Carlos","casa:03","Pulled pork BBQ","03","casa",2],
                    ["Carlos","casa:09","Torreznos y salsa brava","09","casa",1],
                    ["Laura","casa:14","Atún rojo, pimiento y cebolla caramelizada","14","casa",1],
                    ["Laura","casa:15","Sobrasada y queso manchego","15","casa",1],
                    ["Miguel","casa:03","Pulled pork BBQ","03","casa",1],
                    ["Miguel","casa:10","Lomo al ajillo y salsa 100M","10","casa",1]
                ];
                for (const [p,ik,inm,ic,ca,q] of r1) {{
                    const r = await fetch(`/api/session/${{c}}/person/${{p}}/item`, {{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{item_key:ik,item_name:inm,item_code:ic,category:ca,qty:q}})}});
                    if (!r.ok) return 'R1 item fail';
                }}
                const o1 = await fetch(`/api/session/${{c}}/place-order`, {{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{person_name:'Javier'}})}});
                if (!o1.ok) return 'R1 order fail';

                // Round 2 (paid_by Laura)
                const r2 = [
                    ["Javier","casa:09","Torreznos y salsa brava","09","casa",1],
                    ["Javier","casa:12","Secreto ibérico y queso brie","12","casa",1],
                    ["Ana","casa:01","Jamón Gran Reserva y aceite de oliva","01","casa",1],
                    ["Ana","casa:15","Sobrasada y queso manchego","15","casa",1],
                    ["Carlos","casa:05","Carrillera al vino tinto","05","casa",1],
                    ["Carlos","casa:09","Torreznos y salsa brava","09","casa",1],
                    ["Laura","casa:04","Pollo y salsa alioli","04","casa",1],
                    ["Miguel","casa:03","Pulled pork BBQ","03","casa",1],
                    ["Miguel","casa:01","Jamón Gran Reserva y aceite de oliva","01","casa",1],
                    ["Miguel","casa:08","Bacon ahumado y queso madurado","08","casa",1]
                ];
                for (const [p,ik,inm,ic,ca,q] of r2) {{
                    const r = await fetch(`/api/session/${{c}}/person/${{p}}/item`, {{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{item_key:ik,item_name:inm,item_code:ic,category:ca,qty:q}})}});
                    if (!r.ok) return 'R2 item fail';
                }}
                const o2 = await fetch(`/api/session/${{c}}/place-order`, {{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{person_name:'Laura'}})}});
                if (!o2.ok) return 'R2 order fail';
                return 'ok';
            }}
        """)
        print(f"✓ Data: {result}")

        # Step 3: Navigate to /app?session=CODE (this pre-fills the code input)
        await page.goto(f"{BASE}/app?session={code}")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(1500)
        print(f"✓ At {BASE}/app?session={code}")

        # Step 4: Fill name + join
        await page.wait_for_timeout(500)
        inputs = await page.query_selector_all('input')
        for inp in inputs:
            ph = (await inp.get_attribute("placeholder") or "").lower()
            if "ej" in ph or "ainoha" in ph or "nombre" in ph:
                await inp.fill("Javier")
                print("✓ Name filled")
                break

        await page.wait_for_timeout(300)
        # Click the join button (the one with right-to-bracket icon, next to code input)
        btns = await page.query_selector_all('button')
        for b in btns:
            txt = (await b.text_content() or "").strip()
            if "entrar" in txt.lower() or "unirse" in txt.lower():
                await b.click()
                print(f"✓ Join clicked")
                break
        else:
            # Try the icon-only join button (no text)
            # It should be inside .join-row
            join_btn = await page.query_selector('.join-row button')
            if join_btn:
                await join_btn.click()
                print("✓ Join button (icon) clicked")
            else:
                print("⚠ No join button found")

        await page.wait_for_timeout(3000)
        print(f"URL after join: {page.url[:80]}")
        await page.screenshot(path="/tmp/debug_joined.png")

        # Step 5: Find liquidation button
        btns = await page.query_selector_all('button')
        print(f"Buttons after join: {len(btns)}")
        for b in btns:
            txt = (await b.text_content() or "").strip()
            inner = await b.inner_html() or ""
            if txt[:40]:
                print(f"  '{txt[:50]}'")

        # Click liquidation
        clicked = False
        for b in btns:
            txt = (await b.text_content() or "").lower()
            inner = await b.inner_html() or ""
            if "liqui" in txt or "cuenta" in txt:
                await b.click()
                print(f"✓ Clicked: '{txt[:40]}'")
                clicked = True
                await page.wait_for_timeout(2000)
                break

        if not clicked:
            print("⚠ No liquidation text, checking inner HTML...")
            for b in btns:
                inner = await b.inner_html() or ""
                if "fa-hand" in inner or "fa-scale" in inner or "fa-chart" in inner:
                    await b.click()
                    print(f"✓ Clicked button by icon")
                    clicked = True
                    await page.wait_for_timeout(2000)
                    break

        await page.screenshot(path="/tmp/debug_liqui_clicked.png")

        # Step 6: Find modal and scroll to bottom
        modal = None
        try:
            modal = await page.wait_for_selector('.liquidacion-box, .modal-box', timeout=3000)
        except:
            pass

        if modal:
            print("✓ Modal found")
            # Scroll inside modal's body to bottom
            await page.evaluate("""
                const modalBody = document.querySelector('.liquidacion-body, .modal-body');
                if (modalBody) {
                    modalBody.scrollTop = modalBody.scrollHeight;
                }
            """)
            await page.wait_for_timeout(500)
            
            # Also scroll page to show bottom of modal
            await page.evaluate("window.scrollTo(0, document.body.scrollHeight)")
            await page.wait_for_timeout(300)
            print("✓ Scrolled to bottom")
        else:
            print("⚠ No modal")
            # Check what's in the page
            content = await page.content()
            for term in ["Liquidación", "liquidación", "sw-person", "sw-settlement"]:
                if term in content:
                    print(f"  ✓ '{term}' in page")

        # Take screenshot
        await page.screenshot(path="/tmp/liquidacion_full.png")
        print(f"\n✓ Screenshot -> /tmp/liquidacion_full.png")
        await page.screenshot(path="/tmp/liquidacion_full_page.png", full_page=True)
        print(f"✓ Full-page -> /tmp/liquidacion_full_page.png")

        # Verify
        final = await page.content()
        for check in ["Liquidación", "sw-person", "sw-settlement", "pagó", code]:
            if check in final:
                print(f"  ✓ '{check}' ✓")
            else:
                print(f"  ✗ '{check}' ✗")

        if errors:
            for e in errors[:3]:
                print(f"  JS err: {e[:100]}")

        await browser.close()
        print(f"\nDone! {BASE}/?s={code}")

if __name__ == "__main__":
    asyncio.run(main())
