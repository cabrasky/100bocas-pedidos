#!/usr/bin/env python3
"""Take liquidation modal screenshot with tall viewport to show full modal."""
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

        # Load app
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

        # Navigate to session
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
        await page.wait_for_timeout(3000)
        print("✓ Joined")

        # Click Pedido tab
        for b in await page.query_selector_all('button'):
            txt = (await b.text_content() or "").strip()
            if txt == "Pedido":
                await b.click()
                await page.wait_for_timeout(1000)
                break

        # Click liquidation button
        for b in await page.query_selector_all('button'):
            inner = await b.inner_html() or ""
            if "fa-hand" in inner:
                await b.click()
                print("✓ Opened liquidation")
                await page.wait_for_timeout(2000)
                break

        # Get modal info
        modal_info = await page.evaluate("""
            () => {
                const modal = document.querySelector('.liquidacion-box');
                if (!modal) return null;
                const body = modal.querySelector('.liquidacion-body');
                if (!body) return {rect: modal.getBoundingClientRect()};
                return {
                    modalRect: modal.getBoundingClientRect(),
                    bodyRect: body.getBoundingClientRect(),
                    bodyScrollHeight: body.scrollHeight,
                    bodyClientHeight: body.clientHeight,
                    viewportHeight: window.innerHeight,
                };
            }
        """)
        
        if modal_info:
            mh = modal_info['modalRect']['height']
            bh = modal_info['bodyScrollHeight']
            bch = modal_info['bodyClientHeight']
            print(f"Modal height: {mh:.0f}, Body scroll: {bh} vs client: {bch}")
            
            if bh > bch:
                # Body needs scrolling - scroll to bottom
                await page.evaluate("""
                    const body = document.querySelector('.liquidacion-body');
                    if (body) body.scrollTop = body.scrollHeight;
                """)
                await page.wait_for_timeout(500)
                print(f"Scrolled to bottom (needed)")
                
                # If modal is still taller than viewport, we need a taller viewport
                if mh > modal_info['viewportHeight'] and modal_info['viewportHeight'] < 2000:
                    # We'd need to resize
                    print(f"Modal ({mh:.0f}) > viewport ({modal_info['viewportHeight']})")
        else:
            print("⚠ No modal found")

        # Take the screenshot
        await page.screenshot(path="/tmp/liquidacion_final.png")
        print("✓ Screenshot taken")

        # Check content
        content = await page.content()
        checks = {}
        for term in ["Liquidación", "sw-settlement", "sw-person", "sw-summary", "Total global", code, "pagó"]:
            checks[term] = term in content
        
        for k, v in checks.items():
            print(f"  {'✓' if v else '✗'} {k}")

        await browser.close()
        print(f"\nDone! Session: {BASE}/?s={code}")

if __name__ == "__main__":
    asyncio.run(main())
