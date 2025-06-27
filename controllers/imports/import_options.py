import os
from ultralytics import YOLO
import sys
from PIL import Image
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
    # Ensure output directory exists
    if not os.path.exists(output):
        os.makedirs(output)
    
    # Check if input_dir contains a single directory, and if so, use it as the new input_dir
    items = os.listdir(input_dir)
    if len(items) == 1 and os.path.isdir(os.path.join(input_dir, items[0])):
        input_dir = os.path.join(input_dir, items[0])
    
    project_path = os.path.dirname(output)
        
    # Create labels.txt in the output directory instead of root
    labels_path = os.path.join(output, 'labels.txt')
    with open(labels_path, 'w') as f:
        #for each directory of imgs under a class, we are going to get each img, open it get all the data and write that too labels file
        if os.path.exists(input_dir):
            for directory in os.listdir(input_dir):
                dir_path = os.path.join(input_dir, directory)
                if os.path.isdir(dir_path):
                    for img in os.listdir(dir_path):
                        input_image_path = os.path.join(dir_path, img)
                        if os.path.isfile(input_image_path):
                            img_to_open = Image.open(input_image_path)
                            width, height = img_to_open.size
                            x = 0
                            y = 0
                            f.write(f"{directory} {x} {y} {width} {height} {img}\\n")
                 
    script_dir = os.path.dirname(os.path.abspath(__file__))
    import_nj_script = os.path.join(script_dir, "importNJ.py")
    # Update command to use the new labels path
    command = f'python3 {import_nj_script} -n new -i {input_dir} -t {labels_path} -p {project_path} -z {project_path} -C yes -d {db_name}'
    os.system(command)


def inference_into_classification(input_dir, output, weights_file, classification_dir):

    model = YOLO(weights_file)

    # Get class names dynamically from the model
    class_names = model.names 

    if not os.path.exists(classification_dir):
        os.makedirs(classification_dir)

    for img in os.listdir(input_dir):
        if img.lower().endswith(('.png', '.jpeg', '.jpg', '.tif')):
            img_path = os.path.join(input_dir, img)
            results = model(img_path)
            
            for result in results:
                for box in result.boxes:
                    x1, y1, x2, y2 = box.xyxy.tolist()[0]
                    x2 = x2 - x1 
                    y2 = y2 - y1  
                    class_id = int(box.cls.item())

                    #get clas name by unique class id
                    class_name = class_names.get(class_id, "unknown")

                    img_obj = Image.open(img_path)
                    
                    cropped_img = img_obj.crop((x1, y1, x1 + x2, y1 + y2))

                    cropped_img_name = os.path.basename(img_path).replace('.jpg', f'_{int(x1)}_{class_name}.jpg')

                    class_dir = os.path.join(classification_dir, class_name)
                    if not os.path.exists(class_dir):
                        os.makedirs(class_dir)

                    cropped_img_path = os.path.join(class_dir, cropped_img_name)
                    cropped_img.save(cropped_img_path)

    classification_plus_import(classification_dir, output)

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

    command = f'python3 importNJ.py -n new -i {input_Dir} -t labels.txt -p {output} -z {output}'
    os.system(command)

for i in range(1, len(sys.argv)):
    if sys.argv[i] == '-i':
        input_dir = sys.argv[i+1]

    elif sys.argv[i] == '-w':
        weights_file = sys.argv[i+1]

    elif sys.argv[i] == '-l':
        label_file = sys.argv[i+1]

    elif sys.argv[i] == '-c':
        classification_dir = sys.argv[i+1]

    elif sys.argv[i] == '-o':
        output = sys.argv[i+1]

    elif sys.argv[i] == '-d':
        db_name = sys.argv[i+1]

    elif sys.argv[i] == '-r':
        runs = sys.argv[i+1]
        if runs == 'class':
            classification_plus_import(db_name, input_dir, output)
        elif runs == 'inf':
            inference_plus_import(input_dir, output, weights_file)
        elif runs == 'ci':
            inference_into_classification(input_dir, output, weights_file, classification_dir)
        else:
            print("invalid run type")

    elif sys.argv[i] == '-h':
        help()




