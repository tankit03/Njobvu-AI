import cv2
import sys
import os

# Arguments: input_path, output_path, x, y, w, h
input_path = sys.argv[1]
output_path = sys.argv[2]
x = float(sys.argv[3])  # Changed to float to handle decimal values
y = float(sys.argv[4])  # Changed to float
w = float(sys.argv[5])  # Changed to float
h = float(sys.argv[6])  # Changed to float

# Convert to int for image indexing
x = int(x)
y = int(y)
w = int(w)
h = int(h)

# Read the image from the input path
image = cv2.imread(input_path)

if image is None:
    print(f"Error: Could not read image from {input_path}")
    sys.exit(1)

# Crop the image using integer indices
cropped_image = image[y:y+h, x:x+w]

# Write the cropped image to the output path
cv2.imwrite(output_path, cropped_image)

print(f"Cropped image saved to: {output_path}")
