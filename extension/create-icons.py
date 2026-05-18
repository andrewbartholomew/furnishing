#!/usr/bin/env python3
"""
Simple script to create extension icons for Furnishing Helper.
Creates placeholder icons with the app's evergreen color.
Replace with custom designs later if desired.
"""

from PIL import Image, ImageDraw
import os


def create_icon(size):
    """Create a simple sofa-style icon with evergreen background"""
    # Create image with evergreen background
    img = Image.new('RGB', (size, size), color='#4F7F72')
    draw = ImageDraw.Draw(img)

    # Calculate dimensions relative to icon size
    margin = size // 6
    center_x = size // 2

    # Draw a simplified sofa shape in white
    # Sofa seat (wide rectangle)
    seat_top = int(size * 0.45)
    seat_bottom = int(size * 0.65)
    seat_left = margin
    seat_right = size - margin
    draw.rounded_rectangle(
        [seat_left, seat_top, seat_right, seat_bottom],
        radius=max(1, size // 16),
        fill='white'
    )

    # Sofa back (slightly narrower rectangle above seat)
    back_top = int(size * 0.25)
    back_bottom = seat_top + max(1, size // 16)
    back_left = margin + size // 10
    back_right = size - margin - size // 10
    draw.rounded_rectangle(
        [back_left, back_top, back_right, back_bottom],
        radius=max(1, size // 12),
        fill='white'
    )

    # Left armrest
    arm_top = int(size * 0.35)
    arm_bottom = seat_bottom
    arm_left = seat_left
    arm_right = seat_left + size // 6
    draw.rounded_rectangle(
        [arm_left, arm_top, arm_right, arm_bottom],
        radius=max(1, size // 16),
        fill='white'
    )

    # Right armrest
    arm_left_r = seat_right - size // 6
    arm_right_r = seat_right
    draw.rounded_rectangle(
        [arm_left_r, arm_top, arm_right_r, arm_bottom],
        radius=max(1, size // 16),
        fill='white'
    )

    # Sofa legs (two small rectangles)
    leg_width = max(2, size // 12)
    leg_height = max(2, size // 8)
    leg_top = seat_bottom
    leg_bottom = seat_bottom + leg_height

    # Left leg
    leg_left = seat_left + size // 8
    draw.rectangle(
        [leg_left, leg_top, leg_left + leg_width, leg_bottom],
        fill='white'
    )

    # Right leg
    leg_right = seat_right - size // 8
    draw.rectangle(
        [leg_right - leg_width, leg_top, leg_right, leg_bottom],
        fill='white'
    )

    return img


# Create icons directory if it doesn't exist
os.makedirs('icons', exist_ok=True)

# Create icons in different sizes
sizes = [16, 48, 128]
for size in sizes:
    icon = create_icon(size)
    icon.save(f'icons/icon{size}.png')
    print(f'Created icon{size}.png')

print('Icons created successfully!')
