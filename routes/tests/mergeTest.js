const StreamZip = require("node-stream-zip");
const rimraf = require("../../public/libraries/rimraf");
const path = require("path");

async function mergeTest(req, res) {
    console.log("\nmergeTest");

    //get form variables
    var upload_images = req.files.upload_project,
        project_name = req.body.PName,
        Admin = req.body.Admin,
        username = req.cookies.Username;

    console.log("project_name: ", project_name);
    console.log("Admin: ", Admin);
    console.log("upload: ", upload_images);

    //set paths
    var public_path = currentPath,
        main_path = public_path + "public/projects",
        project_path = main_path + "/" + Admin + "-" + project_name,
        image_path = project_path + "/images",
        bootstrap_path = project_path + "/bootstrap",
        training_path = project_path + "/training",
        log_path = training_path + "/logs/",
        scripts_path = training_path + "/python/",
        python_path_file = training_path + "/Paths.txt",
        darknet_path_file = training_path + "/darknetPaths.txt",
        merge_path = project_path + "/merge",
        merge_images = merge_path + "/images/",
        zip_path = project_path + "/" + upload_images.name,
        newDB = merge_path + "/merge.db",
        dump = merge_path + "/merge.dump";

    //create merge file structure ///////////////////////////////////////////////////////////////////////////////////
    if (fs.existsSync(merge_path)) {
        console.log("merge_path already exists");
        rimraf(merge_path, (err) => {
            if (err) {
                console.log(err);
            } else {
                fs.mkdir(merge_path, (error) => {
                    if (error) {
                        console.log(error);
                    }
                });
            }
        });
    } else {
        fs.mkdir(merge_path, (err) => {
            if (err) {
                console.error(err);
                // res.send({"Success": "merge_path directory failed to make"});
                return res.send("ERROR! merge_path directory failed to make");
            }
        });
    }

    // connect to current project database /////////////////////////////////////////////////////////////////////////////
    var mdb = new sqlite3.Database(
        project_path + "/" + project_name + ".db",
        function (err) {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to mdb.");
        },
    );
    mdb.getAsync = function (sql) {
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
    mdb.allAsync = function (sql) {
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
    mdb.runAsync = function (sql) {
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

    var newImages = [];
    var incomingDB;
    var found = 0;

    //move zip file to zip_path
    await upload_images.mv(zip_path);
    console.log(`zip_path: ${zip_path}`);
    var zip = new StreamZip({ file: zip_path });

    zip.on("error", (err) => {
        console.log("There was an error!");
        console.log(err);
        mdb.close((err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("mdb closed successfully");
            }
        });

        fs.unlink(zip_path, (error) => {
            if (error) {
                console.log(error);
            }
        });

        rimraf(merge_path, (err) => {
            if (err) {
                console.error("there was an error with contents: ", err);
            } else {
                console.log("merge_path contents successfuly deleted");
            }
        });

        // res.send({"Success": "No .db file found"});
        return res.send("ERROR! " + err);
    });

    //extract contents of zip file into merge_images
    zip.on("ready", () => {
        console.log("zip is ready");
        zip.extract(null, merge_path, async (err, count) => {
            console.log(
                err ? `Extract error: ${err}` : `Extracted ${count} entries`,
            );
            zip.close();
            //read current list of images
            var currImages = await readdirAsync(image_path);
            console.log("current Images: ", currImages);
            //read in new files
            var newfiles = await readdirAsync(merge_path);
            //look for .db file
            //keep track of new files (don't keep images you already have)
            console.log("found " + newfiles.length + " files");
            for (var i = 0; i < newfiles.length; i++) {
                // console.log(newfiles[i]);
                if (newfiles[i].split(".").pop() == "db") {
                    console.log("found .db file");
                    found = 1;
                    incomingDB = newfiles[i];
                }
            }

            //If no .db file found, delete merge structure and new data
            if (found == 0) {
                console.log("no db found");
                console.log("delete contents of merge_path");
                try {
                    await rimraf(merge_path, (err) => {
                        if (err) {
                            console.error(
                                "there was an error with contents: ",
                                err,
                            );
                        } else {
                            console.log(
                                "merge_path contents successfuly deleted",
                            );
                        }
                    });
                } catch (e) {
                    console.log("there was an error with contents");
                    console.log(e);
                    console.log("leaving catch block");
                }
                console.log("deleted merge_path");
                mdb.close((err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("mdb closed successfully");
                    }
                });
                // res.send({"Success": "No .db file found"});
                return res.send("ERROR! No Database file (.db) found!");
            } //Merge Projects ///////////////////////////////////////////////////////////////////////////////////////////////
            else {
                // Transfer incoming runs to current runs
                var merge_runs_path = `${merge_path}/training/logs/`;
                if (fs.existsSync(merge_run_path)) {
                    console.log("merge_runs: ", merge_runs_path);
                    var merge_runs = await readdirAsync(merge_runs_path);
                    console.log("incoming runs: ", merge_runs);
                    for (var i = 0; i < merge_runs.length; i++) {
                        var merge_run_path = `${merge_runs_path}${merge_runs[i]}`;
                        console.log("merge_run_path: ", merge_run_path);
                        if (fs.lstatSync(merge_run_path).isDirectory()) {
                            var merge_logs = await readdirAsync(merge_run_path);
                            console.log("merge_logs: ", merge_logs);
                            var new_run_path = path.join(
                                log_path,
                                merge_runs[i],
                            );
                            if (!fs.existsSync(new_run_path)) {
                                fs.mkdirSync(new_run_path);
                                console.log("new_run_path: ", new_run_path);
                                for (var j = 0; j < merge_logs.length; j++) {
                                    var merge_log_path = path.join(
                                        merge_run_path,
                                        merge_logs[j],
                                    );
                                    var new_log_path = path.join(
                                        new_run_path,
                                        merge_logs[j],
                                    );
                                    fs.renameSync(merge_log_path, new_log_path);
                                }
                            }
                        }
                    }
                }
                // Transfer incoming bootstrap files to current files
                var merge_bootstrap_path = `${merge_path}/bootstrap/`;
                if (fs.existsSync(merge_bootstrap_path)) {
                    var merge_files = await readdirAsync(merge_bootstrap_path);
                    for (var i = 0; i < merge_files.length; i++) {
                        var extension = merge_files[i].split(".").pop();
                        if (
                            ["weights", "cfg", "data", "json", "txt"].includes(
                                extension,
                            )
                        ) {
                            var merge_file_path = path.join(
                                merge_bootstrap_path,
                                merge_files[i],
                            );
                            var cur_files = await readdirAsync(bootstrap_path);
                            var merge_file_name = merge_files[i];
                            var j = 1;
                            var t = `${merge_files[i].split(".")[0]}${j}.${extension}`;
                            while (cur_files.includes(merge_file_name)) {
                                merge_file_name = `${merge_files[i].split(".")[0]}${j}.${extension}`;
                            }
                            var new_file_path = path.join(
                                bootstrap_path,
                                merge_file_name,
                            );
                            fs.rename(
                                merge_file_path,
                                new_file_path,
                                (error) => {
                                    if (error) {
                                        console.log(error);
                                    }
                                },
                            );
                        }
                    }
                }
                // Transfer incomimg python scripts to current scripts
                var merge_scripts_path = `${merge_path}/training/python/`;
                if (fs.existsSync(merge_scripts_path)) {
                    var merge_scripts = await readdirAsync(merge_scripts_path);
                    for (var i = 0; i < merge_scripts.length; i++) {
                        if (merge_scripts[i].split(".").pop() == "py") {
                            var merge_script_path = path.join(
                                merge_scripts_path,
                                merge_scripts[i],
                            );
                            var cur_scripts = await readdirAsync(scripts_path);
                            var merge_script_name = merge_scripts[i];
                            var j = 1;
                            var t = `${merge_scripts[i].split(".")[0]}${j}.py`;
                            // console.log("split name: ", t)
                            while (cur_scripts.includes(merge_script_name)) {
                                merge_script_name = `${merge_scripts[i].split(".")[0]}${j}.py`;
                            }
                            var new_script_path = path.join(
                                scripts_path,
                                merge_script_name,
                            );
                            fs.rename(
                                merge_script_path,
                                new_script_path,
                                (error) => {
                                    if (error) {
                                        console.log(error);
                                    }
                                },
                            );
                        }
                    }
                }

                // Add incoming python paths
                if (fs.existsSync(python_path_file)) {
                    var current_paths_arr = [];
                    current_paths_arr.push(
                        fs
                            .readFileSync(python_path_file, "utf-8")
                            .split("\n")
                            .filter(Boolean),
                    );
                    var current_paths = [];
                    current_paths = current_paths.concat
                        .apply(current_paths, current_paths_arr)
                        .filter(Boolean);

                    var merge_path_file = `${merge_path}/training/Paths.txt`;
                    if (fs.existsSync(merge_path_file)) {
                        var merge_paths_arr = [];
                        merge_paths_arr.push(
                            fs
                                .readFileSync(merge_path_file, "utf-8")
                                .split("\n")
                                .filter(Boolean),
                        );
                        var merge_paths = [];
                        merge_paths = merge_paths.concat
                            .apply(merge_paths, merge_paths_arr)
                            .filter(Boolean);
                        var new_paths = "";
                        for (var i = 0; i < merge_paths.length; i++) {
                            if (current_paths.includes(merge_paths[i])) {
                                continue;
                            }
                            new_paths = `${new_paths}${merge_paths[i]}\n`;
                        }
                        console.log("new python paths: ", new_paths);
                        fs.appendFile(python_path_file, new_paths, (err) => {
                            if (err) throw err;
                        });
                    }
                }

                // Add incoming darknet paths
                if (fs.existsSync(darknet_path_file)) {
                    var darknet_current_paths_arr = [];
                    darknet_current_paths_arr.push(
                        fs
                            .readFileSync(darknet_path_file, "utf-8")
                            .split("\n")
                            .filter(Boolean),
                    );
                    var darknet_current_paths = [];
                    darknet_current_paths = darknet_current_paths.concat
                        .apply(darknet_current_paths, darknet_current_paths_arr)
                        .filter(Boolean);

                    var darknet_merge_path_file = `${merge_path}/training/darknetPaths.txt`;
                    if (fs.existsSync(darknet_merge_path_file)) {
                        var darknet_merge_paths_arr = [];

                        darknet_merge_paths_arr.push(
                            fs
                                .readFileSync(darknet_merge_path_file, "utf-8")
                                .split("\n")
                                .filter(Boolean),
                        );
                        var darknet_merge_paths = [];
                        darknet_merge_paths = darknet_merge_paths.concat
                            .apply(darknet_merge_paths, darknet_merge_paths_arr)
                            .filter(Boolean);
                        var darknet_new_paths = "";
                        for (var i = 0; i < darknet_merge_paths.length; i++) {
                            if (
                                darknet_current_paths.includes(
                                    darknet_merge_paths[i],
                                )
                            ) {
                                continue;
                            }
                            darknet_new_paths = `${darknet_new_paths}${darknet_merge_paths[i]}\n`;
                        }
                        console.log("new darknet paths: ", darknet_new_paths);
                        fs.appendFile(
                            darknet_path_file,
                            darknet_new_paths,
                            (err) => {
                                if (err) throw err;
                            },
                        );
                    }
                }

                //connect to new database//////////////////////////////////////////////////////////////////
                var nmdb = new sqlite3.Database(
                    merge_path + "/" + incomingDB,
                    function (err) {
                        if (err) {
                            return console.error(err.message);
                        }
                        console.log("Connected nmdb database.");
                    },
                );
                nmdb.getAsync = function (sql) {
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
                nmdb.allAsync = function (sql) {
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
                nmdb.runAsync = function (sql) {
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

                // merge classes //////////////////////////////////////////////////////
                var results1 = await mdb.allAsync("SELECT * FROM Classes");
                var cur_classes = [];
                for (var i = 0; i < results1.length; i++) {
                    cur_classes.push(results1[i].CName);
                }

                var results2 = await nmdb.allAsync("SELECT * FROM Classes");
                for (var i = 0; i < results2.length; i++) {
                    var temp = results2[i].CName;
                    results2[i].CName = results2[i].CName.trim();
                    results2[i].CName = results2[i].CName.split(" ").join("_");
                    if (!cur_classes.includes(results2[i].CName)) {
                        await nmdb.runAsync(
                            "UPDATE Labels SET CName = '" +
                                results2[i].CName +
                                "' WHERE CName = '" +
                                temp +
                                "'",
                        );
                        cur_classes.push(results2[i].CName);
                        await mdb.runAsync(
                            "INSERT INTO Classes (CName) VALUES ('" +
                                results2[i].CName +
                                "')",
                        );
                    }
                }

                // merge images /////////////////////////////////////////////////////////
                //Check base database for missing/renamed images
                var curr_DB_Images = await readdirAsync(image_path);
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

                // console.log("current Images: ", currImages);

                //Check incoming database for missing/renamed images
                var currImages = await readdirAsync(merge_images);
                var dbimages = [];
                var currDB = await nmdb.allAsync("SELECT * FROM Images");
                var nmdbimages = [];
                for (var j = 0; j < currDB.length; j++) {
                    dbimages.push(currDB[j].IName);
                }
                for (var j = 0; j < currImages.length; j++) {
                    var oldimg = currImages[j];
                    var image = currImages[j];
                    image = image.trim();
                    image = image.split(" ").join("_");
                    image = image.split("+").join("_");
                    var ext = image.split(".").pop();
                    fs.rename(
                        merge_images + currImages[j],
                        merge_images + image,
                        () => {},
                    );
                    nmdbimages.push(image);
                    if (dbimages.includes(oldimg)) {
                        await nmdb.runAsync(
                            "UPDATE Images SET IName = '" +
                                image +
                                "' WHERE IName = '" +
                                currImages[j] +
                                "'",
                        );
                        await nmdb.runAsync(
                            "UPDATE Labels SET IName = '" +
                                image +
                                "' WHERE IName = '" +
                                currImages[j] +
                                "'",
                        );
                    } else if (fileTypes.includes(ext)) {
                        await nmdb.runAsync(
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

                var results4 = await nmdb.allAsync("SELECT * FROM Images");
                console.log("moving new images");
                for (var i = 0; i < results4.length; i++) {
                    if (!curr_DB_Images.includes(results4[i].IName)) {
                        fs.rename(
                            merge_images + results4[i].IName,
                            image_path + "/" + results4[i].IName,
                            function (err) {
                                if (err) {
                                    return console.error(err);
                                }
                            },
                        );
                        await mdb.runAsync(
                            "INSERT INTO Images (IName, reviewImage, validateImage) VALUES ('" +
                                results4[i].IName +
                                "', '" +
                                results4[i].reviewImage +
                                "', '" +
                                results4[i].validateImage +
                                "')",
                        );
                        curr_DB_Images.push(results4[i].IName);
                    }
                }
                console.log("Done moving new images");

                // merge labels ///////////////////////////////////////////////////////////////
                // count current labels
                var labelsExists = await mdb.getAsync(
                    "SELECT COUNT(*) AS count FROM Labels",
                );
                console.log("LabelsExists: ", labelsExists.count);
                if (labelsExists.count == 0) {
                    var newmax = 1;
                } else {
                    var oldmax = await mdb.getAsync(
                        "SELECT * FROM Labels WHERE LID = (SELECT MAX(LID) FROM Labels)",
                    );
                    var newmax = oldmax.LID + 1;
                }

                // get current labels
                var results5 = await mdb.allAsync("SELECT * FROM Labels");
                var cur_labels = [];
                for (var i = 0; i < results5.length; i++) {
                    cur_labels.push([
                        results5[i].CName,
                        results5[i].X,
                        results5[i].Y,
                        results5[i].W,
                        results5[i].H,
                        results5[i].IName,
                    ]);
                }

                // get incoming labels
                var results6 = await nmdb.allAsync("SELECT * FROM Labels");

                var results7 = await nmdb.allAsync("SELECT * FROM Validation");
                var new_valids = [];
                for (var i = 0; i < results7.length; i++) {
                    new_valids.push([
                        results7[i].Confidence,
                        results7[i].LID,
                        results7[i].CName,
                        results7[i].IName,
                    ]);
                }

                var new_labels = [];
                var newl = 0;
                for (var i = 0; i < results6.length; i++) {
                    new_labels.push([
                        results6[i].CName,
                        results6[i].X,
                        results6[i].Y,
                        results6[i].W,
                        results6[i].H,
                        results6[i].IName,
                    ]);

                    // check if incoming label already exists in current dataset
                    for (var j = 0; j < cur_labels.length; j++) {
                        if (
                            cur_labels[j][0] === new_labels[i][0] &&
                            cur_labels[j][1] === new_labels[i][1] &&
                            cur_labels[j][2] === new_labels[i][2] &&
                            cur_labels[j][3] === new_labels[i][3] &&
                            cur_labels[j][4] === new_labels[i][4] &&
                            cur_labels[j][5] === new_labels[i][5]
                        ) {
                            newl = 1;
                        }
                    }
                    // add incoming label to database
                    if (newl == 0) {
                        cur_labels.push([
                            results6[i].CName,
                            results6[i].X,
                            results6[i].Y,
                            results6[i].W,
                            results6[i].H,
                            results6[i].IName,
                        ]);
                        await mdb.runAsync(
                            "INSERT INTO Labels (LID, IName, X, Y, W, H, CName) VALUES ('" +
                                Number(newmax) +
                                "', '" +
                                results6[i].IName +
                                "', '" +
                                Number(results6[i].X) +
                                "', '" +
                                Number(results6[i].Y) +
                                "', '" +
                                Number(results6[i].W) +
                                "', '" +
                                Number(results6[i].H) +
                                "', '" +
                                results6[i].CName +
                                "')",
                        );
                        for (var v = 0; v < new_valids.length; v++) {
                            if (results6[i].LID == new_valids[v][1]) {
                                await mdb.runAsync(
                                    "INSERT INTO Validation (Confidence, LID, CName, IName) VALUES ('" +
                                        new_valids[v][0] +
                                        "', '" +
                                        Number(newmax) +
                                        "', '" +
                                        new_valids[v][2] +
                                        "', '" +
                                        new_valids[v][3] +
                                        "')",
                                );
                                break;
                            }
                        }
                        newmax = newmax + 1;
                    }
                    newl = 0;
                }

                // close databases //////////////////////////////////////////////////////////////////////
                mdb.close((err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("mdb closed successfully");
                    }
                });

                nmdb.close((err) => {
                    if (err) {
                        console.log(err);
                    } else {
                        console.log("nmdb closed successfully");
                        // delete merge_path
                        try {
                            rimraf(merge_path, (err) => {
                                if (err) {
                                    console.error(
                                        "there was an error with contents: ",
                                        err,
                                    );
                                } else {
                                    console.log(
                                        "merge_path contents successfuly deleted",
                                    );
                                }
                            });
                        } catch (e) {
                            console.log("there was an error with contents");
                            console.log(e);
                            console.log("leaving catch block");
                        }
                        fs.unlink(zip_path, (error) => {
                            if (error) {
                                console.log(error);
                            }
                        });
                    }
                });

                // res.send({"Success": "merge successful"});
                res.send("Merge successful");
            } // End Merge //////////////////////////////////////////////////////////////////////////////////////////////
        });
    });
}

module.exports = mergeTest;
