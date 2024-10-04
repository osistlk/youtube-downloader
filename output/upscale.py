import os
import torch
import GPUtil
from transformers import ViTFeatureExtractor, ViTModel
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import time
import numpy as np  # For calculating averages

# Load the pre-trained ViT model and feature extractor
feature_extractor = ViTFeatureExtractor.from_pretrained(
    "google/vit-base-patch16-224-in21k"
)
model = ViTModel.from_pretrained("google/vit-base-patch16-224-in21k")

# Move the model to GPU if available
device = "cuda" if torch.cuda.is_available() else "cpu"
model = model.to(device)

# Define your image paths
input_folder = "path/to/pngs"
output_folder = "path/to/upscaled/pngs"

if not os.path.exists(output_folder):
    os.makedirs(output_folder)


# Function to measure VRAM usage
def measure_vram_usage():
    gpu = GPUtil.getGPUs()[0]
    return gpu.memoryUsed


# Define a function to upscale images and measure VRAM per worker
def upscale_image_and_measure(image_name, upscale_factor=2):
    image_path = os.path.join(input_folder, image_name)
    output_path = os.path.join(output_folder, image_name)

    # Check if image already exists in output to skip it
    if os.path.exists(output_path):
        return False, 0  # Return False for skipping the image and 0 VRAM usage

    image = Image.open(image_path).convert("RGB")

    # Measure VRAM before processing
    vram_before = measure_vram_usage()

    # Extract features using ViT
    inputs = feature_extractor(images=image, return_tensors="pt").to(device)
    with torch.no_grad():
        outputs = model(**inputs)

    # Resize the image using a simple interpolation method to upscale it
    new_size = (image.width * upscale_factor, image.height * upscale_factor)
    upscaled_image = image.resize(new_size, Image.BICUBIC)

    # Save the upscaled image
    upscaled_image.save(output_path)

    # Measure VRAM after processing
    vram_after = measure_vram_usage()

    # Calculate the VRAM used by this worker
    vram_used = vram_after - vram_before

    return True, vram_used


# Function to run one worker multiple times and calculate average VRAM usage
def calculate_average_vram_usage(samples=10):
    vram_usages = []
    for image_name in image_names[:samples]:  # Use the first few images for measurement
        _, vram_used = upscale_image_and_measure(image_name)
        if vram_used > 0:
            vram_usages.append(vram_used)

    if vram_usages:
        avg_vram_usage = np.mean(vram_usages)
        print(f"Initial average VRAM usage per worker: {avg_vram_usage:.2f} MiB")
        return avg_vram_usage
    else:
        print("Unable to measure VRAM usage.")
        return 600  # Default if measurements fail


# Function to monitor available VRAM and dynamically adjust workers
def get_max_workers(
    avg_vram_per_worker, vram_buffer=1024
):  # Increased buffer to 1024MB (1GB)
    gpus = GPUtil.getGPUs()
    if gpus:
        gpu = gpus[0]  # Assume we are using the first GPU (adjust if needed)
        available_vram = gpu.memoryFree  # Free VRAM in MiB
        used_vram = gpu.memoryUsed  # Used VRAM in MiB
        total_vram = gpu.memoryTotal  # Total VRAM in MiB

        # Calculate available VRAM minus the buffer
        available_for_use = available_vram - vram_buffer
        if available_for_use <= 0:
            return 1  # Minimum one worker to avoid overloading the GPU

        # Dynamically adjust workers based on the measured average VRAM usage per worker
        max_workers = max(
            1, int(available_for_use // avg_vram_per_worker)
        )  # Ensure max_workers is an integer

        return max_workers
    else:
        return 1  # Fallback to single worker if no GPU is detected


# Parallel processing of images with dynamic worker adjustment and rolling average
def process_images_in_parallel(image_names, avg_vram_per_worker, measure_interval=10):
    total_images = len(image_names)
    completed_images = 0
    vram_usages = [avg_vram_per_worker]  # Start with the initial average VRAM usage

    with tqdm(
        total=total_images, desc="Upscaling Images", unit="image", dynamic_ncols=True
    ) as pbar:
        while image_names:
            # Calculate the rolling average every `measure_interval` images
            if completed_images % measure_interval == 0 and completed_images > 0:
                rolling_avg_vram = np.mean(vram_usages[-measure_interval:])
                print(
                    f"Rolling average VRAM usage per worker: {rolling_avg_vram:.2f} MiB"
                )
                avg_vram_per_worker = rolling_avg_vram

            max_workers = get_max_workers(
                avg_vram_per_worker, vram_buffer=1024
            )  # Adjust workers based on VRAM usage
            batch_size = min(
                len(image_names), max_workers
            )  # Process a batch that fits within VRAM
            batch = image_names[:batch_size]
            image_names = image_names[batch_size:]

            with ThreadPoolExecutor(max_workers=batch_size) as executor:
                futures = {
                    executor.submit(upscale_image_and_measure, image_name): image_name
                    for image_name in batch
                }
                for future in as_completed(futures):
                    image_name = futures[future]
                    try:
                        result, vram_used = future.result()
                        if result:  # Only update progress if the image was processed
                            pbar.update(1)
                            completed_images += 1
                            vram_usages.append(
                                vram_used
                            )  # Append VRAM usage for rolling average calculation
                    except Exception as exc:
                        print(f"Error: {image_name} generated an exception: {exc}")

            time.sleep(1)  # Small delay to allow VRAM to free up if necessary


# Get list of images
image_names = [img for img in os.listdir(input_folder) if img.endswith(".png")]

# Step 1: Measure VRAM usage by running one worker a few times
avg_vram_per_worker = calculate_average_vram_usage(samples=10)

# Step 2: Process images in parallel, dynamically adjusting worker count and using a rolling average
process_images_in_parallel(image_names, avg_vram_per_worker, measure_interval=10)
