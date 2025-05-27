const { exec } = require("child_process");
const queries = require("../../queries/queries");

async function yoloRun(req, res) {
    var date = Date.now();

    var PName = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        darknet_path = req.body.yolovx_path,
        yolovx_path = req.body.yolovx_path,
        log = `${date}.log`,
        trainDataPer = req.body.TrainingPercent,
        batch = req.body.batch,
        subdiv = req.body.subdiv,
        width = req.body.width,
        height = req.body.height,
        yolo_version = req.body.yolo_version,
        yolo_task = req.body.yolo_task,
        yolo_mode = req.body.yolo_mode,
        epochs = req.body.epochs,
        imgsz = req.body.imgsz,
        device = req.body.device,
        options = req.body.options,
        weight_name = req.body.weights;

    var err_file = `${date}-error.log`;

    var public_path = currentPath,
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        logs_path = training_path + "/logs",
        run_path = `${logs_path}/${date}`,
        classes_path = run_path + "/coco_classes.yaml",
        weight_path = training_path + "/weights/" + weight_name,
        yolo_script = public_path + "controllers/training/datatovalues.py",
        wrapper_path =
            public_path + "controllers/training/train_data_from_project.py";

    if (!fs.existsSync(run_path)) {
        fs.mkdirSync(run_path);
    }

    fs.writeFile(`${run_path}/${log}`, "", (err) => {
        if (err) throw err;
    });

    cfgTemp_path = public_path + "controllers/training/cfgTemplate.txt";
    cfgTemp = run_path + "/cfgTemplate.txt";
    fs.copyFile(cfgTemp_path, cfgTemp, (err) => {
        if (err) {
            console.log(err);
        }
    });

    dataTemp_path = public_path + "controllers/training/dataTemplate.txt";
    dataTemp = run_path + "/dataTemplate.txt";
    fs.copyFile(dataTemp_path, dataTemp, (err) => {
        if (err) {
            console.log(err);
        }
    });

    darknet_cfg_script = run_path + "/datatovalues.py";
    if (!existsSync(darknet_cfg_script)) {
        fs.copyFile(yolo_script, darknet_cfg_script, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    if (yolo_task == "detect") {
        project = `${Admin}-${PName}`;
        abs_darknet_project_path = run_path;
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
            existingImages = await queries.project.getAllImages(project_path);
            existingClasses = await queries.project.getAllClasses(project_path);
        } catch (err) {
            console.error(err);
            return res.status(500).send("Error fetching classes");
        }

        for (var i = 0; i < existingClasses.rows.length; i++) {
            cnames.push(existingClasses.rows[i].CName);
        }
        var dict_images_labels = {};

        for (var i = 0; i < existingImages.rows.length; i++) {
            var img = fs.readFileSync(
                    `${images_path}/${existingImages.rows[i].IName}`,
                ),
                img_data = probe.sync(img),
                img_w = img_data.width,
                img_h = img_data.height;

            const imageLabels = await queries.project.getLabelsForImageName(
                project_path,
                existingImages[i].IName,
            );

            for (var j = 0; j < imageLabels.rows.length; j++) {
                // x, y, w, h
                var centerX =
                    (imageLabels.rows[j].X + imageLabels.rows[j].W / 2) / img_w;
                var centerY =
                    (imageLabels.rows[j].Y + imageLabels.rows[j].H / 2) / img_h;
                to_string_value =
                    cnames.indexOf(imageLabels.rows[j].CName) +
                    " " +
                    centerX +
                    " " +
                    centerY +
                    " " +
                    imageLabels.rows[j].W / img_w +
                    " " +
                    imageLabels.rows[j].H / img_h +
                    "\n";
                if (dict_images_labels[results2[i].IName] == undefined) {
                    dict_images_labels[results2[i].IName] = to_string_value;
                } else {
                    dict_images_labels[results2[i].IName] += to_string_value;
                }
            }
            if (imageLabels.rows.length == 0) {
                dict_images_labels[results2[i].IName] = "";
            }
        }

        for (var key in dict_images_labels) {
            // remove_dot_ext = key.split(".")[0]
            remove_dot_ext = path.parse(key).name;
            fs.writeFileSync(
                `${images_path}/${remove_dot_ext}.txt`,
                dict_images_labels[key],
                (err) => {
                    if (err) throw err;
                },
            );
        }

        var dict_images_count = existingImages.rows.length;

        var trainDataImageSplit = Math.round(
            (trainDataPer / 100) * dict_images_count,
        );

        for (var i = 0; i < existingImages.rows.length; i++) {
            var filename = existingImages.rows[i].IName.substr(
                0,
                results1[i].IName.lastIndexOf("."),
            );
            var label_file = filename + ".txt";
            if (i < trainDataImageSplit) {
                abs_darknet_org_images_path = path.join(
                    images_path,
                    existingImages.rows[i].IName,
                );
                abs_darknet_org_labels_path = path.join(
                    images_path,
                    label_file,
                );
                abs_darknet_train_images_path = path.join(
                    abs_darknet_images_train,
                    existingImages.rows[i].IName,
                );
                abs_darknet_train_labels_path = path.join(
                    abs_darknet_labels_train,
                    label_file,
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
                    images_path,
                    existingImages.rows[i].IName,
                );
                abs_darknet_org_lables_path = path.join(
                    images_path,
                    label_file,
                );
                abs_darknet_train_val_path = path.join(
                    abs_darknet_images_val,
                    existingImages.rows[i].IName,
                );
                abs_darknet_train_labels_path = path.join(
                    abs_darknet_labels_val,
                    label_file,
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
            training_path,
            "logs",
            date.toString(),
            weight_name,
        );
        if (!fs.existsSync(abs_weight_project_path)) {
            console.log("Create symbolic link from YOLO model file");
            fs.symlink(weight_path, abs_weight_project_path, "file", (err) => {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Symlink created for YOLO model file");
                }
            });
        }

        var classes = "# Train/val/test sets\n";
        classes = classes + "path: " + run_path + "\n";
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

        fs.writeFileSync(classes_path, classes, (err) => {
            if (err) throw err;
            console.log("Done writing YOLO Classes file");
        });
    } else if (yolo_task == "classify") {
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
        abs_darknet_project_path = run_path;
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

        var dict_images_count = existingImages.rows.length;
        var trainDataImageSplit = Math.round(
            (trainDataPer / 100) * dict_images_count,
        );

        for (var i = 0; i < existingImages.rows.length; i++) {
            var filename = existingImages.rows[i].IName.substr(
                0,
                existingImages.rows[i].IName.lastIndexOf("."),
            );
            var label_file = filename + ".txt";
            if (i < trainDataImageSplit) {
                abs_darknet_org_images_path = path.join(
                    images_path,
                    existingImages.rows[i].IName,
                );
                abs_darknet_org_labels_path = path.join(
                    images_path,
                    label_file,
                );
                abs_darknet_train_images_path = path.join(
                    abs_darknet_images_train,
                    existingImages.rows[i].IName,
                );
                abs_darknet_train_labels_path = path.join(
                    abs_darknet_labels_train,
                    label_file,
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
                    images_path,
                    results1[i].IName,
                );
            }
        }
    }

    darknet_project_run = run_path;
    darknet_images_path = path.join(abs_darknet_project_path, "images");
    darknet_labels_path = path.join(abs_darknet_project_path, "labels");

    var cmd = "";

    if (yolo_mode == "train") {
        cmd = `python3 ${yolo_script} -d ${run_path} -t ${yolo_task} -m ${yolo_mode} -i ${darknet_images_path} -n ${classes_path} -p ${trainDataPer} -l ${abs_darknet_project_run}/${log} -f ${darknet_path} -w ${weight_path} -b ${batch} -s ${subdiv} -x ${width} -y ${height} -v ${yolo_version} -e ${epochs} -I ${imgsz} -D ${device} -o "${options}"`;
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
                    `${darknet_project_run}/${err_file}`,
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
                    `${darknet_project_run}/${err_file}`,
                    stderr,
                    (err) => {
                        if (err) throw err;
                    },
                );
            }
            //return;
        }

        fs.writeFile(`${run_path}/done.log`, success, (err) => {
            if (err) throw err;
        });
    });
    res.send({ Success: `YOLO Training Started` });
}

module.exports = yoloRun;
