#!/usr/bin/env python3
"""Analyze the liquidation screenshot and find the modal area."""
from PIL import Image
import numpy as np

img = Image.open('/tmp/liquidacion_full_page.png')
w, h = img.size
arr = np.array(img)

# Find rows with significant dark navy (#0f172a = rgb(15, 23, 42))
navy_mask = (arr[:,:,0] == 15) & (arr[:,:,1] == 23) & (arr[:,:,2] == 42)
navy_rows = np.any(navy_mask, axis=1)
navy_indices = np.where(navy_rows)[0]

if len(navy_indices) > 0:
    top = max(0, navy_indices[0] - 50)
    bottom = min(h, navy_indices[-1] + 50)
    crop = img.crop((0, top, w, bottom))
    crop.save('/tmp/liquidacion_modal_crop.png')
    print(f"Navy rows: {navy_indices[0]}-{navy_indices[-1]} of {h}")
    print(f"Modal crop: {crop.size}")
else:
    print("No navy pixels - trying dark color search...")
    dark_mask = (arr[:,:,0] < 40) & (arr[:,:,1] < 40) & (arr[:,:,2] < 60)
    dark_rows = np.any(dark_mask, axis=1)
    dark_indices = np.where(dark_rows)[0]
    if len(dark_indices) > 0:
        top = max(0, dark_indices[0] - 50)
        bottom = min(h, dark_indices[-1] + 50)
        crop = img.crop((0, top, w, bottom))
        crop.save('/tmp/liquidacion_modal_crop.png')
        print(f"Dark rows: {dark_indices[0]}-{dark_indices[-1]} of {h}")
        print(f"Modal crop: {crop.size}")

# Also crop just the bottom 30% (where liquidation most likely is)
bottom_crop = img.crop((0, int(h * 0.7), w, h))
bottom_crop.save('/tmp/liquidacion_bottom30.png')
print(f"Bottom 30% crop: {bottom_crop.size}")
