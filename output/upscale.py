import os
import torch
import GPUtil
from transformers import ViTFeatureExtractor, ViTModel
from PIL import Image
from concurrent.futures import ThreadPoolExecutor, as_completed
from tqdm import tqdm
import time

# Load the pre-trained ViT model and feature extractor
feature_extractor = ViTFeatureExtractor.from_pretrained('google/vit-base-patch16-224-in21k')
model = ViTModel.from_pretrained('google/vit-base-patch16-224-in21k')

# Move the model to GPU if available
device = 'cuda' if torch.cuda.is_available() else 'cpu'
model = model.to(device)

# Define your image paths
input_folder = "input"
output_folder = "output"

if not os.path.exists(output_folder):
    os.makedirs(output_folder)

# Define a function to clear the console
def clear_console():
    os.system('cls' if os.name == 'nt' else 'clear')

# Define a function to upscale images
def upscale_image(image_name, upscale_factor=2):
    image_path = os.path.join(input_folder, image_name)
    output_path = os.path.join(output_folder, image_name)

    # Check if image already exists in output to skip it
    if os.path.exists(output_path):
        return False  # Return False for skipping the image

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
    return True  # Return True for successful processing

# Function to monitor available VRAM and dynamically adjust workers
def get_max_workers(vram_buffer=1000):
    gpus = GPUtil.getGPUs()
    if gpus:
        gpu = gpus[0]  # Assume we are using the first GPU (adjust if needed)
        available_vram = gpu.memoryFree  # Free VRAM in MiB
        used_vram = gpu.memoryUsed       # Used VRAM in MiB
        total_vram = gpu.memoryTotal     # Total VRAM in MiB

        # Calculate available VRAM minus the buffer
        available_for_use = available_vram - vram_buffer
        if available_for_use <= 0:
            return 1  # Minimum one worker to avoid overloading the GPU

        # Assume each worker takes ~600MiB VRAM based on your current usage pattern
        worker_vram_usage = 600
        max_workers = max(1, int(available_for_use // worker_vram_usage))  # Ensure max_workers is an integer

        return max_workers
    else:
        return 1  # Fallback to single worker if no GPU is detected

# Parallel processing of images with dynamic worker adjustment and progress bar
def process_images_in_parallel(image_names):
    total_images = len(image_names)

    with tqdm(total=total_images, desc="Upscaling Images", unit="image", dynamic_ncols=True) as pbar:
        while image_names:
            clear_console()  # Clear the console at each iteration
            max_workers = get_max_workers()  # Dynamically adjust the workers
            batch_size = min(len(image_names), max_workers)  # Process a batch that fits within VRAM
            batch = image_names[:batch_size]
            image_names = image_names[batch_size:]

            with ThreadPoolExecutor(max_workers=batch_size) as executor:
                futures = {executor.submit(upscale_image, image_name): image_name for image_name in batch}
                for future in as_completed(futures):
                    image_name = futures[future]
                    try:
                        result = future.result()
                        if result:  # Only update progress if the image was processed
                            pbar.update(1)
                    except Exception as exc:
                        print(f"Error: {image_name} generated an exception: {exc}")

            time.sleep(1)  # Small delay to allow VRAM to free up if necessary

# Get list of images
image_names = [img for img in os.listdir(input_folder) if img.endswith(".png")]

# Process images in parallel, dynamically adjusting worker count
process_images_in_parallel(image_names)
