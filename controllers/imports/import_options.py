import os
from ultralytics import YOLO
import sys
from PIL import Image
import subprocess
import shutil
#classes need to be of form X_Y or X or X_y_z or X-y X-y-z if there are spaces in the class name it will give errors

runs = ''
input_dir = ''
output = ''
weights_file = ''
classification_dir = ''
db_name = ''


def help():
    print('\t\tCLASSIFICATION')
    print('\t\texample run for classification [import_options.py -i input_dir -o output -r class]')
    print('\t\tinput should be a directory of sub directories used for classification\n')

    print('\t\tINFERENCE + CLASSIFICATION')
    print('\t\texample run for classification [import_options.py -i input_dir -o output -w weights_file -r ci]')
    print('\t\tinput should be a directory of sub directories used for classification\n')

    print('\t\tINFERENCE')
    print('\t\tExample run for inference [import_options.py -i input_dir -o output -w weights_file.pt -r inf]')
    print('\t\tinput should be a directory of images used for inference and the weights file should be the weights file related to your project')

def classification_plus_import(db_name, input_dir, output):
    # This function expects input_dir to be a directory of class-subdirectories.
    # It handles an optional single container directory.
    
    dir_to_process = input_dir
    try:
        items = os.listdir(input_dir)
        # If the input dir has only one item and it's a directory, assume it's a container and step into it.
        if len(items) == 1 and os.path.isdir(os.path.join(input_dir, items[0])):
            print(f"Found single container directory, stepping into: {items[0]}")
            dir_to_process = os.path.join(input_dir, items[0])
    except FileNotFoundError:
        print(f"FATAL: The specified import directory was not found: {input_dir}", file=sys.stderr)
        sys.exit(1)

    project_path = output
    images_path = os.path.join(output, 'images')
    
    # Ensure images directory exists
    if not os.path.exists(images_path):
        os.makedirs(images_path)
        
    # Create labels.txt in the project directory
    labels_path = os.path.join(output, 'labels.txt')
    with open(labels_path, 'w') as f:
        #for each directory of imgs under a class, we are going to get each img, open it get all the data and write that too labels file
        if os.path.exists(dir_to_process):
            for directory in os.listdir(dir_to_process):
                dir_path = os.path.join(dir_to_process, directory)
                if os.path.isdir(dir_path):
                    for img in os.listdir(dir_path):
                        input_image_path = os.path.join(dir_path, img)
                        if os.path.isfile(input_image_path):
                            img_to_open = Image.open(input_image_path)
                            width, height = img_to_open.size
                            x = 0
                            y = 0
                            new_img_name = f"{directory}_{img}"
                            f.write(f"{directory} {x} {y} {width} {height} {new_img_name}\n")
                 
    script_dir = os.path.dirname(os.path.abspath(__file__))
    import_nj_script = os.path.join(script_dir, "importNJ.py")
    # Update command to use the new labels path
    command = [
        'python3', 
        import_nj_script, 
        '-n', 'new', 
        '-i', dir_to_process, 
        '-t', labels_path, 
        '-p', project_path, 
        '-z', project_path, 
        '-C', 'yes', 
        '-d', db_name
    ]
    
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(f"importNJ.py stderr:\n{result.stderr}", file=sys.stderr)
    except subprocess.CalledProcessError as e:
        print(f"Error executing importNJ.py. Return code: {e.returncode}", file=sys.stderr)
        print(f"Stdout: {e.stdout}", file=sys.stderr)
        print(f"Stderr: {e.stderr}", file=sys.stderr)
        sys.exit(1)


def inference_into_classification(db_name, input_dir, output, weights_file, classification_dir):
    print("\n--- Starting Inference into Classification ---")
    print(f"Input directory: {input_dir}")
    print(f"Weights file: {weights_file}")
    print(f"Output project path: {output}")
    print(f"Temporary classification directory: {classification_dir}")

    try:
        model = YOLO(weights_file)
        class_names = model.names
        print(f"Model loaded successfully. Class names: {class_names}")
    except Exception as e:
        print(f"FATAL: Error loading YOLO model: {e}", file=sys.stderr)
        sys.exit(1)

    if not os.path.exists(classification_dir):
        os.makedirs(classification_dir)

    total_images_processed = 0
    total_detections = 0

    # Recursively find all image files in the input directory
    image_files = []
    for root, dirs, files in os.walk(input_dir):
        for file in files:
            if file.lower().endswith(('.png', '.jpeg', '.jpg', '.tif')):
                image_files.append(os.path.join(root, file))

    if not image_files:
        print(f"FATAL: No image files found in {input_dir} or its subdirectories.", file=sys.stderr)
        sys.exit(1)
        
    print(f"Found {len(image_files)} images to process in {input_dir} and its subdirectories.")

    for img_path in image_files:
        print(f"\nProcessing image: {img_path}")
        total_images_processed += 1
        try:
            # Setting a low confidence threshold to maximize detections
            results = model(img_path, conf=0.1) 
            
            img_detections = 0
            for result in results:
                for box in result.boxes:
                    img_detections += 1
                    total_detections += 1
                    x1, y1, x2, y2 = box.xyxy.tolist()[0]
                    x2 = x2 - x1 
                    y2 = y2 - y1  
                    class_id = int(box.cls.item())

                    class_name = class_names.get(class_id, "unknown_class")
                    print(f"  - Detection! Class: '{class_name}'. Saving cropped image.")

                    img_obj = Image.open(img_path)
                    
                    cropped_img = img_obj.crop((x1, y1, x1 + x2, y1 + y2))

                    cropped_img_name = os.path.basename(img_path).replace('.jpg', f'_{int(x1)}_{class_name}.jpg')

                    class_dir = os.path.join(classification_dir, class_name)
                    if not os.path.exists(class_dir):
                        os.makedirs(class_dir)

                    cropped_img_path = os.path.join(class_dir, cropped_img_name)
                    cropped_img.save(cropped_img_path)

            if img_detections == 0:
                print("  - No detections in this image.")

        except Exception as e:
            print(f"An error occurred during inference for {img_path}: {e}", file=sys.stderr)
    
    print("\n--- Inference Summary ---")
    print(f"Total images processed: {total_images_processed}")
    print(f"Total detections: {total_detections}")

    import_source_dir = ''
    if total_detections > 0:
        print("Detections found. Importing cropped images from temporary directory.")
        import_source_dir = classification_dir
    else:
        print("WARNING: No objects were detected. Importing original images into an 'unclassified' category.")
        
        # Create a new temporary directory for the original images that fits the expected structure
        unclassified_import_dir = os.path.join(os.path.dirname(classification_dir), "unclassified_import")
        unclassified_subdir = os.path.join(unclassified_import_dir, "unclassified")
        os.makedirs(unclassified_subdir, exist_ok=True)

        # Copy original images from their full source paths to the new structure
        for src_path in image_files:
            shutil.copy(src_path, os.path.join(unclassified_subdir, os.path.basename(src_path)))

        import_source_dir = unclassified_import_dir

    classification_plus_import(db_name, import_source_dir, output)

#need to save images then save them into dir based on class id then ask chris what else he wants

def inference_plus_import(input_dir, output, weights_file):
    model = YOLO(weights_file)

    with open('labels.txt', "w") as f:
        for img in os.listdir(input_dir):
            if img.lower().endswith(('.png','.jpeg','.jpg','.tif')):
                img_path = os.path.join(input_dir,img)
                results = model(img_path)
                for result in results:
                    for box in result.boxes:
                        x1, y1, x2, y2 = box.xyxy.tolist()[0]
                        #scale the box info to work for NJ input
                        x2 = x2 - x1
                        y2 = y2 - y1
                        class_id = int(box.cls.item())
                        f.write(f"{class_id} {x1} {y1} {x2} {y2} {img}\n")

    f.close()

    script_dir = os.path.dirname(os.path.abspath(__file__))
    import_nj_script = os.path.join(script_dir, "importNJ.py")
    command = [
        'python3', 
        import_nj_script, 
        '-n', 'new', 
        '-i', input_dir, 
        '-t', 'labels.txt', 
        '-p', output, 
        '-z', output
    ]
    
    try:
        result = subprocess.run(command, check=True, capture_output=True, text=True)
        print(result.stdout)
        if result.stderr:
            print(f"importNJ.py stderr:\n{result.stderr}", file=sys.stderr)
    except subprocess.CalledProcessError as e:
        print(f"Error executing importNJ.py. Return code: {e.returncode}", file=sys.stderr)
        print(f"Stdout: {e.stdout}", file=sys.stderr)
        print(f"Stderr: {e.stderr}", file=sys.stderr)
        sys.exit(1)

# Main argument parsing and execution logic
if __name__ == '__main__':
    # Parse all arguments first
    for i in range(1, len(sys.argv)):
        if sys.argv[i] == '-i':
            input_dir = sys.argv[i+1]
        elif sys.argv[i] == '-w':
            weights_file = sys.argv[i+1]
        elif sys.argv[i] == '-c':
            classification_dir = sys.argv[i+1]
        elif sys.argv[i] == '-o':
            output = sys.argv[i+1]
        elif sys.argv[i] == '-d':
            db_name = sys.argv[i+1]
        elif sys.argv[i] == '-r':
            runs = sys.argv[i+1]
        elif sys.argv[i] == '-h':
            help()
            sys.exit()

    # Then, after the loop, decide what to run
    if runs == 'class':
        classification_plus_import(db_name, input_dir, output)
    elif runs == 'inf':
        inference_plus_import(input_dir, output, weights_file)
    elif runs == 'ci':
        inference_into_classification(db_name, input_dir, output, weights_file, classification_dir)
    elif runs:
        print(f"invalid run type: {runs}")




