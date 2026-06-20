import os
import shutil
from PIL import Image

src_path = r"C:\Users\rishi\.gemini\antigravity-ide\brain\fda3e78c-e8f2-4490-b0a1-3afb9e58dfb4\taskyy_app_icon_1781955446004.png"
public_dir = r"c:\Users\rishi\Desktop\Code World\Taskyy\public"

try:
    img = Image.open(src_path)
    # Save 512x512
    img.resize((512, 512), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "icon-512.png"))
    # Save 192x192
    img.resize((192, 192), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "icon-192.png"))
    # Save 32x32 for favicon
    img.resize((32, 32), Image.Resampling.LANCZOS).save(os.path.join(public_dir, "favicon.png"))
    print("Icons successfully resized and saved using PIL.")
except Exception as e:
    print(f"PIL error: {e}. Falling back to simple copying...")
    # Fallback copy
    shutil.copy(src_path, os.path.join(public_dir, "icon-512.png"))
    shutil.copy(src_path, os.path.join(public_dir, "icon-192.png"))
    shutil.copy(src_path, os.path.join(public_dir, "favicon.png"))
    print("Icons copied without resizing.")
