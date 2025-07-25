const { exec } = require("child_process");
const queries = require("../../queries/queries");
const path = require("path");
const fs = require("fs");
const probe = require("probe-image-size");
const os = require("os");
const sharp = require("sharp");

// Function to detect the best available device for YOLO training
async function detectBestDevice() {
    return new Promise((resolve) => {
        console.log("=== DETECTING BEST DEVICE ===");

        // Check system platform
        const platform = os.platform();
        const arch = os.arch();

        console.log(`System: ${platform} ${arch}`);

        // Create a test Python script to check available devices
        const deviceCheckScript = `
import sys
try:
    import torch
    print(f"PyTorch available: True")
    print(f"CUDA available: {torch.cuda.is_available()}")
    print(f"CUDA device count: {torch.cuda.device_count()}")
    
    // Check for MPS (Apple Silicon)
    mps_available = hasattr(torch.backends, 'mps') and torch.backends.mps.is_available()
    print(f"MPS available: {mps_available}")
    
    // Determine best device
    if torch.cuda.is_available() and torch.cuda.device_count() > 0:
        print("BEST_DEVICE:cuda")
    elif mps_available:
        print("BEST_DEVICE:mps") 
    else:
        print("BEST_DEVICE:cpu")
        
except ImportError:
    print("PyTorch not available")
    print("BEST_DEVICE:cpu")
except Exception as e:
    print(f"Error: {e}")
    print("BEST_DEVICE:cpu")
`;

        // Execute the device detection script
        exec(`python3 -c "${deviceCheckScript}"`, { timeout: 10000 }, (err, stdout, stderr) => {
            let bestDevice = "cpu"; // Default fallback

            if (err) {
                console.log("Device detection error:", err.message);
                console.log("Falling back to CPU");
            } else if (stdout) {
                console.log("Device detection output:");
                console.log(stdout);

                // Extract the best device from output
                const lines = stdout.split('\n');
                const deviceLine = lines.find(line => line.startsWith('BEST_DEVICE:'));
                if (deviceLine) {
                    bestDevice = deviceLine.split(':')[1].trim();
                }
            }

            if (stderr) {
                console.log("Device detection stderr:", stderr);
            }

            console.log(`Selected device: ${bestDevice}`);
            resolve(bestDevice);
        });
    });
}


// Function to map device values to YOLO-compatible format
function mapDeviceForYolo(device) {
    switch (device) {
        case "mps":
            return "mps";
        case "cuda":
        case "gpu":
            return "0"; // Use first CUDA device
        case "0":
        case "1":
        case "2":
        case "3":
        case 0:
        case 1:
        case 2:
        case 3:
            return device.toString(); // Keep GPU index as string
        case "cpu":
        default:
            return "cpu";
    }
}

async function yoloRun(req, res) {
    var date = Date.now();

    var PName = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        darknetPath = req.body.yolovx_path,
        yolovxPath = req.body.yolovx_path,
        log = `${date}.log`,
        trainDataPer = req.body.TrainingPercent,
        batch = req.body.batch,
        subdiv = req.body.subdiv,
        width = req.body.width,
        height = req.body.height,
        yoloVersion = req.body.yolo_version,
        yoloTask = req.body.yolo_task,
        yoloMode = req.body.yolo_mode,
        epochs = req.body.epochs,
        imgsz = req.body.imgsz,
        requestedDevice = req.body.device, // Original requested device
        options = req.body.options,
        weightName = req.body.weights;
    device = req.body.device;
    var errFile = `${date}-error.log`;

    var publicPath = currentPath,
        mainPath = publicPath + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        projectPath = mainPath + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        imagesPath = projectPath + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloadsPath = mainPath + user + "_Downloads",
        trainingPath = projectPath + "/training",
        logsPath = trainingPath + "/logs",
        runPath = `${logsPath}/${date}`,
        classesPath = runPath + "/coco_classes.yaml",
        weightPath = trainingPath + "/weights/" + weightName,
        yoloScript = publicPath + "controllers/training/datatovalues.py",
        wrapperPath =
            publicPath + "controllers/training/train_data_from_project.py";

    if (!fs.existsSync(runPath)) {
        fs.mkdirSync(runPath);
    }

    fs.writeFile(`${runPath}/${log}`, "", (err) => {
        if (err) throw err;
    });

    cfgTempPath = publicPath + "controllers/training/cfgTemplate.txt";
    cfgTemp = runPath + "/cfgTemplate.txt";
    fs.copyFile(cfgTempPath, cfgTemp, (err) => {
        if (err) {
            console.log(err);
        }
    });

    dataTempPath = publicPath + "controllers/training/dataTemplate.txt";
    dataTemp = runPath + "/dataTemplate.txt";
    fs.copyFile(dataTempPath, dataTemp, (err) => {
        if (err) {
            console.log(err);
        }
    });

    darknetCfgScript = runPath + "/datatovalues.py";
    if (!fs.existsSync(darknetCfgScript)) {
        fs.copyFile(yoloScript, darknetCfgScript, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    // Get images and classes for both detect and classify tasks
    let existingImages;
    let existingClasses;

    try {
        existingImages = await queries.project.getAllImages(projectPath);
        existingClasses = await queries.project.getAllClasses(projectPath);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error fetching classes");
    }

    if (yoloTask == "detect") {
        project = `${Admin}-${PName}`;

        let absDarknetProjectPath = runPath;
        let absDarknetImagesPath = path.join(absDarknetProjectPath, "images");
        let absDarknetImagesTrain = path.join(absDarknetImagesPath, "train");
        let absDarknetImagesVal = path.join(absDarknetImagesPath, "val");
        let absDarknetLabelsPath = path.join(absDarknetProjectPath, "labels");
        let absDarknetLabelsTrain = path.join(absDarknetLabelsPath, "train");
        let absDarknetLabelsVal = path.join(absDarknetLabelsPath, "val");

        if (!fs.existsSync(absDarknetImagesPath)) {
            fs.mkdirSync(absDarknetImagesPath, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Images Directory created");
                }
            });
            fs.mkdirSync(absDarknetImagesTrain, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Images Train Directory created");
                }
            });
            fs.mkdirSync(absDarknetImagesVal, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Images Validate Directory created");
                }
            });
            fs.mkdirSync(absDarknetLabelsPath, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Labels Directory created");
                }
            });
            fs.mkdirSync(absDarknetLabelsTrain, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Labels Train Directory created");
                }
            });
            fs.mkdirSync(absDarknetLabelsVal, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Labels Validate Directory created");
                }
            });
        }

        var cnames = [];
        try {
        } catch (err) {
            console.error(err);
            return res.status(500).send("Error finding classes");
        }

        for (var i = 0; i < existingClasses.rows.length; i++) {
            cnames.push(existingClasses.rows[i].CName);
        }
        var dictImagesLabels = {};

        for (var i = 0; i < existingImages.rows.length; i++) {
            var img = fs.readFileSync(
                `${imagesPath}/${existingImages.rows[i].IName}`,
            ),
                imgData = probe.sync(img),
                imgW = imgData.width,
                imgH = imgData.height;

            const imageLabels = await queries.project.getLabelsForImageName(
                projectPath,
                existingImages.rows[i].IName,
            );

            for (var j = 0; j < imageLabels.rows.length; j++) {
                // x, y, w, h
                var centerX =
                    (imageLabels.rows[j].X + imageLabels.rows[j].W / 2) / imgW;
                var centerY =
                    (imageLabels.rows[j].Y + imageLabels.rows[j].H / 2) / imgH;
                toStringValue =
                    cnames.indexOf(imageLabels.rows[j].CName) +
                    " " +
                    centerX +
                    " " +
                    centerY +
                    " " +
                    imageLabels.rows[j].W / imgW +
                    " " +
                    imageLabels.rows[j].H / imgH +
                    "\n";
                if (
                    dictImagesLabels[existingImages.rows[i].IName] == undefined
                ) {
                    dictImagesLabels[existingImages.rows[i].IName] =
                        toStringValue;
                } else {
                    dictImagesLabels[existingImages.rows[i].IName] +=
                        toStringValue;
                }
            }
            if (imageLabels.rows.length == 0) {
                dictImagesLabels[existingImages.rows[i].IName] = "";
            }
        }

        for (var key in dictImagesLabels) {
            // remove_dot_ext = key.split(".")[0]
            removeDotExt = path.parse(key).name;
            fs.writeFileSync(
                `${imagesPath}/${removeDotExt}.txt`,
                dictImagesLabels[key],
                (err) => {
                    if (err) throw err;
                },
            );
        }

        var dictImagesCount = existingImages.rows.length;

        var trainDataImageSplit = Math.round(
            (trainDataPer / 100) * dictImagesCount,
        );

        for (let i = 0; i < existingImages.rows.length; i++) {
            var filename = existingImages.rows[i].IName.substr(
                0,
                existingImages.rows[i].IName.lastIndexOf("."),
            );

            var labelFile = filename + ".txt";

            let absDarknetOrgImagesPath = path.join(
                imagesPath,
                existingImages.rows[i].IName,
            );

            let absDarknetOrgLabelsPath = path.join(imagesPath, labelFile);

            let absDarknetTrainImagesPath = path.join(
                absDarknetImagesTrain,
                existingImages.rows[i].IName,
            );

            let absDarknetTrainLabelsPath = path.join(
                absDarknetLabelsTrain,
                labelFile,
            );

            if (i < trainDataImageSplit) {
                try {
                    await fs.promises.symlink(
                        absDarknetOrgImagesPath,
                        absDarknetTrainImagesPath,
                        "file"
                    );
                    console.log("Symlink created for YOLO image training file");
                } catch (err) {
                    console.log("Error creating image training symlink:", err);
                }

                try {
                    await fs.promises.symlink(
                        absDarknetOrgLabelsPath,
                        absDarknetTrainLabelsPath,
                        "file"
                    );
                    console.log("Symlink created for YOLO label training file");
                } catch (err) {
                    console.log("Error creating label training symlink:", err);
                }
            } else {
                let absDarknetValImagesPath = path.join(
                    absDarknetImagesVal,
                    existingImages.rows[i].IName,
                );
                let absDarknetValLabelsPath = path.join(
                    absDarknetLabelsVal,
                    labelFile,
                );

                try {
                    await fs.promises.symlink(
                        absDarknetOrgImagesPath,
                        absDarknetValImagesPath,
                        "file"
                    );
                    console.log("Symlink created for YOLO image validation file");
                } catch (err) {
                    console.log("Error creating image validation symlink:", err);
                }

                try {
                    await fs.promises.symlink(
                        absDarknetOrgLabelsPath,
                        absDarknetValLabelsPath,
                        "file"
                    );
                    console.log("Symlink created for YOLO label validation file");
                } catch (err) {
                    console.log("Error creating label validation symlink:", err);
                }
            }
        }

        ///////////////////Create symbolic link from darknet to run///////////////////////////////
        console.log(`all path training path: ${trainingPath}, weightname: ${weightName}`);

        absWeightProjectPath = path.join(
            trainingPath,
            "logs",
            date.toString(),
            weightName,
        );

        if (!fs.existsSync(absWeightProjectPath)) {
            console.log("Create symbolic link from YOLO model file");
            try {
                await fs.promises.symlink(weightPath, absWeightProjectPath, "file");
                console.log("Symlink created for YOLO model file");
            } catch (err) {
                console.log("Error creating symlink:", err);
            }
        }

        var classes = "# Train/val/test sets\n";
        classes = classes + "path: " + runPath + "\n";
        classes = classes + "train: " + absDarknetImagesTrain + "\n";
        classes = classes + "val: " + absDarknetImagesVal + "\n";
        classes = classes + "test: \n";
        classes = classes + "\n# Classes (COCO classes)\n";
        classes = classes + "names:\n";

        for (var i = 0; i < existingClasses.rows.length; i++) {
            classes =
                classes +
                "  " +
                i +
                ": " +
                existingClasses.rows[i].CName +
                "\n";
        }

        fs.writeFileSync(classesPath, classes, (err) => {
            if (err) throw err;
            console.log("Done writing YOLO Classes file");
        });
    } else if (yoloTask == "classify") {
        // if its classify
        // train val directories
        // for the secific project create the directories of all the labels
        // based on the speciic labels crop it
        const cropImage = async (sourcePath, targetPath, x_center_abs, y_center_abs, width_abs, height_abs, imageWidth, imageHeight) => {
            const x1 = Math.floor(x_center_abs - width_abs / 2);
            const y1 = Math.floor(y_center_abs - height_abs / 2);

            const cropLeft = Math.max(0, x1);
            const cropTop = Math.max(0, y1);
            const cropWidth = Math.max(1, Math.min(imageWidth - cropLeft, Math.floor(width_abs)));
            const cropHeight = Math.max(1, Math.min(imageHeight - cropTop, Math.floor(height_abs)));

            if (cropWidth <= 0 || cropHeight <= 0) {
                console.warn(`Skipping invalid crop for ${sourcePath}. Original absolute bbox: x=${x_center_abs}, y=${y_center_abs}, w=${width_abs}, h=${height_abs}. Resulting crop: left=${cropLeft}, top=${cropTop}, width=${cropWidth}, height=${cropHeight}.`);
                return false;
            }

            try {
                const cropOptions = {
                    left: Math.floor(cropLeft),
                    top: Math.floor(cropTop),
                    width: Math.floor(cropWidth),
                    height: Math.floor(cropHeight),
                };

                await sharp(sourcePath)
                    .extract(cropOptions)
                    .toFile(targetPath);
                console.log(`Image cropped successfully: ${targetPath}`);
                return true;
            } catch (err) {
                console.error(`Error cropping image ${sourcePath} to ${targetPath}: ${err.message}`);
                return false;
            }
        };

        console.log("Preparing data for classification task...");

        const absDarknetClassificationDatasetRoot = runPath;
        const absDarknetClassificationTrainImagesDir = path.join(absDarknetClassificationDatasetRoot, "train");
        const absDarknetClassificationValImagesDir = path.join(absDarknetClassificationDatasetRoot, "val");

        try {
            await fs.promises.mkdir(absDarknetClassificationTrainImagesDir, { recursive: true });
            await fs.promises.mkdir(absDarknetClassificationValImagesDir, { recursive: true });
            console.log(`Created base classification directories: ${absDarknetClassificationTrainImagesDir}, ${absDarknetClassificationValImagesDir}`);
        } catch (err) {
            console.error("Error creating base classification train/val directories:", err);
            return res.status(500).send("Error setting up classification directories.");
        }

        const trainDataImageSplit = Math.round((trainDataPer / 100) * existingImages.rows.length);
        const shuffledImages = existingImages.rows.sort(() => 0.5 - Math.random());

        for (let i = 0; i < shuffledImages.length; i++) {
            const image = shuffledImages[i];
            const sourceImagePath = path.join(imagesPath, image.IName);
            const isTrain = i < trainDataImageSplit;

            const targetBaseDir = isTrain
                ? absDarknetClassificationTrainImagesDir
                : absDarknetClassificationValImagesDir;

            try {
                const imageMetadata = await sharp(sourceImagePath).metadata();
                const originalWidth = imageMetadata.width;
                const originalHeight = imageMetadata.height;

                if (!originalWidth || !originalHeight) {
                    console.warn(`Could not get dimensions for image ${image.IName}, skipping.`);
                    continue;
                }

                const imageLabelsResult = await queries.project.getLabelsForImageName(projectPath, image.IName);
                const imageLabels = imageLabelsResult.rows;

                if (imageLabels.length === 0) {
                    console.warn(`Image ${image.IName} has no labels, skipping for classification training.`);
                    continue;
                }

                let croppedCount = 0;
                for (const label of imageLabels) {
                    const className = label.CName;
                    if (!className) {
                        console.warn(`Label for image ${image.IName} has no class name, skipping.`);
                        continue;
                    }

                    const classTargetDir = path.join(targetBaseDir, className);
                    await fs.promises.mkdir(classTargetDir, { recursive: true });

                    const croppedImageName = `${path.parse(image.IName).name}_crop_${label.LID}${path.parse(image.IName).ext}`;
                    const targetCroppedImagePath = path.join(classTargetDir, croppedImageName);

                    console.log(`Debug label values for label ID ${label.LID} in image ${image.IName}:`);
                    console.log(`  label.X: ${label.X} (Type: ${typeof label.X})`);
                    console.log(`  label.Y: ${label.Y} (Type: ${typeof label.Y})`);
                    console.log(`  label.W: ${label.W} (Type: ${typeof label.W})`);
                    console.log(`  label.H: ${label.W} (Type: ${typeof label.W})`);

                    const x_center_abs = label.X;
                    const y_center_abs = label.Y;
                    const width_abs = label.W;
                    const height_abs = label.H;

                    console.log(`  Assigned x_center_abs: ${x_center_abs} (Type: ${typeof x_center_abs})`);
                    console.log(`  Assigned y_center_abs: ${y_center_abs} (Type: ${typeof y_center_abs})`);
                    console.log(`  Assigned width_abs: ${width_abs} (Type: ${typeof width_abs})`);
                    console.log(`  Assigned height_abs: ${height_abs} (Type: ${typeof height_abs})`);

                    const didCrop = await cropImage(
                        sourceImagePath,
                        targetCroppedImagePath,
                        x_center_abs, y_center_abs, width_abs, height_abs,
                        originalWidth, originalHeight
                    );

                    if (didCrop) {
                        croppedCount++;
                    } else {
                        console.error(`Failed to crop and save for label ${label.LID} in image ${image.IName}`);
                    }
                }
                if (croppedCount === 0) {
                    console.warn(`No valid crops generated for image ${image.IName}.`);
                }

            } catch (err) {
                console.error(`Error processing image ${image.IName} for classification:`, err);
            }
        }

        var classificationDataYamlContent = "# Ultralytics YOLOv8 Classification Dataset\n";
        classificationDataYamlContent += `path: ${absDarknetClassificationDatasetRoot}\n`;
        classificationDataYamlContent += `train: train\n`;
        classificationDataYamlContent += `val: val\n`;
        classificationDataYamlContent += `test: \n\n`;

        classificationDataYamlContent += "names:\n";
        for (var i = 0; i < existingClasses.rows.length; i++) {
            classificationDataYamlContent += `  ${i}: ${existingClasses.rows[i].CName}\n`;
        }

        try {
            await fs.promises.writeFile(classesPath, classificationDataYamlContent);
            console.log("Done writing YOLO Classification Data YAML file (data.yaml)");
        } catch (err) {
            console.error("Error writing YOLO Classification Data YAML file:", err);
            return res.status(500).send("Error generating classification data file.");
        }
    }

    let absDarknetProjectPath = runPath;
    let absDarknetProjectRun = absDarknetProjectPath;

    darknetProjectRun = runPath;
    darknetImagesPath = path.join(absDarknetProjectPath, "images");
    darknetLabelsPath = path.join(absDarknetProjectPath, "labels");

    var cmd = "";

    if (yoloMode == "train") {
        cmd = `python3 ${yoloScript} -d ${runPath} -t ${yoloTask} -m ${yoloMode} -i ${darknetImagesPath} -n ${classesPath} -p ${trainDataPer} -l ${absDarknetProjectRun}/${log} -f ${darknetPath} -w ${weightPath} -b ${batch} -s ${subdiv} -x ${width} -y ${height} -v ${yoloVersion} -e ${epochs} -I ${imgsz} -D ${device} -o "${options}"`;
    } else {
        cmd = `python3 --version`;
        console.log("YOLO python script not for training");
    }

    console.log(cmd);

    var success = "";
    var error = "";

    console.log("=== STARTING PYTHON SCRIPT ===");

    fs.writeFileSync(`${absDarknetProjectRun}/${log}`, cmd);

    exec(cmd, { maxBuffer: 1024 * 1024 * 1024 * configFile["training_max_buffer_size"] }, (err, stdout, stderr) => {
        if (stdout) {
            console.log("STDOUT:", stdout);
            fs.appendFile(`${absDarknetProjectRun}/${log}`, stdout, (err) => {
                if (err) console.log("Error writing stdout to log:", err);
            });
        }
        if (err) {
            console.error(err);
            console.log(`This is the error: ${err.message}`);

            if (err.message != "stdout maxBuffer length exceeded") {
                success = err.message;

                fs.writeFile(
                    `${absDarknetProjectRun}/${errFile}`,
                    success,
                    (err) => {
                        if (err) throw err;
                    },
                );
            }
        } else if (stderr) {
            console.log(`This is the stderr: ${stderr}`);

            if (stderr != "stdout maxBuffer length exceeded") {
                fs.writeFile(
                    `${absDarknetProjectRun}/${errFile}`,
                    stderr,
                    (err) => {
                        if (err) throw err;
                    },
                );
            }
        }

        fs.writeFileSync(`${runPath}/done.log`, success);
    });



    // exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
    //     console.log("=== PYTHON SCRIPT COMPLETED ===");

    //     if (stdout) {
    //         console.log("STDOUT:", stdout);
    //         fs.appendFile(`${absDarknetProjectRun}/${log}`, stdout, (err) => {
    //             if (err) console.log("Error writing stdout to log:", err);
    //         });
    //     }
    //     if (stderr) {
    //         console.log("STDERR:", stderr);
    //         fs.appendFile(`${absDarknetProjectRun}/${log}`, stderr, (err) => {
    //             if (err) console.log("Error writing stderr to log:", err);
    //         });
    //     }

    //     if (err) {
    //         console.log(`Python script error: ${err.message}`);
    //         error = err.message;
    //         fs.writeFile(
    //             `${darknetProjectRun}/${errFile}`,
    //             error,
    //             (err) => {
    //                 if (err) throw err;
    //             },
    //         );
    //     } else {
    //         success = "Training completed successfully";
    //     }

    //     fs.writeFile(`${runPath}/done.log`, success || "Process completed", (err) => {
    //         if (err) throw err;
    //     });
    // });
    res.send({ Success: `YOLO Training Started` });
}

module.exports = yoloRun;
