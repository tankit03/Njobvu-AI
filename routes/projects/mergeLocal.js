async function mergeLocal(req, res) {
    console.log("mergeLocal");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        mergeName = String(req.body.mergeName).trim(),
        mergeAdmin = String(req.body.mergeAdmin).trim(),
        username = req.cookies.Username;

    console.log("PName: ", PName);
    console.log("Admin: ", Admin);
    console.log("MergeName: ", mergeName);
    console.log("mergeAdmin: ", mergeAdmin);

    //set paths
    var public_path = currentPath,
        main_path = public_path + "public/projects",
        project_path = main_path + "/" + Admin + "-" + PName,
        mdb_path = project_path + "/" + PName + ".db",
        image_path = project_path + "/images",
        training_path = project_path + "/training",
        log_path = training_path + "/logs/",
        scripts_path = training_path + "/python/",
        weights_path = training_path + "/weights",
        python_path_file = training_path + "/Paths.txt",
        darknet_path_file = training_path + "/darknetPaths.txt";

    var merge_path = main_path + "/" + mergeAdmin + "-" + mergeName,
        mergeDB_path = merge_path + "/" + mergeName + ".db",
        merge_images = merge_path + "/images/",
        merge_training = merge_path + "/training",
        merge_log = merge_training + "/logs/",
        merge_scripts_path = merge_training + "/python",
        merge_weights_path = merge_training + "/weights",
        merge_python_file = merge_training + "/Paths.txt",
        merge_darknet_file = merge_training + "/darknetPaths.txt";

    var mdb = new sqlite3.Database(mdb_path, function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log("Connected to mdb.");
    });
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

    var mergeDB = new sqlite3.Database(mergeDB_path, function (err) {
        if (err) {
            return console.error(err.message);
        }
        console.log("Connected to mergeDB.");
    });
    mergeDB.getAsync = function (sql) {
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
    mergeDB.allAsync = function (sql) {
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
    mergeDB.runAsync = function (sql) {
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

    // Transfer incoming runs to current runs
    // var merge_runs_path = `${merge_path}/training/logs/`
    if (fs.existsSync(merge_log)) {
        console.log("merge_runs: ", merge_log);
        var merge_runs = await readdirAsync(merge_log);
        console.log("incoming runs: ", merge_runs);
        for (var i = 0; i < merge_runs.length; i++) {
            var merge_run_path = `${merge_log}${merge_runs[i]}`;
            console.log("merge_run_path: ", merge_run_path);
            if (fs.lstatSync(merge_run_path).isDirectory()) {
                var merge_logs = await readdirAsync(merge_run_path);
                console.log("merge_logs: ", merge_logs);
                var new_run_path = path.join(log_path, merge_runs[i]);
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
                        // fs.renameSync(merge_log_path, new_log_path);
                        fs.copyFile(merge_log_path, new_log_path, (err) => {
                            if (err) {
                                console.log(err);
                            }
                        });
                    }
                }
            }
        }
    }

    // Transfer incomimg python scrips to current scripts
    // var merge_scripts_path = `${merge_path}/training/python/`;
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
                fs.copyFile(merge_script_path, new_script_path, (error) => {
                    if (error) {
                        console.log(error);
                    }
                });
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

        // var merge_path_file = `${merge_path}/training/Paths.txt`;
        if (fs.existsSync(merge_python_file)) {
            var merge_paths_arr = [];
            merge_paths_arr.push(
                fs
                    .readFileSync(merge_python_file, "utf-8")
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
                if (err) {
                    console.log(err);
                }
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

        // var darknet_merge_path_file = `${merge_path}/training/darknetPaths.txt`;
        if (fs.existsSync(merge_darknet_file)) {
            var darknet_merge_paths_arr = [];
            darknet_merge_paths_arr.push(
                fs
                    .readFileSync(merge_darknet_file, "utf-8")
                    .split("\n")
                    .filter(Boolean),
            );
            var darknet_merge_paths = [];
            darknet_merge_paths = darknet_merge_paths.concat
                .apply(darknet_merge_paths, darknet_merge_paths_arr)
                .filter(Boolean);
            var darknet_new_paths = "";
            for (var i = 0; i < darknet_merge_paths.length; i++) {
                if (darknet_current_paths.includes(darknet_merge_paths[i])) {
                    continue;
                }
                darknet_new_paths = `${darknet_new_paths}${darknet_merge_paths[i]}\n`;
            }
            console.log("new darknet paths: ", darknet_new_paths);
            fs.appendFile(darknet_path_file, darknet_new_paths, (err) => {
                if (err) {
                    console.log(err);
                }
            });
        }
    }

    //add incoming weights here
    if (fs.existsSync(merge_weights_path)) {
        var merge_weights = await readdirAsync(merge_weights_path);
        for (var i = 0; i < merge_weights.length; i++) {
            var extension = merge_weights[i].split(".").pop();
            if (extension == "weights" || Number.isInteger(extension)) {
                var merge_weights_path = path.join(
                    merge_weights_path,
                    merge_weights[i],
                );
                var cur_weights = await readdirAsync(weights_path);
                var merge_weight_name = merge_weights[i];
                var j = 1;
                var t = `${merge_weights[i].split(".")[0]}${j}.${extension}`;

                while (cur_weights.includes(merge_weight_name)) {
                    merge_weight_name = `${merge_weights[i].split(".")[0]}${j}.py`;
                }
                var new_weight_path = path.join(
                    weights_path,
                    merge_weight_name,
                );
                fs.copyFile(merge_weight_path, new_weight_path, (error) => {
                    if (error) {
                        console.log(error);
                    }
                });
            }
        }
    }

    // merge classes //////////////////////////////////////////////////////
    var results1 = await mdb.allAsync("SELECT * FROM Classes");
    var cur_classes = [];
    for (var i = 0; i < results1.length; i++) {
        cur_classes.push(results1[i].CName);
    }

    var results2 = await mergeDB.allAsync("SELECT * FROM Classes");
    for (var i = 0; i < results2.length; i++) {
        var temp = results2[i].CName;
        results2[i].CName = results2[i].CName.trim();
        results2[i].CName = results2[i].CName.split(" ").join("_");
        if (!cur_classes.includes(results2[i].CName)) {
            await mergeDB.runAsync(
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
    var curr_DB_Images = await readdirAsync(image_path);
    var results4 = await mergeDB.allAsync("SELECT * FROM Images");
    console.log("moving new images");
    for (var i = 0; i < results4.length; i++) {
        if (!curr_DB_Images.includes(results4[i].IName)) {
            fs.copyFile(
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

    // merge labels + validation ///////////////////////////////////////////////////////////////
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

    // var results8 = await mdb.allAsync("SELECT * FROM Validation");
    // var cur_valids = [];
    // for(var i = 0; i < results8.length; i++)
    // {
    //     cur_valids.push([results8[i].Confidence, results8[i].LID, results8[i].CName, results8[i].IName]);
    // }

    // get incoming labels
    var results6 = await mergeDB.allAsync("SELECT * FROM Labels");

    var results7 = await mergeDB.allAsync("SELECT * FROM Validation");
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

    mergeDB.close((err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("mergeDB closed successfully");
        }
    });
    res.send("Merge successful");
}

module.exports = mergeLocal;
