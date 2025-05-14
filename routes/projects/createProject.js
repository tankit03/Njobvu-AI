const fs = require("fs");
const { exec } = require("child_process");
const ffmpeg = require("ffmpeg");
const StreamZip = require("node-stream-zip");
const rimraf = require("../../public/libraries/rimraf");

async function createProject(req, res) {
    var public_path = process.cwd() + "/".replace("routes", "").replace("projects", "");

    // get form inputs
    var project_name = req.body.project_name,
        upload_images = req.files["upload_images"],
        upload_video = req.files["upload_video"],
        upload_bootstrap = req.files["upload_bootstrap"],
        frame_rate = req.body.frame_rate,
        input_classes = req.body.input_classes,
        auto_save = 1,
        username = req.cookies.Username,
        project_description = "none";

    if (input_classes.includes(",")) {
        input_classes = req.body.input_classes.split(",");
    }

    // cleans the class input
    if (typeof input_classes == "string") {
        input_classes = input_classes.trim();
        input_classes = input_classes.split(" ").join("_");
    } else {
        for (i = 0; i < input_classes.length; i++) {
            input_classes[i] = input_classes[i].trim();
            input_classes[i] = input_classes[i].split(" ").join("_");
        }

        //removes blanks
        var insert_classes = [];
        for (i = 0; i < input_classes.length; i++) {
            if (input_classes[i] != "") {
                insert_classes.push(input_classes[i]);
            }
        }
    }

    //Project Table
    var main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + username + "-" + project_name, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        bootstrap_path = project_path + "/bootstrap",
        downloads_path = main_path + username + "_Downloads",
        training_path = project_path + "/training",
        logs_path = training_path + "/logs",
        weights_path = training_path + "/weights",
        python_path = training_path + "/python",
        python_path_file = training_path + "/Paths.txt";
    darknet_path_file = training_path + "/darknetPaths.txt";

    if (!fs.existsSync(main_path)) {
        fs.mkdirSync(main_path);
    }
    // create folders:
    if (!fs.existsSync(project_path)) {
        console.log("addProject (create folders)");
        fs.mkdirSync(project_path);
        fs.mkdirSync(images_path);
        fs.mkdirSync(bootstrap_path);
        fs.mkdirSync(training_path);
        fs.mkdirSync(weights_path);
        fs.mkdirSync(logs_path);
        fs.mkdirSync(python_path);

        fs.writeFile(python_path_file, "", function (err) {
            if (err) {
                console.log(err);
            }
        });
        fs.writeFile(darknet_path_file, "", function (err) {
            if (err) {
                console.log(err);
            }
        });
    }

    //Create new project database
    var cdb = new sqlite3.Database(
        project_path + "/" + project_name + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to cdb.");
        },
    );

    cdb.getAsync = function (sql) {
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

    cdb.allAsync = function (sql) {
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

    cdb.runAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.run(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
        });
    };
    await cdb.runAsync(
        "CREATE TABLE Classes (CName VARCHAR NOT NULL PRIMARY KEY)",
    );
    await cdb.runAsync(
        "CREATE TABLE Images (IName VARCHAR NOT NULL PRIMARY KEY, reviewImage INTEGER NOT NULL DEFAULT 0, validateImage INTEGER NOT NULL DEFAULT 0)",
    );
    await cdb.runAsync(
        "CREATE TABLE Labels (LID INTEGER PRIMARY KEY, CName VARCHAR NOT NULL, X INTEGER NOT NULL, Y INTEGER NOT NULL, W INTEGER NOT NULL, H INTEGER NOT NULL, IName VARCHAR NOT NULL, FOREIGN KEY(CName) REFERENCES Classes(CName), FOREIGN KEY(IName) REFERENCES Images(IName))",
    );
    await cdb.runAsync(
        "CREATE TABLE Validation (Confidence INTEGER NOT NULL, LID INTEGER NOT NULL PRIMARY KEY, CName VARCHAR NOT NULL, IName VARCHAR NOT NULL, FOREIGN KEY(LID) REFERENCES Labels(LID), FOREIGN KEY(IName) REFERENCES Images(IName), FOREIGN KEY(CName) REFERENCES Classes(CName))",
    ); //tp1

    console.log("save", auto_save);
    console.log("project des", project_description);

    var results1 = await db.allAsync(
        "INSERT INTO Projects (PName, PDescription, AutoSave, Admin) VALUES ('" +
            project_name +
            "', '" +
            project_description +
            "', '" +
            auto_save +
            "', '" +
            username +
            "')",
    );

    //Access Table
    await db.runAsync(
        "INSERT INTO Access (Username, PName, Admin) VALUES ('" +
            username +
            "', '" +
            project_name +
            "', '" +
            username +
            "')",
    );

    //Classes Table
    var classesExist = await cdb.allAsync("SELECT CName FROM Classes");
    var cur_classes = [];
    for (var i = 0; i < classesExist.length; i++) {
        cur_classes.push(classesExist[i].CName);
    }
    console.log("addProject (INSERT INTO Classes)");
    if (typeof input_classes == "string") {
        if (!cur_classes.includes(input_classes)) {
            console.log(
                "addProject (INSERT INTO Classes -> class = " +
                    input_classes +
                    ")",
            );
            await cdb.runAsync(
                "INSERT INTO CLASSES (CName) VALUES ('" + input_classes + "')",
            );
        }
    } else {
        for (var i = 0; i < insert_classes.length; i++) {
            if (!cur_classes.includes(insert_classes[i])) {
                // console.log("addProject (INSERT INTO Classes -> class = "+insert_classes[i] + ")");
                cur_classes.push(insert_classes[i]);
                await cdb.runAsync(
                    "INSERT INTO CLASSES (CName) VALUES ('" +
                        insert_classes[i] +
                        "')",
                );
            }
        }
    }

    //If images instead of video is being uploaded
    if (upload_images) {
        var zip_path = images_path + "/" + upload_images.name; // $LABELING_TOOL_PATH/public/projects/{project_name}/{zip_file_name}

        await upload_images.mv(zip_path);
        console.log("File Uploaded", upload_images.name);

        //extract images zip file
        console.log(`zip_path: ${zip_path}`);
        var zip = new StreamZip({ file: zip_path });

        zip.on("error", (err) => {
            console.log(err);
            cdb.close(function (err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("cdb closed successfully");
                }
            });

            return res.send("ERROR! ", err);
        });

        zip.on("ready", async () => {
            console.log(zip_path);
            zip.extract(null, images_path, async (err, count) => {
                console.log(
                    err
                        ? `Extract error: ${err}`
                        : `Extracted ${count} entries`,
                );
                zip.close();
                rimraf(zip_path, (err) => {
                    if (err) {
                        console.log(err);
                        // res.send({"Success": "could not remove zip file"});
                        cdb.close(function (err) {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log("cdb closed successfully");
                            }
                        });
                        res.send(err);
                    }
                });

                files = await readdirAsync(images_path);
                console.log("file path: ", images_path);
                console.log("files: ", files);
                // console.log("addProject (INSERT INTO Images)");
                for (var i = 0; i < files.length; i++) {
                    if (files[i] == "__MACOSX") {
                        // check if __MACOSX is the last file, if so close cdb
                        if (i + 1 == files.length) {
                            console.log("cbd should be closing here");
                            cdb.close(function (err) {
                                if (err) {
                                    console.error(err);
                                } else {
                                    console.log("cdb closed successfully");
                                }
                            });
                            // res.send({"Success": "Yes"});
                            res.send("Project creation successful");
                        }
                        continue;
                    }
                    //Cleans filenames, Removes trailing and leading spaces and swaps 0s and +s with _.
                    if (!files[i].endsWith(".zip") && files[i] != "blob") {
                        var temp = images_path + "/" + files[i];
                        // console.log("files[i]: ", files[i]);
                        files[i] = files[i].trim();
                        files[i] = files[i].split(" ").join("_");
                        files[i] = files[i].split("+").join("_");
                        fs.rename(temp, images_path + "/" + files[i], () => {});

                        // console.log("addProject (INSERT INTO Images -> image = "+files[i] + ")");
                        await cdb.runAsync(
                            "INSERT INTO Images (IName, reviewImage, validateImage) VALUES ('" +
                                files[i] +
                                "', '" +
                                0 +
                                "', '" +
                                0 +
                                "')",
                        );
                    }
                    if (files[i].endsWith(".zip")) {
                        fs.unlink(images_path + "/" + files[i], () => {});
                    }
                    // check if last file, if so close cdb
                    if (i + 1 == files.length) {
                        console.log("cbd should be closing here");
                        cdb.close(function (err) {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log("cdb closed successfully");
                            }
                        });
                        // res.send({"Success": "Yes"});
                        if (upload_bootstrap == undefined) {
                            res.send("Project creation successful");
                        }
                    }
                }
            });
        });
    } else if (upload_video) {
        var video_path = images_path + "/" + upload_video.name; // $LABELING_TOOL_PATH/public/projects/{project_name}/{zip_file_name}
        frame_rate *= 30;

        await upload_video.mv(video_path);
        console.log("File Uploaded", upload_video.name);

        //extract photos from video
        console.log(`video_path: ${video_path}`);
        try {
            var process = new ffmpeg(video_path);
            process.then(
                function (video) {
                    video.fnExtractFrameToJPG(
                        images_path,
                        {
                            every_n_frames: frame_rate,
                        },
                        function (err, files) {
                            if (!err) {
                                console.log("Photos generated:");
                                console.log(files);
                                cleanFiles();
                            } else {
                                console.log("Error: " + err);
                            }
                        },
                    );
                },
                function (err) {
                    console.log("Error: " + err);
                },
            );
        } catch (e) {
            console.log("ERROR " + e);
        }
        async function cleanFiles() {
            files = await readdirAsync(images_path);
            console.log("file path: ", images_path);
            console.log("files: ", files);
            // console.log("addProject (INSERT INTO Images)");
            for (var i = 0; i < files.length; i++) {
                if (files[i] == "__MACOSX") {
                    // check if __MACOSX is the last file, if so close cdb
                    if (i + 1 == files.length) {
                        console.log("cbd should be closing here");
                        cdb.close(function (err) {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log("cdb closed successfully");
                            }
                        });
                        // res.send({"Success": "Yes"});
                        res.send("Project creation successful");
                    }
                    continue;
                }
                //Cleans filenames, Removes trailing and leading spaces and swaps 0s and +s with _.
                if (
                    !files[i].endsWith(".mp4") &&
                    !files[i].endsWith(".avi") &&
                    !files[i].endsWith(".mov") &&
                    !files[i] != "blob"
                ) {
                    var temp = images_path + "/" + files[i];
                    // console.log("files[i]: ", files[i]);
                    files[i] = files[i].trim();
                    files[i] = files[i].split(" ").join("_");
                    files[i] = files[i].split("+").join("_");
                    fs.rename(temp, images_path + "/" + files[i], () => {});

                    // console.log("addProject (INSERT INTO Images -> image = "+files[i] + ")");
                    await cdb.runAsync(
                        "INSERT INTO Images (IName, reviewImage, validateImage) VALUES ('" +
                            files[i] +
                            "', '" +
                            0 +
                            "', '" +
                            0 +
                            "')",
                    );
                }
                if (
                    files[i].endsWith(".mp4") ||
                    files[i].endsWith(".avi") ||
                    files[i].endsWith(".mov")
                ) {
                    fs.unlink(images_path + "/" + files[i], () => {});
                }
                // check if last file, if so close cdb
                if (i + 1 == files.length) {
                    console.log("cbd should be closing here");
                    cdb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("cdb closed successfully");
                        }
                    });
                    // res.send({"Success": "Yes"});
                    if (upload_bootstrap == undefined) {
                        res.send("Project creation successful");
                    }
                }
            }
        }
    } else {
        return res.send("ERROR! NO PHOTO ZIP OR VIDEO FILE PROVIDED");
    }
    //Run models on existing data
    if (upload_bootstrap !== undefined) {
        var bzip_path = bootstrap_path + "/" + upload_bootstrap.name;
        var out_bootstrap_json = "";

        await upload_bootstrap.mv(bzip_path);
        console.log("File Uploaded (Bootstrap)", upload_bootstrap.name);

        //extract images zip file
        console.log(`bzip_path (Bootstrap): ${bzip_path}`);
        var bzip = new StreamZip({ file: bzip_path });
        bzip.on("error", (err) => {
            console.log(err);
            return res.send("ERROR! ", err);
        });

        bzip.on("ready", async () => {
            var weight_bootstrap_path =
                (cfg_bootstrap_path =
                data_bootstrap_path =
                    "");

            // console.log(bzip_path)
            bzip.extract(null, bootstrap_path, async (err, count) => {
                console.log(
                    err
                        ? `Extract error: ${err}`
                        : `Extracted ${count} entries`,
                );
                bzip.close();
                rimraf(bzip_path, (err) => {
                    if (err) {
                        console.log(err);
                        // res.send({"Success": "could not remove bzip file"});
                    }
                });
                bfiles = await readdirAsync(bootstrap_path);
                // console.log("file path (Bootstrap): ", bootstrap_path);
                // console.log("files (Bootstrap): ", bfiles);
                // console.log("addProject (INSERT INTO Images)");
                for (var i = 0; i < bfiles.length; i++) {
                    //Cleans filenames, Removes trailing and leading spaces and swaps 0s and +s with _.
                    if (!bfiles[i].endsWith(".zip")) {
                        var temp = bootstrap_path + "/" + bfiles[i];
                        // console.log("files[i]: ", files[i]);
                        bfiles[i] = bfiles[i].trim();
                        bfiles[i] = bfiles[i].split(" ").join("_");
                        bfiles[i] = bfiles[i].split("+").join("_");
                        fs.rename(
                            temp,
                            bootstrap_path + "/" + bfiles[i],
                            () => {},
                        );
                        if (bfiles[i].endsWith(".weights"))
                            weight_bootstrap_path =
                                bootstrap_path + "/" + bfiles[i];
                        if (bfiles[i].endsWith(".cfg"))
                            cfg_bootstrap_path =
                                bootstrap_path + "/" + bfiles[i];
                        if (bfiles[i].endsWith(".data"))
                            data_bootstrap_path =
                                bootstrap_path + "/" + bfiles[i];
                    }
                    if (
                        !bfiles[i].endsWith(".weights") &&
                        !bfiles[i].endsWith(".cfg") &&
                        !bfiles[i].endsWith(".data")
                    ) {
                        fs.unlink(bootstrap_path + "/" + bfiles[i], () => {});
                    }
                    // check if last file, if so run darknet
                    if (i + 1 == bfiles.length) {
                        // res.send({"Success": "Yes"});
                        console.log("Boostrap unzipped sucesfully");

                        console.log("Create run txt file");
                        images_to_write = await readdirAsync(images_path);
                        var run_data = images_to_write
                            .map((i) => images_path + "/" + i)
                            .join("\n");
                        var run_txt_path = bootstrap_path + "/" + "run.txt";

                        fs.writeFileSync(run_txt_path, run_data, (err) => {
                            if (err) throw err;
                            console.log("done writing bootstrap run txt file");
                        });

                        var yolo_script =
                            public_path + "controllers/training/bootstrap.py";
                        out_bootstrap_json = bootstrap_path + "/out.json";
                        console.log("Calling Darknet for Bootstrap");
                        // Pass in python path, script, and options
                        var darknet_path = "/export/darknet"; //TEMP SWITCH TO USER INPUT ASAP
                        var cmd = `python3 ${yolo_script} -d ${data_bootstrap_path} -c ${cfg_bootstrap_path} -t ${run_txt_path} -y ${darknet_path} -w ${weight_bootstrap_path} -o ${out_bootstrap_json}`;
                        console.log(cmd);
                        process.chdir(darknet_path);

                        var child = exec(cmd, (err, stdout, stderr) => {
                            if (err) {
                                console.log(
                                    `This is the error: ${err.message}`,
                                );
                            } else if (stderr) {
                                console.log(`This is the stderr: ${stderr}`);
                            }
                            console.log("stdout: ", stdout);
                            console.log("stderr: ", stderr);
                            console.log("err: ", err);
                            console.log("The script has finished running");
                        });

                        child.on("error", (err) => {
                            console.error(`Error occurred: ${err.message}`);
                        });

                        child.on("exit", (code) => {
                            console.log(
                                `Child process exited with code ${code}`,
                            );
                            apply_bootstrap_labels();
                        });
                    }
                }
            });
            async function apply_bootstrap_labels() {
                console.log("Applying bootstrap labels.");

                var raw_label_bootstrap_data =
                    fs.readFileSync(out_bootstrap_json);
                var label_bootstrap_data = JSON.parse(raw_label_bootstrap_data);

                // console.log(label_bootstrap_data);

                // Connect to database
                var bdddb = new sqlite3.Database(
                    project_path + "/" + project_name + ".db",
                    (err) => {
                        if (err) {
                            return console.error(err.message);
                        }
                        console.log("Connected to bdddb.");
                    },
                );
                bdddb.getAsync = function (sql) {
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
                bdddb.allAsync = function (sql) {
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
                bdddb.runAsync = function (sql) {
                    var that = this;
                    return new Promise(function (resolve, reject) {
                        that.run(sql, function (err, row) {
                            if (err) {
                                console.log("runAsync ERROR! ", err);
                                reject(err);
                            } else resolve(row);
                        });
                    });
                };
                console.log("Inserting Labels into db");
                var image_results = await bdddb.allAsync(
                    "SELECT * FROM Images",
                );
                var class_list = await bdddb.allAsync("SELECT * FROM Classes");
                // console.log(class_list);
                var class_set = new Set();
                for (var k = 0; k < class_list.length; k++) {
                    // console.log(class_list[i]);
                    class_set.add(class_list[k].CName);
                }
                // image_results is empty fix it!
                var labelID = 0;
                for (var i = 0; i < image_results.length; i++) {
                    var img = fs.readFileSync(
                            `${images_path}/${image_results[i].IName}`,
                        ),
                        img_data = probe.sync(img),
                        img_w = img_data.width,
                        img_h = img_data.height;

                    // console.log(label_bootstrap_data[i].objects);
                    for (
                        var f = 0;
                        f < label_bootstrap_data[i].objects.length;
                        f++
                    ) {
                        var bootstrap_obj = label_bootstrap_data[i].objects[f];
                        var relative_coords =
                            bootstrap_obj.relative_coordinates;

                        var label_width = img_w * relative_coords.width;
                        var label_height = img_h * relative_coords.height;
                        var left_x =
                            relative_coords.center_x * img_w - label_width / 2;
                        var bottom_y =
                            relative_coords.center_y * img_h - label_height / 2;
                        var className = bootstrap_obj.name;
                        var confidence = Math.round(
                            Number(bootstrap_obj.confidence) * 100,
                        );
                        labelID += 1;

                        if (!class_set.has(className)) {
                            await bdddb.runAsync(
                                "INSERT INTO Classes (CName) VALUES ('" +
                                    className +
                                    "')",
                            );
                        }

                        // console.log("INSERT INTO Labels (LID, CName, X, Y, W, H, IName) VALUES ('"+Number(labelID)+"', '" + className + "', '" + Number(left_x) + "', '" + Number(bottom_y) + "', '" + Number(label_width) + "', '" + Number(label_height) + "', '" + image_results[i].IName + "')");
                        await bdddb.runAsync(
                            "INSERT INTO Labels (LID, CName, X, Y, W, H, IName) VALUES ('" +
                                Number(labelID) +
                                "', '" +
                                className +
                                "', '" +
                                Number(left_x) +
                                "', '" +
                                Number(bottom_y) +
                                "', '" +
                                Number(label_width) +
                                "', '" +
                                Number(label_height) +
                                "', '" +
                                image_results[i].IName +
                                "')",
                        );

                        await bdddb.runAsync(
                            "INSERT INTO Validation (Confidence, LID, CName, IName) VALUES ('" +
                                confidence +
                                "', '" +
                                Number(labelID) +
                                "', '" +
                                className +
                                "', '" +
                                image_results[i].IName +
                                "')",
                        ); //tp2

                        class_set.add(className);
                    }
                }
                bdddb.close(function (err) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log("bdddb closed successfully");
                        res.send(
                            "Project creation successful. Labels Applied Succesfully",
                        );
                    }
                });
            }
        });
    }
}

module.exports = createProject;
