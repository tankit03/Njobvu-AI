async function yoloRun(req, res) {
    console.log("Starting YOLO Run:");

    const { exec } = require("child_process");
    //const {spawn} = require('child_process');

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

    /*
	Steps:
	1. Create txt files for each image
	2. Create classes.txt file
	3. Call datatovalues.py script
	*/

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

    //Create run path
    if (!fs.existsSync(run_path)) {
        fs.mkdirSync(run_path);
    }

    fs.writeFile(`${run_path}/${log}`, "", (err) => {
        if (err) throw err;
    });

    /////////////Copy YOLO template files over to run folder///////////////////////
    console.log("Copy YOLO template files over to run folder");
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

    //////////////Copy darknet config script to darknet directory//////////////////
    console.log("Copy YOLO config script to run directory");
    darknet_cfg_script = run_path + "/datatovalues.py";
    if (!existsSync(darknet_cfg_script)) {
        fs.copyFile(yolo_script, darknet_cfg_script, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    // Connect to database
    var ycdb = new sqlite3.Database(
        project_path + "/" + PName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to ycdb.");
        },
    );
    ycdb.getAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.get(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
        });
    };
    ycdb.allAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.all(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
        });
    };
    ycdb.runAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.run(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    reject(err);
                } else {
                    resolve(row);
                }
            });
        }).catch((err) => {
            console.error(err);
        });
    };

    if (yolo_task == "detect") {
        /////////////Create Project within run folder if does not exist////////////////////
        console.log(
            "Create Detect Project within run folder if does not exist",
        );
        project = `${Admin}-${PName}`;
        abs_darknet_project_path = run_path;
        abs_darknet_images_path = path.join(abs_darknet_project_path, "images");
        abs_darknet_images_train = path.join(abs_darknet_images_path, "train");
        abs_darknet_images_val = path.join(abs_darknet_images_path, "val");
        abs_darknet_labels_path = path.join(abs_darknet_project_path, "labels");
        abs_darknet_labels_train = path.join(abs_darknet_labels_path, "train");
        abs_darknet_labels_val = path.join(abs_darknet_labels_path, "val");

        if (!fs.existsSync(abs_darknet_images_path)) {
            //Create images and labels directories
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

        //////////////////Create label txt files////////////////////////////
        console.log("Create label txt files");
        var cnames = [];
        var results1 = await ycdb.allAsync("SELECT * FROM Classes");
        var results2 = await ycdb.allAsync("SELECT * FROM Images");
        for (var i = 0; i < results1.length; i++) {
            cnames.push(results1[i].CName);
        }
        var dict_images_labels = {};

        for (var i = 0; i < results2.length; i++) {
            var img = fs.readFileSync(`${images_path}/${results2[i].IName}`),
                img_data = probe.sync(img),
                img_w = img_data.width,
                img_h = img_data.height;

            var results3 = await ycdb.allAsync(
                "SELECT * FROM Labels WHERE IName = '" +
                    results2[i].IName +
                    "'",
            );
            for (var j = 0; j < results3.length; j++) {
                // x, y, w, h
                var centerX = (results3[j].X + results3[j].W / 2) / img_w;
                var centerY = (results3[j].Y + results3[j].H / 2) / img_h;
                to_string_value =
                    cnames.indexOf(results3[j].CName) +
                    " " +
                    centerX +
                    " " +
                    centerY +
                    " " +
                    results3[j].W / img_w +
                    " " +
                    results3[j].H / img_h +
                    "\n";
                if (dict_images_labels[results2[i].IName] == undefined) {
                    dict_images_labels[results2[i].IName] = to_string_value;
                } else {
                    dict_images_labels[results2[i].IName] += to_string_value;
                }
            }
            if (results3.length == 0) {
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

        //////////////Create image and label links //////////////////////////
        console.log("Create YOLO image and label link files for the split");
        var results0 = await ycdb.allAsync(
            "SELECT COUNT(*) as COUNT FROM Images",
        );
        var dict_images_count = results0[0].COUNT;
        var results1 = await ycdb.allAsync("SELECT * FROM Images");
        var trainDataImageSplit = Math.round(
            (trainDataPer / 100) * dict_images_count,
        );
        var trainDataValSplit = Math.round(
            ((100 - trainDataPer) / 100) * dict_images_count,
        );

        for (var i = 0; i < results1.length; i++) {
            var filename = results1[i].IName.substr(
                0,
                results1[i].IName.lastIndexOf("."),
            );
            var label_file = filename + ".txt";
            if (i < trainDataImageSplit) {
                abs_darknet_org_images_path = path.join(
                    images_path,
                    results1[i].IName,
                );
                abs_darknet_org_labels_path = path.join(
                    images_path,
                    label_file,
                );
                abs_darknet_train_images_path = path.join(
                    abs_darknet_images_train,
                    results1[i].IName,
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
                abs_darknet_org_lables_path = path.join(
                    images_path,
                    label_file,
                );
                abs_darknet_train_val_path = path.join(
                    abs_darknet_images_val,
                    results1[i].IName,
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

        //////////////Create Classes file////////////////////////////
        var results2 = await ycdb.allAsync("SELECT * FROM Classes");
        console.log("Create YOLO Classes file");
        var classes = "# Train/val/test sets\n";
        classes = classes + "path: " + run_path + "\n";
        classes = classes + "train: " + abs_darknet_images_train + "\n";
        classes = classes + "val: " + abs_darknet_images_val + "\n";
        classes = classes + "test: \n";
        classes = classes + "\n# Classes (COCO classes)\n";
        classes = classes + "names:\n";

        for (var i = 0; i < results2.length; i++) {
            classes = classes + "  " + i + ": " + results2[i].CName + "\n";
        }

        fs.writeFileSync(classes_path, classes, (err) => {
            if (err) throw err;
            console.log("Done writing YOLO Classes file");
        });

        ycdb.close((err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("ycdb closed successfully");
            }
        });
    } else if (yolo_task == "classify") {
        // if its classify
        // train val directories
        // for the secific project create the directories of all the labels
        // based on the speciic labels crop it
        const cropImage = async (
            sourcePath,
            targetPath,
            x,
            y,
            width,
            height,
        ) => {
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

        /////////////Create Project within run folder if does not exist////////////////////
        console.log(
            "Create Classify Project within run folder if does not exist",
        );
        project = `${Admin}-${PName}`;
        abs_darknet_project_path = run_path;
        abs_darknet_images_path = path.join(abs_darknet_project_path, "images");
        abs_darknet_images_train = path.join(abs_darknet_images_path, "train");
        abs_darknet_images_val = path.join(abs_darknet_images_path, "val");

        if (!fs.existsSync(abs_darknet_images_path)) {
            //Create images and labels directories
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

        //////////////Create image and label links //////////////////////////
        console.log("Create YOLO image and label link files for the split");
        var results0 = await ycdb.allAsync(
            "SELECT COUNT(*) as COUNT FROM Images",
        );
        var dict_images_count = results0[0].COUNT;
        var results1 = await ycdb.allAsync("SELECT * FROM Images");
        var trainDataImageSplit = Math.round(
            (trainDataPer / 100) * dict_images_count,
        );
        var trainDataValSplit = Math.round(
            ((100 - trainDataPer) / 100) * dict_images_count,
        );

        for (var i = 0; i < results1.length; i++) {
            var filename = results1[i].IName.substr(
                0,
                results1[i].IName.lastIndexOf("."),
            );
            var label_file = filename + ".txt";
            if (i < trainDataImageSplit) {
                abs_darknet_org_images_path = path.join(
                    images_path,
                    results1[i].IName,
                );
                abs_darknet_org_labels_path = path.join(
                    images_path,
                    label_file,
                );
                abs_darknet_train_images_path = path.join(
                    abs_darknet_images_train,
                    results1[i].IName,
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

    console.log("\n");
    console.log("   yolo_task = ", yolo_task);
    console.log("   yolo_mode = ", yolo_mode);
    console.log("darknet_path = ", darknet_path);
    console.log(" yolovx_path = ", yolovx_path);
    console.log("   main_path = ", main_path);
    console.log("    run_path = ", run_path);
    console.log("dnet_pct_run = ", abs_darknet_project_run);
    console.log("dnet_img_pth = ", abs_darknet_images_path);
    console.log("classes_path = ", classes_path);
    console.log(" absdnetprun = ", abs_darknet_project_run);
    console.log(" weight_name = ", weight_name);
    console.log("images_count = ", dict_images_count);
    console.log("trainDataPer = ", trainDataPer);
    console.log(" trainimgspt = ", trainDataImageSplit);
    console.log(" trainvalspt = ", trainDataValSplit);
    console.log("    run_path = ", run_path);
    console.log("\n");

    /////////////////////////////// Call Ashwin's script here /////////////////////////////////////////
    console.log("Calling Ultralytics YOLO python script to do training");
    console.log("YOLO training task: ", yolo_task);

    // Pass in python path, script, and options
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
    console.log(cmd);

    var child = exec(cmd, (err, stdout, stderr) => {
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
        console.log("stdout: ", stdout);
        console.log("stderr: ", stderr);
        console.log("err: ", err);
        console.log("The YOLO training script has finished running");
        fs.writeFile(`${run_path}/done.log`, success, (err) => {
            if (err) throw err;
        });
    });
    res.send({ Success: `YOLO Training Started` });
}

module.exports = yoloRun;
