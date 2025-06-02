const { exec } = require("child_process");
const queries = require("../../queries/queries");

async function yoloRun(req, res) {
    var date = Date.now();

    var PName = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        darknetPath = req.body.yolovxPath,
        yolovxPath = req.body.yolovxPath,
        log = `${date}.log`,
        trainDataPer = req.body.TrainingPercent,
        batch = req.body.batch,
        subdiv = req.body.subdiv,
        width = req.body.width,
        height = req.body.height,
        yoloVersion = req.body.yoloVersion,
        yoloTask = req.body.yoloTask,
        yoloMode = req.body.yoloMode,
        epochs = req.body.epochs,
        imgsz = req.body.imgsz,
        device = req.body.device,
        options = req.body.options,
        weightName = req.body.weights;

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

    cfgTemp_path = publicPath + "controllers/training/cfgTemplate.txt";
    cfgTemp = runPath + "/cfgTemplate.txt";
    fs.copyFile(cfgTemp_path, cfgTemp, (err) => {
        if (err) {
            console.log(err);
        }
    });

    dataTemp_path = publicPath + "controllers/training/dataTemplate.txt";
    dataTemp = runPath + "/dataTemplate.txt";
    fs.copyFile(dataTemp_path, dataTemp, (err) => {
        if (err) {
            console.log(err);
        }
    });

    darknet_cfg_script = runPath + "/datatovalues.py";
    if (!existsSync(darknet_cfg_script)) {
        fs.copyFile(yoloScript, darknet_cfg_script, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    if (yoloTask == "detect") {
        project = `${Admin}-${PName}`;
        abs_darknet_project_path = runPath;
        abs_darknet_images_path = path.join(abs_darknet_project_path, "images");
        abs_darknet_images_train = path.join(abs_darknet_images_path, "train");
        abs_darknet_images_val = path.join(abs_darknet_images_path, "val");
        abs_darknet_labels_path = path.join(abs_darknet_project_path, "labels");
        abs_darknet_labels_train = path.join(abs_darknet_labels_path, "train");
        abs_darknet_labels_val = path.join(abs_darknet_labels_path, "val");

        if (!fs.existsSync(abs_darknet_images_path)) {
            fs.mkdirSync(abs_darknet_images_path, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Images Directory created");
                }
            });
            fs.mkdirSync(abs_darknet_images_train, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Images Train Directory created");
                }
            });
            fs.mkdirSync(abs_darknet_images_val, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Images Validate Directory created");
                }
            });
            fs.mkdirSync(abs_darknet_labels_path, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Lables Directory created");
                }
            });
            fs.mkdirSync(abs_darknet_labels_train, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Lables Train Directory created");
                }
            });
            fs.mkdirSync(abs_darknet_labels_val, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Lables Validate Directory created");
                }
            });
        }

        var cnames = [];
        try {
        } catch (err) {
            console.error(err);
            return res.status(500).send("Error finding classes");
        }

        let existingImages;
        let existingClasses;

        try {
            existingImages = await queries.project.getAllImages(projectPath);
            existingClasses = await queries.project.getAllClasses(projectPath);
        } catch (err) {
            console.error(err);
            return res.status(500).send("Error fetching classes");
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
                existingImages[i].IName,
            );

            for (var j = 0; j < imageLabels.rows.length; j++) {
                // x, y, w, h
                var centerX =
                    (imageLabels.rows[j].X + imageLabels.rows[j].W / 2) / imgW;
                var centerY =
                    (imageLabels.rows[j].Y + imageLabels.rows[j].H / 2) / imgH;
                to_string_value =
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
                if (dictImagesLabels[results2[i].IName] == undefined) {
                    dictImagesLabels[results2[i].IName] = to_string_value;
                } else {
                    dictImagesLabels[results2[i].IName] += to_string_value;
                }
            }
            if (imageLabels.rows.length == 0) {
                dictImagesLabels[results2[i].IName] = "";
            }
        }

        for (var key in dictImagesLabels) {
            // remove_dot_ext = key.split(".")[0]
            remove_dot_ext = path.parse(key).name;
            fs.writeFileSync(
                `${imagesPath}/${remove_dot_ext}.txt`,
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

        for (var i = 0; i < existingImages.rows.length; i++) {
            var filename = existingImages.rows[i].IName.substr(
                0,
                results1[i].IName.lastIndexOf("."),
            );
            var labelFile = filename + ".txt";
            if (i < trainDataImageSplit) {
                abs_darknet_org_images_path = path.join(
                    imagesPath,
                    existingImages.rows[i].IName,
                );
                abs_darknet_org_labels_path = path.join(
                    imagesPath,
                    labelFile,
                );
                abs_darknet_train_images_path = path.join(
                    abs_darknet_images_train,
                    existingImages.rows[i].IName,
                );
                abs_darknet_train_labels_path = path.join(
                    abs_darknet_labels_train,
                    labelFile,
                );
                fs.symlink(
                    abs_darknet_org_images_path,
                    abs_darknet_train_images_path,
                    "file",
                    (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(
                                "Symlink created for YOLO image training file",
                            );
                        }
                    },
                );
                fs.symlink(
                    abs_darknet_org_labels_path,
                    abs_darknet_train_labels_path,
                    "file",
                    (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(
                                "Symlink created for YOLO label training file ",
                            );
                        }
                    },
                );
            } else {
                console.log("Symlink created for YOLO image validation file");
                abs_darknet_org_images_path = path.join(
                    imagesPath,
                    existingImages.rows[i].IName,
                );
                abs_darknet_org_lables_path = path.join(
                    imagesPath,
                    labelFile,
                );
                abs_darknet_train_val_path = path.join(
                    abs_darknet_images_val,
                    existingImages.rows[i].IName,
                );
                abs_darknet_train_labels_path = path.join(
                    abs_darknet_labels_val,
                    labelFile,
                );
                fs.symlink(
                    abs_darknet_org_images_path,
                    abs_darknet_train_val_path,
                    "file",
                    (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(
                                "Symlink created for YOLO image validation file",
                            );
                        }
                    },
                );
                fs.symlink(
                    abs_darknet_org_lables_path,
                    abs_darknet_train_labels_path,
                    "file",
                    (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(
                                "Symlink created for YOLO label validation file",
                            );
                        }
                    },
                );
            }
        }

        ///////////////////Create symbolic link from darknet to run///////////////////////////////
        abs_darknet_project_run = abs_darknet_project_path;
        abs_weight_project_path = path.join(
            trainingPath,
            "logs",
            date.toString(),
            weightName,
        );
        if (!fs.existsSync(abs_weight_project_path)) {
            console.log("Create symbolic link from YOLO model file");
            fs.symlink(weightPath, abs_weight_project_path, "file", (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Symlink created for YOLO model file");
                }
            });
        }

        var classes = "# Train/val/test sets\n";
        classes = classes + "path: " + runPath + "\n";
        classes = classes + "train: " + abs_darknet_images_train + "\n";
        classes = classes + "val: " + abs_darknet_images_val + "\n";
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
        abs_darknet_project_path = runPath;
        abs_darknet_images_path = path.join(abs_darknet_project_path, "images");
        abs_darknet_images_train = path.join(abs_darknet_images_path, "train");
        abs_darknet_images_val = path.join(abs_darknet_images_path, "val");

        if (!fs.existsSync(abs_darknet_images_path)) {
            fs.mkdirSync(abs_darknet_images_path, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Images Directory created");
                }
            });

            fs.mkdirSync(abs_darknet_images_train, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Images Train Directory created");
                }
            });

            fs.mkdirSync(abs_darknet_images_val, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("YOLO Images Validate Directory created");
                }
            });
        }

        var dictImagesCount = existingImages.rows.length;
        var trainDataImageSplit = Math.round(
            (trainDataPer / 100) * dictImagesCount,
        );

        for (var i = 0; i < existingImages.rows.length; i++) {
            var filename = existingImages.rows[i].IName.substr(
                0,
                existingImages.rows[i].IName.lastIndexOf("."),
            );
            var labelFile = filename + ".txt";
            if (i < trainDataImageSplit) {
                abs_darknet_org_images_path = path.join(
                    imagesPath,
                    existingImages.rows[i].IName,
                );
                abs_darknet_org_labels_path = path.join(
                    imagesPath,
                    labelFile,
                );
                abs_darknet_train_images_path = path.join(
                    abs_darknet_images_train,
                    existingImages.rows[i].IName,
                );
                abs_darknet_train_labels_path = path.join(
                    abs_darknet_labels_train,
                    labelFile,
                );
                fs.symlink(
                    abs_darknet_org_images_path,
                    abs_darknet_train_images_path,
                    "file",
                    (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(
                                "Symlink created for YOLO image training file",
                            );
                        }
                    },
                );
                fs.symlink(
                    abs_darknet_org_labels_path,
                    abs_darknet_train_labels_path,
                    "file",
                    (err) => {
                        if (err) {
                            console.log(err);
                        } else {
                            console.log(
                                "Symlink created for YOLO label training file ",
                            );
                        }
                    },
                );
            } else {
                console.log("Symlink created for YOLO image validation file");
                abs_darknet_org_images_path = path.join(
                    imagesPath,
                    results1[i].IName,
                );
            }
        }
    }

    darknet_project_run = runPath;
    darknet_images_path = path.join(abs_darknet_project_path, "images");
    darknet_labels_path = path.join(abs_darknet_project_path, "labels");

    var cmd = "";

    if (yoloMode == "train") {
        cmd = `python3 ${yoloScript} -d ${runPath} -t ${yoloTask} -m ${yoloMode} -i ${darknet_images_path} -n ${classesPath} -p ${trainDataPer} -l ${abs_darknet_project_run}/${log} -f ${darknetPath} -w ${weightPath} -b ${batch} -s ${subdiv} -x ${width} -y ${height} -v ${yoloVersion} -e ${epochs} -I ${imgsz} -D ${device} -o "${options}"`;
    } else {
        cmd = `python3 --version`;
        console.log("YOLO python script not for training");
    }

    var success = "";
    var error = "";

    exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.log(`This is the error: ${err.message}`);
            if (err.message != "stdout maxBuffer length exceeded") {
                success = err.message;
                fs.writeFile(
                    `${darknet_project_run}/${errFile}`,
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
                    `${darknet_project_run}/${errFile}`,
                    stderr,
                    (err) => {
                        if (err) throw err;
                    },
                );
            }
            //return;
        }

        fs.writeFile(`${runPath}/done.log`, success, (err) => {
            if (err) throw err;
        });
    });
    res.send({ Success: `YOLO Training Started` });
}

module.exports = yoloRun;
