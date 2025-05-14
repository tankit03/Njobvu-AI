const StreamZip = require("node-stream-zip");
const rimraf = require("../../public/libraries/rimraf");
const { exec } = require("child_process");

async function importProject(req, res) {
    req.setTimeout(600000);
    console.log("import");

    var upload_images = req.files["upload_file"],
        project_name = req.body.project_name,
        username = req.cookies.Username,
        auto_save = 1,
        project_description = "none";

    // console.log(upload_images)
    // Check if project name already exists
    var names = [];
    var Numprojects = await db.getAsync(
        "SELECT COUNT(*) AS THING FROM Access WHERE Username = '" +
            username +
            "'",
    );
    var projects = await db.allAsync(
        "SELECT * FROM Access WHERE Username = '" + username + "'",
    );
    for (var i = 0; i < Numprojects.THING; i++) {
        names.push(projects[i].PName);
    }
    if (names.includes(project_name)) {
        res.send({ Success: "That project name already exists" });
    }

    // Add project
    else {
        var public_path = __dirname.replace("routes", "").replace("projects"),
            main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
            project_path = main_path + username + "-" + project_name, // $LABELING_TOOL_PATH/public/projects/project_name
            images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
            bootstrap_path = project_path + "/bootstrap", // $LABELING_TOOL_PATH/public/projects/project_name/bootstrap
            downloads_path = main_path + username + "_Downloads",
            training_path = project_path + "/training",
            logs_path = training_path + "/logs",
            python_path = training_path + "/python",
            weights_path = training_path + "/weights",
            python_path_file = training_path + "/Paths.txt",
            darknet_paths_file = training_path + "/darknetPaths.txt";

        if (!fs.existsSync(main_path)) {
            fs.mkdirSync(main_path);
        }
        // create folders:
        if (!fs.existsSync(project_path)) {
            console.log("addProejct (create folders)");
            fs.mkdirSync(project_path);
        }

        // console.log(project_path, project_name, images_path);

        var zip_path = project_path + "/" + upload_images.name; // $LABELING_TOOL_PATH/public/projects/{project_name}/{zip_file_name}
        await upload_images.mv(zip_path);

        var dump = "";
        var found = 0;

        //extract zip file

        console.log(`zip_path: ${zip_path}`);
        var zip = new StreamZip({ file: zip_path });
        // console.log(`Unzipper: ${zip}`);

        zip.on("error", (err) => {
            console.log(err);
        });

        zip.on("ready", () => {
            console.log("zip is ready");
            console.log("project_path: " + project_path);
            zip.extract(null, project_path, async (err, count) => {
                console.log(
                    err
                        ? `Extract error: ${err}`
                        : `Extracted ${count} entries`,
                );
                zip.close();

                // console.log(zip_path)
                console.log("images_path: ", images_path);
                files = await readdirAsync(project_path);
                console.log("Found ", files.length, " files");

                console.log("Look for dump file");
                for (var i = 0; i < files.length; i++) {
                    console.log(files[i]);
                    if (files[i].substr(-3) == ".db") {
                        found = 1;
                        // console.log(files[i]);
                        var idb = files[i];
                        if (idb.substr(0, idb.length - 3) != project_name) {
                            fs.rename(
                                `${project_path}/${idb}`,
                                `${project_path}/${project_name}.db`,
                                (error) => {
                                    if (error) {
                                        console.log(error);
                                    }
                                },
                            );
                        }

                        //Add project to global database
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
                        console.log("INSERT INTO Access");
                        await db.runAsync(
                            "INSERT INTO Access (Username, PName, Admin) VALUES ('" +
                                username +
                                "', '" +
                                project_name +
                                "', '" +
                                username +
                                "')",
                        );

                        //remove uploaded zipfile to save space
                        fs.unlink(zip_path, (error) => {
                            if (error) {
                                console.log(error);
                            }
                        });

                        var dbpath = `${project_path}/${project_name}.db`;
                        while (!fs.existsSync(dbpath)) {
                            console.log("");
                        }
                        // console.log("dbpath: ", dbpath)
                        var imdb = new sqlite3.Database(dbpath, (err) => {
                            if (err) {
                                return console.error(err.message);
                            }
                            console.log("Connected to imdb.");
                        });
                        imdb.getAsync = function (sql) {
                            var that = this;
                            return new Promise(function (resolve, reject) {
                                that.get(sql, function (err, row) {
                                    if (err) {
                                        console.log("runAsync ERROR! ", err);
                                        imdb.close(function (err) {
                                            if (err) {
                                                console.error(err);
                                            } else {
                                                console.log("imdb closed");
                                            }
                                        });
                                        reject(err);
                                    } else resolve(row);
                                });
                            }).catch((err) => {
                                console.error(err);
                                res.send({ Success: "No" });
                            });
                        };
                        imdb.allAsync = function (sql) {
                            var that = this;
                            return new Promise(function (resolve, reject) {
                                that.all(sql, function (err, row) {
                                    if (err) {
                                        console.log("runAsync ERROR! ", err);
                                        imdb.close(function (err) {
                                            if (err) {
                                                console.error(err);
                                            } else {
                                                console.log("imdb closed");
                                            }
                                        });
                                        reject(err);
                                    } else resolve(row);
                                });
                            }).catch((err) => {
                                console.error(err);
                                res.send({ Success: "No" });
                            });
                        };
                        imdb.runAsync = function (sql) {
                            var that = this;
                            return new Promise(function (resolve, reject) {
                                that.run(sql, function (err, row) {
                                    if (err) {
                                        console.log("runAsync ERROR! ", err);
                                        imdb.close(function (err) {
                                            if (err) {
                                                console.error(err);
                                            } else {
                                                console.log("imdb closed");
                                            }
                                        });
                                        reject(err);
                                    } else resolve(row);
                                });
                            }).catch((err) => {
                                console.error(err);
                                res.send({ Success: "No" });
                            });
                        };
                        //Clean image and class names
                        var images = await readdirAsync(images_path);
                        var imcount = await imdb.allAsync(
                            "SELECT * FROM Images",
                        );
                        var olddbimages = [];
                        var dbimages = [];
                        var fileTypes = [
                            "jpeg",
                            "JPEG",
                            "jpg",
                            "JPG",
                            "png",
                            "PNG",
                            "tiff",
                            "TIFF",
                        ];
                        for (var j = 0; j < imcount.length; j++) {
                            olddbimages.push(imcount[j].IName);
                        }
                        console.log(
                            "There are " +
                                imcount.length +
                                " images in the database",
                        );
                        for (var j = 0; j < images.length; j++) {
                            var oldimg = images[j];
                            var image = images[j];
                            image = image.trim();
                            image = image.split(" ").join("_");
                            image = image.split("+").join("_");
                            var ext = image.split(".").pop();
                            if (image != oldimg) {
                                fs.rename(
                                    images_path + "/" + images[j],
                                    images_path + "/" + image,
                                    () => {},
                                );
                            }
                            if (
                                olddbimages.includes(oldimg) &&
                                image != oldimg
                            ) {
                                await imdb.runAsync(
                                    "UPDATE Images SET IName = '" +
                                        image +
                                        "' WHERE IName = '" +
                                        images[j] +
                                        "'",
                                );
                                await imdb.runAsync(
                                    "UPDATE Labels SET IName = '" +
                                        image +
                                        "' WHERE IName = '" +
                                        images[j] +
                                        "'",
                                );
                                await imdb.runAsync(
                                    "UPDATE Validation SET IName = '" +
                                        image +
                                        "' WHERE IName = '" +
                                        images[j] +
                                        "'",
                                );
                            } else if (
                                !olddbimages.includes(oldimg) &&
                                fileTypes.includes(ext)
                            ) {
                                await imdb.runAsync(
                                    "INSERT INTO Images (IName, reviewImage, validateImage) VALUES ('" +
                                        image +
                                        "', '" +
                                        1 +
                                        "', '" +
                                        0 +
                                        "')",
                                );
                            }
                        }

                        var classes = await imdb.allAsync(
                            "SELECT CName FROM Classes",
                        );
                        for (var j = 0; j < classes.length; j++) {
                            var CName = classes[j].CName;
                            CName = CName.trim();
                            CName = CName.split(" ").join("_");
                            await imdb.runAsync(
                                "UPDATE Classes SET CName = '" +
                                    CName +
                                    "' WHERE CName = '" +
                                    classes[j].CName +
                                    "'",
                            );
                            await imdb.runAsync(
                                "UPDATE Labels SET CName = '" +
                                    CName +
                                    "' WHERE CName = '" +
                                    classes[j].CName +
                                    "'",
                            );
                            await imdb.runAsync(
                                "UPDATE Validation SET CName = '" +
                                    CName +
                                    "' WHERE CName = '" +
                                    classes[j].CName +
                                    "'",
                            );
                        }
                        var labels = await imdb.allAsync(
                            "SELECT * FROM Labels",
                        );
                        var confidence = await imdb.allAsync(
                            "SELECT * FROM Validation",
                        );
                        var conf = {};
                        for (var x = 0; x < confidence.length; x++) {
                            console.log(confidence[x]);
                            conf[confidence[x].LID] = confidence[x];
                        }
                        // console.log(confidence);
                        // console.log(conf);
                        var cur_labels = [];
                        var cur_conf = [];
                        for (var j = 0; j < labels.length; j++) {
                            if (labels[j].W > 0 && labels[j].H > 0) {
                                cur_labels.push([
                                    labels[j].CName,
                                    labels[j].X,
                                    labels[j].Y,
                                    labels[j].W,
                                    labels[j].H,
                                    labels[j].IName,
                                ]);
                                // console.log(conf)
                                if (labels[j].LID in conf) {
                                    cur_conf.push([conf[labels[j].LID]]);
                                } else {
                                    cur_conf.push([]);
                                }
                            }
                        }
                        // console.log("CIR CONGAfADF");
                        // console.log(labels);
                        await imdb.runAsync("DELETE FROM Labels");
                        await imdb.runAsync("DELETE FROM Validation");
                        for (var j = 0; j < cur_labels.length; j++) {
                            await imdb.runAsync(
                                "INSERT INTO Labels (LID, CName, X, Y, W, H, IName) VALUES ('" +
                                    Number(j + 1) +
                                    "', '" +
                                    cur_labels[j][0] +
                                    "', '" +
                                    Number(cur_labels[j][1]) +
                                    "', '" +
                                    Number(cur_labels[j][2]) +
                                    "', '" +
                                    Number(cur_labels[j][3]) +
                                    "', '" +
                                    Number(cur_labels[j][4]) +
                                    "', '" +
                                    cur_labels[j][5] +
                                    "')",
                            );

                            if (cur_conf[j].length != 0) {
                                await imdb.runAsync(
                                    "INSERT INTO Validation (Confidence, LID, CName, IName) VALUES ('" +
                                        Number(cur_conf[j][0].Confidence) +
                                        "', '" +
                                        Number(j + 1) +
                                        "', '" +
                                        cur_conf[j][0].CName +
                                        "', '" +
                                        cur_conf[j][0].IName +
                                        "')",
                                ); //tp4
                            }
                        }
                        if (!fs.existsSync(bootstrap_path)) {
                            console.log("import Project (create folders)");
                            fs.mkdirSync(bootstrap_path);
                        }
                        // Check for training related files
                        if (!fs.existsSync(training_path)) {
                            console.log("addProject (create folders)");

                            fs.mkdirSync(training_path);
                            fs.mkdirSync(logs_path);
                            fs.mkdirSync(python_path);
                            fs.mkdirSync(weights_path);

                            fs.writeFile(python_path_file, "", function (err) {
                                if (err) {
                                    console.log(err);
                                }
                            });
                            fs.writeFile(
                                darknet_paths_file,
                                "",
                                function (err) {
                                    if (err) {
                                        console.log(err);
                                    }
                                },
                            );
                        } else {
                            if (!fs.existsSync(logs_path)) {
                                fs.mkdirSync(logs_path);
                            }

                            if (!fs.existsSync(python_path)) {
                                fs.mkdirSync(python_path);
                            }

                            if (!fs.existsSync(weights_path)) {
                                fs.mkdirSync(weights_path);
                            }

                            if (!fs.existsSync(python_path_file)) {
                                fs.writeFile(
                                    python_path_file,
                                    "",
                                    function (err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    },
                                );
                            }

                            if (!fs.existsSync(darknet_paths_file)) {
                                fs.writeFile(
                                    darknet_paths_file,
                                    "",
                                    function (err) {
                                        if (err) {
                                            console.log(err);
                                        }
                                    },
                                );
                            }
                        }

                        imdb.close(function (err) {
                            if (err) {
                                console.error(err);
                            } else {
                                console.log("dpdb closed successfully");
                            }
                        });
                        // res.send({"Success": "Yes"});
                        res.send("Import Finished");
                        break;
                    }
                }
                if (found == 0) {
                    //delete imported project
                    rimraf(project_path, function (err) {
                        if (err) {
                            console.error(err);
                        }
                        console.log("done");
                    });
                    res.send({ Success: "No .db file found" });
                }
            });
        });
    }
}

module.exports = importProject;
