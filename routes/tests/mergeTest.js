const StreamZip = require("node-stream-zip");
const rimraf = require("../../public/libraries/rimraf");
const path = require("path");

async function mergeTest(req, res) {
    console.log("\nmergeTest");

    //get form variables
    var uploadImages = req.files.upload_project,
        projectName = req.body.PName,
        Admin = req.body.Admin,
        username = req.cookies.Username;

    console.log("project_name: ", projectName);
    console.log("Admin: ", Admin);
    console.log("upload: ", uploadImages);

    //set paths
    var publicPath = currentPath,
        mainPath = publicPath + "public/projects",
        projectPath = mainPath + "/" + Admin + "-" + projectName,
        imagePath = projectPath + "/images",
        bootstrapPath = projectPath + "/bootstrap",
        trainingPath = projectPath + "/training",
        logPath = trainingPath + "/logs/",
        scriptsPath = trainingPath + "/python/",
        pythonPathFile = trainingPath + "/Paths.txt",
        darknetPathFile = trainingPath + "/darknetPaths.txt",
        mergePath = projectPath + "/merge",
        mergeImages = mergePath + "/images/",
        zipPath = projectPath + "/" + uploadImages.name,
        newDB = mergePath + "/merge.db",
        dump = mergePath + "/merge.dump";

    //create merge file structure ///////////////////////////////////////////////////////////////////////////////////
    if (fs.existsSync(mergePath)) {
        console.log("merge_path already exists");
        rimraf(mergePath, (err) => {
            if (err) {
                console.log(err);
            } else {
                fs.mkdir(mergePath, (error) => {
                    if (error) {
                        console.log(error);
                    }
                });
            }
        });
    } else {
        fs.mkdir(mergePath, (err) => {
            if (err) {
                console.error(err);
                // res.send({"Success": "merge_path directory failed to make"});
                return res.send("ERROR! merge_path directory failed to make");
            }
        });
    }

    // connect to current project database /////////////////////////////////////////////////////////////////////////////
    var mdb = new sqlite3.Database(
        projectPath + "/" + projectName + ".db",
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
    await uploadImages.mv(zipPath);
    console.log(`zip_path: ${zipPath}`);
    var zip = new StreamZip({ file: zipPath });

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

        fs.unlink(zipPath, (error) => {
            if (error) {
                console.log(error);
            }
        });

        rimraf(mergePath, (err) => {
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
        zip.extract(null, mergePath, async (err, count) => {
            console.log(
                err ? `Extract error: ${err}` : `Extracted ${count} entries`,
            );
            zip.close();
            //read current list of images
            var currImages = await readdirAsync(imagePath);
            console.log("current Images: ", currImages);
            //read in new files
            var newfiles = await readdirAsync(mergePath);
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
                    await rimraf(mergePath, (err) => {
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
                var mergeRunsPath = `${mergePath}/training/logs/`;
                if (fs.existsSync(mergeRunPath)) {
                    console.log("merge_runs: ", mergeRunsPath);
                    var mergeRuns = await readdirAsync(mergeRunsPath);
                    console.log("incoming runs: ", mergeRuns);
                    for (var i = 0; i < mergeRuns.length; i++) {
                        var mergeRunPath = `${mergeRunsPath}${mergeRuns[i]}`;
                        console.log("merge_run_path: ", mergeRunPath);
                        if (fs.lstatSync(mergeRunPath).isDirectory()) {
                            var mergeLogs = await readdirAsync(mergeRunPath);
                            console.log("merge_logs: ", mergeLogs);
                            var newRunPath = path.join(
                                logPath,
                                mergeRuns[i],
                            );
                            if (!fs.existsSync(newRunPath)) {
                                fs.mkdirSync(newRunPath);
                                console.log("new_run_path: ", newRunPath);
                                for (var j = 0; j < mergeLogs.length; j++) {
                                    var mergeLogPath = path.join(
                                        mergeRunPath,
                                        mergeLogs[j],
                                    );
                                    var newLogPath = path.join(
                                        newRunPath,
                                        mergeLogs[j],
                                    );
                                    fs.renameSync(mergeLogPath, newLogPath);
                                }
                            }
                        }
                    }
                }
                // Transfer incoming bootstrap files to current files
                var mergeBootstrapPath = `${mergePath}/bootstrap/`;
                if (fs.existsSync(mergeBootstrapPath)) {
                    var mergeFiles = await readdirAsync(mergeBootstrapPath);
                    for (var i = 0; i < mergeFiles.length; i++) {
                        var extension = mergeFiles[i].split(".").pop();
                        if (
                            ["weights", "cfg", "data", "json", "txt"].includes(
                                extension,
                            )
                        ) {
                            var mergeFilePath = path.join(
                                mergeBootstrapPath,
                                mergeFiles[i],
                            );
                            var curFiles = await readdirAsync(bootstrapPath);
                            var mergeFileName = mergeFiles[i];
                            var j = 1;
                            var t = `${mergeFiles[i].split(".")[0]}${j}.${extension}`;
                            while (curFiles.includes(mergeFileName)) {
                                mergeFileName = `${mergeFiles[i].split(".")[0]}${j}.${extension}`;
                            }
                            var newFilePath = path.join(
                                bootstrapPath,
                                mergeFileName,
                            );
                            fs.rename(
                                mergeFilePath,
                                newFilePath,
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
                var mergeScriptsPath = `${mergePath}/training/python/`;
                if (fs.existsSync(mergeScriptsPath)) {
                    var mergeScripts = await readdirAsync(mergeScriptsPath);
                    for (var i = 0; i < mergeScripts.length; i++) {
                        if (mergeScripts[i].split(".").pop() == "py") {
                            var mergeScriptPath = path.join(
                                mergeScriptsPath,
                                mergeScripts[i],
                            );
                            var curScripts = await readdirAsync(scriptsPath);
                            var mergeScriptName = mergeScripts[i];
                            var j = 1;
                            var t = `${mergeScripts[i].split(".")[0]}${j}.py`;
                            // console.log("split name: ", t)
                            while (curScripts.includes(mergeScriptName)) {
                                mergeScriptName = `${mergeScripts[i].split(".")[0]}${j}.py`;
                            }
                            var newScriptPath = path.join(
                                scriptsPath,
                                mergeScriptName,
                            );
                            fs.rename(
                                mergeScriptPath,
                                newScriptPath,
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
                if (fs.existsSync(pythonPathFile)) {
                    var currentPathsArr = [];
                    currentPathsArr.push(
                        fs
                            .readFileSync(pythonPathFile, "utf-8")
                            .split("\n")
                            .filter(Boolean),
                    );
                    var currentPaths = [];
                    currentPaths = currentPaths.concat
                        .apply(currentPaths, currentPathsArr)
                        .filter(Boolean);

                    var mergePathFile = `${mergePath}/training/Paths.txt`;
                    if (fs.existsSync(mergePathFile)) {
                        var mergePathsArr = [];
                        mergePathsArr.push(
                            fs
                                .readFileSync(mergePathFile, "utf-8")
                                .split("\n")
                                .filter(Boolean),
                        );
                        var mergePaths = [];
                        mergePaths = mergePaths.concat
                            .apply(mergePaths, mergePathsArr)
                            .filter(Boolean);
                        var newPaths = "";
                        for (var i = 0; i < mergePaths.length; i++) {
                            if (currentPaths.includes(mergePaths[i])) {
                                continue;
                            }
                            newPaths = `${newPaths}${mergePaths[i]}\n`;
                        }
                        console.log("new python paths: ", newPaths);
                        fs.appendFile(pythonPathFile, newPaths, (err) => {
                            if (err) throw err;
                        });
                    }
                }

                // Add incoming darknet paths
                if (fs.existsSync(darknetPathFile)) {
                    var darknetCurrentPathsArr = [];
                    darknetCurrentPathsArr.push(
                        fs
                            .readFileSync(darknetPathFile, "utf-8")
                            .split("\n")
                            .filter(Boolean),
                    );
                    var darknetCurrentPaths = [];
                    darknetCurrentPaths = darknetCurrentPaths.concat
                        .apply(darknetCurrentPaths, darknetCurrentPathsArr)
                        .filter(Boolean);

                    var darknetMergePathFile = `${mergePath}/training/darknetPaths.txt`;
                    if (fs.existsSync(darknetMergePathFile)) {
                        var darknetMergePathsArr = [];

                        darknetMergePathsArr.push(
                            fs
                                .readFileSync(darknetMergePathFile, "utf-8")
                                .split("\n")
                                .filter(Boolean),
                        );
                        var darknetMergePaths = [];
                        darknetMergePaths = darknetMergePaths.concat
                            .apply(darknetMergePaths, darknetMergePathsArr)
                            .filter(Boolean);
                        var darknetNewPaths = "";
                        for (var i = 0; i < darknetMergePaths.length; i++) {
                            if (
                                darknetCurrentPaths.includes(
                                    darknetMergePaths[i],
                                )
                            ) {
                                continue;
                            }
                            darknetNewPaths = `${darknetNewPaths}${darknetMergePaths[i]}\n`;
                        }
                        console.log("new darknet paths: ", darknetNewPaths);
                        fs.appendFile(
                            darknetPathFile,
                            darknetNewPaths,
                            (err) => {
                                if (err) throw err;
                            },
                        );
                    }
                }

                //connect to new database//////////////////////////////////////////////////////////////////
                var nmdb = new sqlite3.Database(
                    mergePath + "/" + incomingDB,
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
                var curClasses = [];
                for (var i = 0; i < results1.length; i++) {
                    curClasses.push(results1[i].CName);
                }

                var results2 = await nmdb.allAsync("SELECT * FROM Classes");
                for (var i = 0; i < results2.length; i++) {
                    var temp = results2[i].CName;
                    results2[i].CName = results2[i].CName.trim();
                    results2[i].CName = results2[i].CName.split(" ").join("_");
                    if (!curClasses.includes(results2[i].CName)) {
                        await nmdb.runAsync(
                            "UPDATE Labels SET CName = '" +
                                results2[i].CName +
                                "' WHERE CName = '" +
                                temp +
                                "'",
                        );
                        curClasses.push(results2[i].CName);
                        await mdb.runAsync(
                            "INSERT INTO Classes (CName) VALUES ('" +
                                results2[i].CName +
                                "')",
                        );
                    }
                }

                // merge images /////////////////////////////////////////////////////////
                //Check base database for missing/renamed images
                var curr_DB_Images = await readdirAsync(imagePath);
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
                var currImages = await readdirAsync(mergeImages);
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
                        mergeImages + currImages[j],
                        mergeImages + image,
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
                            mergeImages + results4[i].IName,
                            imagePath + "/" + results4[i].IName,
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
                var curLabels = [];
                for (var i = 0; i < results5.length; i++) {
                    curLabels.push([
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
                var newValids = [];
                for (var i = 0; i < results7.length; i++) {
                    newValids.push([
                        results7[i].Confidence,
                        results7[i].LID,
                        results7[i].CName,
                        results7[i].IName,
                    ]);
                }

                var newLabels = [];
                var newl = 0;
                for (var i = 0; i < results6.length; i++) {
                    newLabels.push([
                        results6[i].CName,
                        results6[i].X,
                        results6[i].Y,
                        results6[i].W,
                        results6[i].H,
                        results6[i].IName,
                    ]);

                    // check if incoming label already exists in current dataset
                    for (var j = 0; j < curLabels.length; j++) {
                        if (
                            curLabels[j][0] === newLabels[i][0] &&
                            curLabels[j][1] === newLabels[i][1] &&
                            curLabels[j][2] === newLabels[i][2] &&
                            curLabels[j][3] === newLabels[i][3] &&
                            curLabels[j][4] === newLabels[i][4] &&
                            curLabels[j][5] === newLabels[i][5]
                        ) {
                            newl = 1;
                        }
                    }
                    // add incoming label to database
                    if (newl == 0) {
                        curLabels.push([
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
                        for (var v = 0; v < newValids.length; v++) {
                            if (results6[i].LID == newValids[v][1]) {
                                await mdb.runAsync(
                                    "INSERT INTO Validation (Confidence, LID, CName, IName) VALUES ('" +
                                        newValids[v][0] +
                                        "', '" +
                                        Number(newmax) +
                                        "', '" +
                                        newValids[v][2] +
                                        "', '" +
                                        newValids[v][3] +
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
                            rimraf(mergePath, (err) => {
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
                        fs.unlink(zipPath, (error) => {
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
