const { exec } = require("child_process");
const queries = require("../../queries/queries");
const path = require("path");
const fs = require("fs");
const probe = require("probe-image-size");
const os = require("os");


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

    // Detect the best available device dynamically
    let device;
    try {
        const detectedDevice = await detectBestDevice();
        
        // If user requested a specific device and it's available, honor it
        if (requestedDevice && requestedDevice !== "auto" && requestedDevice !== "") {
            // Validate requested device against system capabilities
            if (requestedDevice === "mps" && detectedDevice === "mps") {
                device = "mps";
                console.log("Using requested MPS device");
            } else if ((requestedDevice === "cuda" || requestedDevice === "0" || requestedDevice === "1") && detectedDevice === "cuda") {
                device = "0"; // Use first CUDA device
                console.log("Using requested CUDA device (mapped to device 0)");
            } else if (requestedDevice === "cpu") {
                device = "cpu";
                console.log("Using requested CPU device");
            } else {
                console.log(`Requested device '${requestedDevice}' not available or invalid, using detected device: ${detectedDevice}`);
                device = detectedDevice;
            }
        } else {
            // Use auto-detected device
            device = detectedDevice;
            console.log(`Auto-detected and using device: ${device}`);
        }
    } catch (error) {
        console.log("Device detection failed, falling back to CPU:", error.message);
        device = "cpu";
    }
    
    // Final safety check
    if (!device || (device !== "cpu" && device !== "mps" && device !== "cuda")) {
        console.log(`Invalid device '${device}', defaulting to CPU`);
        device = "cpu";
    }
    
    console.log(`Using device: ${device} (requested: ${requestedDevice})`);
    
    // Map device to YOLO-compatible format
    const mappedDevice = mapDeviceForYolo(device);
    console.log(`Mapped device for YOLO: ${mappedDevice}`);  

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
        absDarknetProjectPath = runPath;
        absDarknetImagesPath = path.join(absDarknetProjectPath, "images");
        absDarknetImagesTrain = path.join(absDarknetImagesPath, "train");
        absDarknetImagesVal = path.join(absDarknetImagesPath, "val");
        absDarknetLabelsPath = path.join(absDarknetProjectPath, "labels");
        absDarknetLabelsTrain = path.join(absDarknetLabelsPath, "train");
        absDarknetLabelsVal = path.join(absDarknetLabelsPath, "val");
        absDarknetTrainPath = path.join(absDarknetProjectPath, "train");
        absDarknetWeightsPath = path.join(absDarknetTrainPath, "weights");

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
            fs.mkdirSync(absDarknetWeightsPath, { recursive: true }, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Weights Directory created");
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
            if (i < trainDataImageSplit) {
                absDarknetOrgImagesPath = path.join(
                    imagesPath,
                    existingImages.rows[i].IName,
                );
                absDarknetOrgLabelsPath = path.join(imagesPath, labelFile);
                absDarknetTrainImagesPath = path.join(
                    absDarknetImagesTrain,
                    existingImages.rows[i].IName,
                );
                absDarknetTrainLabelsPath = path.join(
                    absDarknetLabelsTrain,
                    labelFile,
                );
                
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
                absDarknetOrgImagesPath = path.join(
                    imagesPath,
                    existingImages.rows[i].IName,
                );
                absDarknetOrgLabelsPath = path.join(imagesPath, labelFile);
                absDarknetTrainValPath = path.join(
                    absDarknetImagesVal,
                    existingImages.rows[i].IName,
                );
                absDarknetTrainLabelsPath = path.join(
                    absDarknetLabelsVal,
                    labelFile,
                );
                
                try {
                    await fs.promises.symlink(
                        absDarknetOrgImagesPath,
                        absDarknetTrainValPath,
                        "file"
                    );
                    console.log("Symlink created for YOLO image validation file");
                } catch (err) {
                    console.log("Error creating image validation symlink:", err);
                }
                
                try {
                    await fs.promises.symlink(
                        absDarknetOrgLabelsPath,
                        absDarknetTrainLabelsPath,
                        "file"
                    );
                    console.log("Symlink created for YOLO label validation file");
                } catch (err) {
                    console.log("Error creating label validation symlink:", err);
                }
            }
        }

        ///////////////////Create symbolic link from darknet to run///////////////////////////////
        absDarknetProjectRun = absDarknetProjectPath;

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

        console.log("I am here bro hello");

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
        async (sourcePath, targetPath, x, y, width, height) => {
            try {
                const cropOptions = {
                    left: Math.floor(x), // Ensure x is an integer
                    top: Math.floor(y), // Ensure y is an integer
                    width: Math.floor(width), // Ensure width is an integer
                    height: Math.floor(height), // Ensure height is an integer
                };

                await sharp(sourcePath)
                    .extract(cropOptions) // Crop with x, y, w, h
                    .toFile(targetPath); // Save to the target path

                console.log(`Image cropped successfully: ${targetPath}`);
            } catch (err) {
                console.error(`error cropping image: ${err.message}`);
            }
        };

        project = `${Admin}-${PName}`;
        absDarknetProjectPath = runPath;
        absDarknetImagesPath = path.join(absDarknetProjectPath, "images");
        absDarknetImagesTrain = path.join(absDarknetImagesPath, "train");
        absDarknetImagesVal = path.join(absDarknetImagesPath, "val");
        absDarknetLabelsPath = path.join(absDarknetProjectPath, "labels");
        absDarknetLabelsTrain = path.join(absDarknetLabelsPath, "train");
        absDarknetLabelsVal = path.join(absDarknetLabelsPath, "val");

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
            if (i < trainDataImageSplit) {
                absDarknetOrgImagesPath = path.join(
                    imagesPath,
                    existingImages.rows[i].IName,
                );
                absDarknetOrgLabelsPath = path.join(imagesPath, labelFile);
                absDarknetTrainImagesPath = path.join(
                    absDarknetImagesTrain,
                    existingImages.rows[i].IName,
                );
                absDarknetTrainLabelsPath = path.join(
                    absDarknetLabelsTrain,
                    labelFile,
                );
                
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
                absDarknetOrgImagesPath = path.join(
                    imagesPath,
                    existingImages.rows[i].IName,
                );
                absDarknetTrainValPath = path.join(
                    absDarknetImagesVal,
                    existingImages.rows[i].IName,
                );
                
                try {
                    await fs.promises.symlink(
                        absDarknetOrgImagesPath,
                        absDarknetTrainValPath,
                        "file"
                    );
                    console.log("Symlink created for YOLO image validation file");
                } catch (err) {
                    console.log("Error creating image validation symlink:", err);
                }
            }
        }
    }

    darknetProjectRun = runPath;
    darknetImagesPath = path.join(absDarknetProjectPath, "images");
    darknetLabelsPath = path.join(absDarknetProjectPath, "labels");

    var cmd = "";

    if (yoloMode == "train") {
        cmd = `python3 ${yoloScript} -d ${runPath} -t ${yoloTask} -m ${yoloMode} -i ${darknetImagesPath} -n ${classesPath} -p ${trainDataPer} -l ${absDarknetProjectRun}/${log} -f ${darknetPath} -w ${weightPath} -b ${batch} -s ${subdiv} -x ${width} -y ${height} -v ${yoloVersion} -e ${epochs} -I ${imgsz} -D ${mappedDevice} -o "${options}"`;
    } else {
        cmd = `python3 --version`;
        console.log("YOLO python script not for training");
    }

    console.log(cmd);

    var success = "";
    var error = "";

    // Use spawn instead of exec to handle long-running processes better
    const { spawn } = require('child_process');
    
    console.log("=== STARTING PYTHON SCRIPT ===");
    
    exec(cmd, { maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
        console.log("=== PYTHON SCRIPT COMPLETED ===");
        
        if (stdout) {
            console.log("STDOUT:", stdout);
            fs.appendFile(`${absDarknetProjectRun}/${log}`, stdout, (err) => {
                if (err) console.log("Error writing stdout to log:", err);
            });
        }
        
        if (stderr) {
            console.log("STDERR:", stderr);
            fs.appendFile(`${absDarknetProjectRun}/${log}`, stderr, (err) => {
                if (err) console.log("Error writing stderr to log:", err);
            });
        }
        
        if (err) {
            console.log(`Python script error: ${err.message}`);
            error = err.message;
            fs.writeFile(
                `${darknetProjectRun}/${errFile}`,
                error,
                (err) => {
                    if (err) throw err;
                },
            );
        } else {
            success = "Training completed successfully";
        }

        fs.writeFile(`${runPath}/done.log`, success || "Process completed", (err) => {
            if (err) throw err;
        });
    });
    res.send({ Success: `YOLO Training Started` });
}

module.exports = yoloRun;
