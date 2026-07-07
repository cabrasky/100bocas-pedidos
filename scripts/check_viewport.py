#!/usr/bin/env python3
"""Check if liquidation modal bottom is visible in viewport screenshot."""
from PIL import Image

img = Image.open('/tmp/liquidacion_full.png')
# Check for green (success check) and settlement text colors
import numpy as np
arr = np.array(img)
h, w = arr.shape[:2]

# The modal overlay has a dark semi-transparent background
# The modal itself has a white/light background
# Check bottom portion for the settlement section
bottom_half = arr[h//2:, :, :]

# Green for success/cuadradas
green = (bottom_half[:,:,0] == 22) & (bottom_half[:,:,1] == 163) & (bottom_half[:,:,2] == 74)
print(f"Green pixels in bottom half: {green.sum()}")

# Orange/amber for warning/transfers
amber = (bottom_half[:,:,0] == 245) & (bottom_half[:,:,1] == 158) & (bottom_half[:,:,2] == 11)
print(f"Amber pixels in bottom half: {amber.sum()}")

# Blue for transfer arrows/links
blue = (bottom_half[:,:,0] == 59) & (bottom_half[:,:,1] == 130) & (bottom_half[:,:,2] == 246)
print(f"Blue pixels in bottom half: {blue.sum()}")

# White background of modal
white = (bottom_half[:,:,0] == 255) & (bottom_half[:,:,1] == 255) & (bottom_half[:,:,2] == 255)
print(f"White pixels in bottom half: {white.sum()} / {bottom_half.shape[0]*bottom_half.shape[1]} = {100*white.sum()/(bottom_half.shape[0]*bottom_half.shape[1]):.1f}%")

# Check for the specific dark navy header color
navy = (arr[:,:,0] == 15) & (arr[:,:,1] == 23) & (arr[:,:,2] == 42)
navy_rows = np.any(navy, axis=1)
navy_indices = np.where(navy_rows)[0]
if len(navy_indices) > 0:
    print(f"Navy rows in viewport: {navy_indices[0]}-{navy_indices[-1]} of {h}")
else:
    print("No navy in viewport - modal header may not be visible!")
