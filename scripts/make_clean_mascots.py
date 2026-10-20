import os
from PIL import Image
import numpy as np
from collections import deque

def remove_background(input_path, output_path, bg_tol=25):
    img = Image.open(input_path).convert('RGBA')
    arr = np.array(img)
    h, w, _ = arr.shape

    # Sample corners for background color
    corners = np.array([
        arr[0, 0, :3],
        arr[0, w-1, :3],
        arr[h-1, 0, :3],
        arr[h-1, w-1, :3]
    ], dtype=np.float32)
    bg_color = np.median(corners, axis=0)
    print(f"Processing {os.path.basename(input_path)} - bg_color: {bg_color}")

    # Color distance from bg_color
    diff = np.linalg.norm(arr[:, :, :3].astype(np.float32) - bg_color, axis=2)

    # Flood fill mask from the edges
    visited = np.zeros((h, w), dtype=bool)
    mask_bg = np.zeros((h, w), dtype=bool)

    queue = deque()
    # Add borders
    for x in range(w):
        if diff[0, x] < bg_tol:
            queue.append((0, x))
            visited[0, x] = True
        if diff[h-1, x] < bg_tol:
            queue.append((h-1, x))
            visited[h-1, x] = True
    for y in range(h):
        if diff[y, 0] < bg_tol and not visited[y, 0]:
            queue.append((y, 0))
            visited[y, 0] = True
        if diff[y, w-1] < bg_tol and not visited[y, w-1]:
            queue.append((y, w-1))
            visited[y, w-1] = True

    # 4-way flood fill
    while queue:
        y, x = queue.popleft()
        mask_bg[y, x] = True

        for dy, dx in ((-1, 0), (1, 0), (0, -1), (0, 1)):
            ny, nx = y + dy, x + dx
            if 0 <= ny < h and 0 <= nx < w and not visited[ny, nx]:
                visited[ny, nx] = True
                if diff[ny, nx] < bg_tol:
                    queue.append((ny, nx))

    # Apply transparency to background
    arr[mask_bg, 3] = 0

    # Soft feathering on edge pixels (1-2 pixels)
    # Any non-zero alpha pixel adjacent to a 0 alpha pixel gets partial alpha if diff is close
    edge_candidates = (~mask_bg) & (diff < bg_tol * 1.5)
    arr[edge_candidates, 3] = np.clip((diff[edge_candidates] - bg_tol) / (bg_tol * 0.5) * 255, 0, 255).astype(np.uint8)

    result = Image.fromarray(arr)
    result.save(output_path, 'PNG')
    print(f"Saved transparent PNG to {output_path}")

mascots = {
    'puffy_clean.png': r'C:\Users\anhtu\.gemini\antigravity\brain\346ab546-65f0-4235-aa91-aced7a804c46\pufferfish_ram_mascot_1792411188584.jpg',
    'dino_clean.png': r'C:\Users\anhtu\.gemini\antigravity\brain\346ab546-65f0-4235-aa91-aced7a804c46\mint_dino_mascot_1792411257762.jpg',
    'cat_clean.png': r'C:\Users\anhtu\.gemini\antigravity\brain\346ab546-65f0-4235-aa91-aced7a804c46\lavender_cat_mascot_1792411108256.jpg',
    'octo_clean.png': r'C:\Users\anhtu\.gemini\antigravity\brain\346ab546-65f0-4235-aa91-aced7a804c46\coral_octopus_mascot_v3_1792411018191.jpg'
}

out_dir = r'd:\Personal-Project\DevGotchi\frontend\public\mascots'
os.makedirs(out_dir, exist_ok=True)

for filename, path in mascots.items():
    remove_background(path, os.path.join(out_dir, filename))
