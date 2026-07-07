#!/usr/bin/env python3
"""Take liquidation modal screenshot - more robust."""
import asyncio
from playwright.async_api import async_playwright

BASE = "https://100bocas.cabrasky.net"

async def main():
    async with async_playwright() as p:
        browser = await p.chromium.launch(
            headless=True,
            args=[
                '--no-sandbox', '--disable-setuid-sandbox', '--disable-gpu',
                '--disable-dev-shm-usage', '--window-size=1440,1400',
            ]
        )
        context = await browser.new_context(
            viewport={"width": 1440, "height": 1400},
            device_scale_factor=2,
            locale="es-ES",
            color_scheme="dark",
        )
        page = await context.new_page()

        # Step 1: load app
        await page.goto(BASE)
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(1000)
        print("✓ App loaded")

        # Step 2: create session + data via API
        code = await page.evaluate("""
            async () => {
                const r = await fetch('/api/session', {method: 'POST'});
                return (await r.json()).code;
            }
        """)
        print(f"✓ Created: {code}")

        ok = await page.evaluate(f"""
            async () => {{
                const c = '{code}';
                for (const n of ['Javier','Ana','Carlos','Laura','Miguel'])
                    await fetch(`/api/session/${{c}}/person`, {{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{name:n}})}});
                for (const [p,ik,inm,ic,ca,q] of [
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
                ]) {{
                    await fetch(`/api/session/${{c}}/person/${{p}}/item`, {{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{item_key:ik,item_name:inm,item_code:ic,category:ca,qty:q}})}});
                }}
                await fetch(`/api/session/${{c}}/place-order`, {{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{person_name:'Javier'}})}});
                for (const [p,ik,inm,ic,ca,q] of [
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
                ]) {{
                    await fetch(`/api/session/${{c}}/person/${{p}}/item`, {{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{item_key:ik,item_name:inm,item_code:ic,category:ca,qty:q}})}});
                }}
                await fetch(`/api/session/${{c}}/place-order`, {{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{person_name:'Laura'}})}});
                return true;
            }}
        """)
        print(f"✓ Data created: {ok}")

        # Step 3: navigate to app session
        await page.goto(f"{BASE}/app?session={code}")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(1500)

        # Fill name + join
        for inp in await page.query_selector_all('input'):
            ph = (await inp.get_attribute("placeholder") or "").lower()
            if "ej" in ph:
                await inp.fill("Javier")
                print("✓ Filled name")
                break

        await page.wait_for_timeout(300)
        join_btn = await page.query_selector('.join-row button')
        if join_btn:
            await join_btn.click()
            await page.wait_for_timeout(3000)
            print("✓ Joined session")
        else:
            print("⚠ No join button")
            await page.screenshot(path="/tmp/debug_join_fail.png")

        # Debug: what buttons are on screen?
        btns = await page.query_selector_all('button')
        print(f"\nButtons: {len(btns)}")
        for b in btns:
            inner = await b.inner_html() or ""
            txt = (await b.text_content() or "").strip()
            if txt or inner:
                print(f"  '{txt[:40]}' | inner:{inner[:60]}")

        # Click the "Pedido" tab button specifically
        for b in btns:
            txt = (await b.text_content() or "").strip()
            if txt == "Pedido":
                await b.click()
                print("\n✓ Clicked Pedido")
                await page.wait_for_timeout(1000)
                break

        # Now look for the liquidation button (icon only, fa-hand-holding-dollar)
        await page.wait_for_timeout(500)
        btns2 = await page.query_selector_all('button')
        for b in btns2:
            txt = (await b.text_content() or "").strip()
            inner = await b.inner_html() or ""
            print(f"  After Pedido: '{txt[:40]}' | inner:{inner[:60]}")

        # Click the button with the icon
        for b in btns2:
            inner = await b.inner_html() or ""
            if "fa-hand" in inner or "fa-scale" in inner:
                await b.click()
                print("\n✓ Clicked liquidation button")
                await page.wait_for_timeout(2000)
                break

        # Check if modal appeared
        modal = await page.query_selector('.liquidacion-box, .modal-box')
        if modal:
            print("✓ Modal found!")
            # Scroll the body to bottom
            await page.evaluate("""
                const body = document.querySelector('.liquidacion-body');
                if (body) body.scrollTop = body.scrollHeight;
            """)
            await page.wait_for_timeout(500)
            print("✓ Scrolled modal body to bottom")
        else:
            print("⚠ No modal")
            await page.screenshot(path="/tmp/debug_no_modal2.png")

        # Screenshot
        await page.screenshot(path="/tmp/liquidacion_final.png")
        print("✓ Screenshot -> /tmp/liquidacion_final.png")
        
        await page.screenshot(path="/tmp/liquidacion_final_full.png", full_page=True)
        print("✓ Full page screenshot")

        # Verify
        content = await page.content()
        for term in ["Liquidación", "sw-settlement", "sw-person", "sw-summary", "Total global", code]:
            if term in content:
                print(f"  ✓ {term}")
            else:
                print(f"  ✗ {term}")

        await browser.close()
        print(f"\nDone! {BASE}/?s={code}")

if __name__ == "__main__":
    asyncio.run(main())
