#!/usr/bin/env python3
"""Take targeted liquidation modal screenshot, scrolled to bottom."""
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
                '--disable-dev-shm-usage', '--window-size=1440,1200',  # Taller viewport
            ]
        )
        context = await browser.new_context(
            viewport={"width": 1440, "height": 1200},
            device_scale_factor=2,
            locale="es-ES",
            color_scheme="dark",
        )
        page = await context.new_page()

        # Open app
        await page.goto(BASE)
        await page.wait_for_load_state("networkidle")
        print("✓ App loaded")

        # Create session + data via API
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
                for (const n of ['Javier','Ana','Carlos','Laura','Miguel'])
                    await fetch(`/api/session/${{c}}/person`, {{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{name:n}})}});
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
                    await fetch(`/api/session/${{c}}/person/${{p}}/item`, {{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{item_key:ik,item_name:inm,item_code:ic,category:ca,qty:q}})}});
                }}
                await fetch(`/api/session/${{c}}/place-order`, {{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{person_name:'Javier'}})}});
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
                    await fetch(`/api/session/${{c}}/person/${{p}}/item`, {{method:'PUT',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{item_key:ik,item_name:inm,item_code:ic,category:ca,qty:q}})}});
                }}
                await fetch(`/api/session/${{c}}/place-order`, {{method:'POST',headers:{{'Content-Type':'application/json'}},body:JSON.stringify({{person_name:'Laura'}})}});
                return 'ok';
            }}
        """)
        print(f"✓ Data: {result}")

        # Navigate to /app?session=CODE
        await page.goto(f"{BASE}/app?session={code}")
        await page.wait_for_load_state("networkidle")
        await page.wait_for_timeout(1500)

        # Fill name and join
        for inp in await page.query_selector_all('input'):
            ph = (await inp.get_attribute("placeholder") or "").lower()
            if "ej" in ph or "ainoha" in ph:
                await inp.fill("Javier")
                break

        await page.wait_for_timeout(300)
        join_btn = await page.query_selector('.join-row button')
        if join_btn:
            await join_btn.click()
            print("✓ Joined session")
        else:
            print("⚠ No join button")

        await page.wait_for_timeout(3000)

        # Click the "Pedido" button (this shows the order summary/pedido screen which has liquidation)
        for b in await page.query_selector_all('button'):
            txt = (await b.text_content() or "").strip()
            if txt == "Pedido" or txt == "pedido":
                await b.click()
                print("✓ Clicked Pedido tab")
                await page.wait_for_timeout(1000)
                break

        # Now click the liquidation button
        for b in await page.query_selector_all('button'):
            inner = await b.inner_html() or ""
            if "fa-hand" in inner or "fa-scale" in inner:
                await b.click()
                print("✓ Clicked liquidation button")
                await page.wait_for_timeout(2000)
                break

        # Scroll the modal body to bottom
        await page.evaluate("""
            const modalBody = document.querySelector('.liquidacion-body, .modal-body');
            if (modalBody) {
                modalBody.scrollTop = modalBody.scrollHeight;
            }
            // Force a repaint
            window.dispatchEvent(new Event('scroll'));
        """)
        await page.wait_for_timeout(500)
        print("✓ Scrolled modal body to bottom")

        # Take screenshot of just the modal element if possible
        modal_el = await page.query_selector('.liquidacion-box')
        if modal_el:
            # Screenshot the modal element itself
            await modal_el.screenshot(path="/tmp/liquidacion_modal_element.png")
            print("✓ Modal element screenshot")

        # Take viewport screenshot
        await page.screenshot(path="/tmp/liquidacion_full.png")
        print("✓ Viewport screenshot")

        # Check what's visible
        modal_body = await page.query_selector('.liquidacion-body')
        if modal_body:
            scroll_info = await modal_body.evaluate("""
                el => ({
                    scrollTop: el.scrollTop,
                    scrollHeight: el.scrollHeight,
                    clientHeight: el.clientHeight,
                    atBottom: el.scrollTop + el.clientHeight >= el.scrollHeight - 5
                })
            """)
            print(f"Modal body scroll: {scroll_info}")

        # Verify content
        content = await page.content()
        checks = [
            ("Liquidación", "Liquidación" in content),
            ("sw-person", "sw-person" in content),
            ("sw-settlement", "sw-settlement" in content or "sw-sett" in content),
            ("Total global", "Total global" in content),
            (code, code in content),
        ]
        for name, ok in checks:
            print(f"  {'✓' if ok else '✗'} {name}")

        await browser.close()
        print(f"\nDone!")

if __name__ == "__main__":
    asyncio.run(main())
