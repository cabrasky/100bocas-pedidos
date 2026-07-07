#!/usr/bin/env python3
"""Crop around the liquidation modal."""
from PIL import Image

img = Image.open('/tmp/liquidacion_full_page.png')
w, h = img.size

# Navy at y=7274-7421, let's get a wider view
# The modal header is at the top, body extends below
top = 6800  # well before the modal
bottom = min(h, 8300)  # well after the modal footer
crop = img.crop((0, top, w, bottom))
crop.save('/tmp/liquidacion_modal_full.png')
print(f"Modal full crop: {crop.size}")

# Also save the bottom 30%
bottom30 = img.crop((0, int(h * 0.65), w, h))
bottom30.save('/tmp/liquidacion_bottom35.png')
print(f"Bottom 35%: {bottom30.size}")

# Also check for green (success) and amber (warning) pixels which would indicate settlements
import numpy as np
arr = np.array(img)
# Green (#16a34a = rgb(22, 163, 74))
green_mask = (arr[top:bottom,:,0] == 22) & (arr[top:bottom,:,1] == 163) & (arr[top:bottom,:,2] == 74)
print(f"Green pixels (success): {green_mask.sum()}")
# Amber (#f59e0b)
amber_mask = (arr[top:bottom,:,0] == 245) & (arr[top:bottom,:,1] == 158) & (arr[top:bottom,:,2] == 11)
print(f"Amber pixels (warning): {amber_mask.sum()}")
# Blue (#3b82f6) for links
blue_mask = (arr[top:bottom,:,0] == 59) & (arr[top:bottom,:,1] == 130) & (arr[top:bottom,:,2] == 246)
print(f"Blue pixels: {blue_mask.sum()}")
