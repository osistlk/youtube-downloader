import os
import torch
import GPUtil
from transformers import ViTFeatureExtractor, ViTModel
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import time
import numpy as np

# Load the pre-trained ViT model and feature extractor
feature_extractor = ViTFeatureExtractor.from_pretrained(
    "google/vit-base-patch16-224-in21k"
)
model = ViTModel.from_pretrained("google/vit-base-patch16-224-in21k")

# Move the model to GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)

# Define your image paths
input_folder = "input"
output_folder = "output"

if not os.path.exists(output_folder):
    os.makedirs(output_folder)


# Function to measure VRAM usage
def measure_vram_usage():
    gpu = GPUtil.getGPUs()[0]
    return gpu.memoryFree, gpu.memoryUsed


# Define a function to upscale images
def upscale_image(image_name, upscale_factor=2):
    image_path = os.path.join(input_folder, image_name)
    output_path = os.path.join(output_folder, image_name)

    # Check if image already exists in output to skip it
    if os.path.exists(output_path):
        return False

    image = Image.open(image_path).convert("RGB")

    # Extract features using ViT
    inputs = feature_extractor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)

    # Resize the image using a simple interpolation method to upscale it
    new_size = (image.width * upscale_factor, image.height * upscale_factor)
    upscaled_image = image.resize(new_size, Image.BICUBIC)

    # Save the upscaled image
    upscaled_image.save(output_path)
    return True


# Function to adjust the number of workers based on VRAM usage and increment rate
def adjust_worker_count(current_workers, avg_vram_per_worker, vram_buffer=1024):
    free_vram, used_vram = measure_vram_usage()

    # Calculate how many workers we can add based on available VRAM and buffer
    available_for_use = free_vram - vram_buffer
    if available_for_use > avg_vram_per_worker:
        return current_workers + 1  # Increment workers
    elif available_for_use <= 0:
        # If we exceeded the buffer, reduce workers and delay
        print(f"Buffer limit exceeded. Reducing workers by 2 and delaying.")
        return max(
            1, current_workers - 2
        )  # Reduce workers by 2, ensure we have at least 1 worker
    else:
        return current_workers  # Maintain current worker count


# Parallel processing of images with controlled worker ramp-up
def process_images_in_parallel(
    image_names, avg_vram_per_worker, vram_buffer=1024, increment_delay=30
):
    total_images = len(image_names)
    current_workers = 4  # Start with four workers
    completed_images = 0

    with tqdm(
        total=total_images, desc="Upscaling Images", unit="image", dynamic_ncols=True
    ) as pbar:
        while image_names:
            # Adjust workers slowly, increasing only if we have enough free VRAM
            current_workers = adjust_worker_count(
                current_workers, avg_vram_per_worker, vram_buffer=vram_buffer
            )

            batch_size = min(
                len(image_names), current_workers
            )  # Process a batch that fits the current worker count
            batch = image_names[:batch_size]
            image_names = image_names[batch_size:]

            with ThreadPoolExecutor(max_workers=batch_size) as executor:
                futures = {
                    executor.submit(upscale_image, image_name): image_name
                    for image_name in batch
                }
                for future in as_completed(futures):
                    image_name = futures[future]
                    try:
                        result = future.result()
                        if result:  # Only update progress if the image was processed
                            pbar.update(1)
                            completed_images += 1
                    except Exception as exc:
                        print(f"Error: {image_name} generated an exception: {exc}")

            # Check the VRAM buffer after each batch
            free_vram, used_vram = measure_vram_usage()
            if free_vram < vram_buffer:
                # If we exceed the VRAM buffer, reduce workers and wait before incrementing
                print(
                    f"Exceeded VRAM buffer ({vram_buffer} MB). Reducing workers and pausing increments for {increment_delay} seconds."
                )
                current_workers = max(
                    1, current_workers - 2
                )  # Reduce by 2, but at least 1 worker
                time.sleep(increment_delay)  # Wait before incrementing again
            else:
                # Faster ramp-up: Wait for a shorter time before adding more workers
                time.sleep(increment_delay)


# Get list of images
image_names = [img for img in os.listdir(input_folder) if img.endswith(".png")]

# Initial average VRAM usage per worker (this can be adjusted based on actual measurements)
avg_vram_per_worker = 400  # Start with an estimate of 400MiB per worker

# Process images in parallel, incrementing workers slowly
process_images_in_parallel(
    image_names, avg_vram_per_worker, vram_buffer=1024, increment_delay=30
)
