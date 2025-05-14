const { error, time } = require("console");
const { SSL_OP_EPHEMERAL_RSA } = require("constants");
const DecompressZip = require("decompress-zip");
const express = require("express");
const { existsSync, readdirSync } = require("fs");
const { async } = require("node-stream-zip");
const StreamZip = require("node-stream-zip");
const { protocol } = require("socket.io-client");
const { OPEN_CREATE } = require("sqlite3");
const rimraf = require("../public/libraries/rimraf");
const ffmpeg = require("ffmpeg");
const { folder } = require("decompress-zip/lib/extractors");
const { exec } = require("child_process");
const path = require("path");
const { stdout } = require("process");
const sharp = require("sharp");
const api = express.Router();
const new_file_path = require("path");
const unzipper = require("unzipper");

const unzipFile = require("../utils/unzipFile");
const pythonScript = require("../utils/pythonScript");

const logout = require("./user/logout");
const login = require("./user/login");
const signup = require("./user/signup");
const addUser = require("./user/addUser");

const createClassification = require("./training/createClassification");
const addClasses = require("./training/addClasses");
const uploadWeights = require("./training/uploadWeights");
const yolovx = require("./training/yolovx");
const uploadPreWeights = require("./training/uploadPreWeights");
const yoloRun = require("./training/yoloRun");
const deleteRun = require("./training/deleteRun");
const python = require("./training/python");
const darknet = require("./training/darknet");
const removePath = require("./training/movePath");
const removeDarknetPath = require("./training/removeDarknetPath");
const removeWeights = require("./training/removeWeights");
const removeScript = require("./training/removeScript");
const run = require("./training/run");

const createProject = require("./projects/createProject");
const updateProject = require("./projects/updateProject");
const deleteProject = require("./projects/deleteProject");
const addImages = require("./projects/addImages");
const importProject = require("./projects/importProject");
const mergeLocal = require("./projects/mergeLocal");
const removeAccess = require("./projects/removeAccess");
const transferAdmin = require("./projects/transferAdmin");
const script = require("./projects/script");

const updateLabels = require("./labelling/updateLabels");

const downloadDataset = require("./downloads/downloadDataset");
const downloadProject = require("./downloads/downloadProject");
const downloadScript = require("./downloads/downloadScript");

const test = require("./tests/test");
const mergeTest = require("./tests/mergeTest");

// USER ROUTES
api.post("/logout", logout);
api.post("/login", login);
api.post("/signup", signup);
api.post("/addUser", addUser);

// TRAINING ROUTES
api.post("/api/createC", createClassification);
api.post("/addClasses", addClasses);
api.post("/upload_weights", uploadWeights);
api.post("/yolovx", yolovx);
api.post("/upload_pre_weights", uploadPreWeights);
api.post("/yolo-run", yoloRun);
api.post("/deleteRun", deleteRun);
api.post("/python", python);
api.post("/darknet", darknet);
api.post("/remove_path", removePath);
api.post("/remove_darknet_path", removeDarknetPath);
api.post("/remove_weights", removeWeights);
api.post("/remove_script", removeScript);
api.post("/run", run);

// PROJECT ROUTES
api.post("/createP", createProject);
api.post("/updateProject", updateProject);
api.post("/deleteProject", deleteProject);
api.post("/addImages", addImages);
api.post("/import", importProject);
api.post("/mergeLocal", mergeLocal);
api.post("/removeAccess", removeAccess);
api.post("/transferAdmin", transferAdmin);
api.post("/script", script);

// LABELLING ROUTES
api.post("/updateLabels", updateLabels);

// DOWNLOAD ROUTES
api.post("/downloadDataset", downloadDataset);
api.post("/downloadProject", downloadProject);
api.post("/downloadScript", downloadScript);

// TEST ROUTES
api.post("/test", test);
api.post("/mergeTest", mergeTest);

////////////////////////////Download page/////////////////////////////////////////////////

api.post("/downloadWeights", async (req, res) => {
    console.log("downloadingWeights");

    // get URL variables
    var PName = req.body.PName,
        admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username;

    var weights_arr = [];
    weights_arr.push(req.body["weights[]"]);
    var weights = [];
    weights = weights.concat.apply(weights, weights_arr).filter(Boolean);
    console.log("weights: ", weights);

    // Set paths
    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        //downloads_path = project_path + '/downloads', // $LABELING_TOOL_PATH/public/projects/project_name/downloads
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        python_path = training_path + "/python",
        logs_path = training_path + "/logs",
        weights_path = training_path + "/weights";

    // Create zipfile

    var output = fs.createWriteStream(downloads_path + "/weights.zip");
    var archive = archiver("zip");

    output.on("close", function () {
        console.log(archive.pointer() + " total bytes");
        console.log(
            "archiver has been finalized and the output file descriptor has closed.",
        );
        res.download(downloads_path + "/weights.zip");
    });
    archive.on("error", function (err) {
        throw err;
    });

    archive.pipe(output);
    for (var i = 0; i < weights.length; i++) {
        var weights_file = weights_path + "/" + weights[i];
        archive.file(weights_file, { name: weights[i] });
    }
    archive.finalize();
});

api.post("/downloadRun", async (req, res) => {
    console.log("downloadRun");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        IDX = req.body.IDX,
        weights = req.body.weights,
        user = req.cookies.Username,
        log_file = req.body.log_file,
        run_path = req.body.run_path;

    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + user + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        logs_path = training_path + "/logs/";

    var output = fs.createWriteStream(
        downloads_path + "/" + log_file.substr(0, log_file.length - 4) + ".zip",
    );
    var archive = archiver("zip");

    output.on("close", function () {
        console.log(archive.pointer() + " total bytes");
        console.log(
            "archiver has been finalized and the output file descriptor has closed.",
        );
        res.download(
            downloads_path +
                "/" +
                log_file.substr(0, log_file.length - 4) +
                ".zip",
        );
    });
    archive.on("error", function (err) {
        throw err;
    });

    archive.pipe(output);

    var logs = await readdirAsync(`${run_path}`);

    for (var i = 0; i < logs.length; i++) {
        archive.file(`${run_path}${logs[i]}`, { name: logs[i] });
    }

    archive.finalize();
});

//TODO
//Call Ashwin's script to configure YOLO files
api.post("/yolo-run", async (req, res) => {
    console.log("yolo-run");

    const { exec } = require("child_process");
    //const {spawn} = require('child_process');

    var date = Date.now();

    var PName = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        darknet_path = req.body.darknet_path,
        log = `${date}.log`,
        trainDataPer = req.body.TrainingPercent,
        batch = req.body.batch,
        subdiv = req.body.subdiv,
        width = req.body.width,
        height = req.body.height,
        weight_name = req.body.weights;

    var err_file = `${date}-error.log`;

    /*
	Steps:
		1. Create txt files for each image
		2. Create classes.txt file
		3. Call datatovalues.py script
	*/
    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        logs_path = training_path + "/logs",
        run_path = `${logs_path}/${date}`,
        classes_path = run_path + "/classes.txt",
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

    //////////////////////Copy YOLO template files over to run folder///////////////////////////////////////////////////
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

    /////////////////////Copy darknet config script to darknet directory///////////////////////////////////////////
    console.log("Copy darknet config script to darknet directory");
    darknet_cfg_script = darknet_path + "/datatovalues.py";
    if (!existsSync(darknet_cfg_script)) {
        fs.copyFile(yolo_script, darknet_cfg_script, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    /////////////////////////Create Project within darknet if does not exist///////////////////////////////////////
    console.log("Create Project within darknet if does not exist");
    project = `${Admin}-${PName}`;
    abs_darknet_project_path = path.join(darknet_path, project);
    abs_darknet_images_path = path.join(abs_darknet_project_path, "images");

    if (!fs.existsSync(abs_darknet_images_path)) {
        fs.mkdirSync(abs_darknet_project_path);
        //Create symbolic link to images
        fs.symlink(images_path, abs_darknet_images_path, "dir", (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Images Symlink created");
                console.log(
                    "Symlink is a directory: ",
                    fs.lstatSync(abs_darknet_images_path).isDirectory(),
                );
            }
        });
    }

    //////////////////////////Create symbolic link from darknet to run/////////////////////////////////////////////
    console.log("Create symbolic link from darknet to run");
    abs_darknet_project_run = path.join(
        abs_darknet_project_path,
        date.toString(),
    );

    if (!fs.existsSync(abs_darknet_project_run)) {
        fs.symlink(run_path, abs_darknet_project_run, "dir", (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Symlink created");
                console.log(
                    "Symlink is a directory: ",
                    fs.lstatSync(abs_darknet_project_run).isDirectory(),
                );
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
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
        });
    };

    /////////////////////////////////////////Create label txt files///////////////////////////////////////////////////
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
            "SELECT * FROM Labels WHERE IName = '" + results2[i].IName + "'",
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
        remove_dot_ext = key.split(".")[0];
        fs.writeFileSync(
            `${images_path}/${remove_dot_ext}.txt`,
            dict_images_labels[key],
            (err) => {
                if (err) throw err;
            },
        );
    }

    //////////////////////////////////////////////////Create Classes file///////////////////////////////////////////////////////////////////
    console.log("Create Classes file");
    var classes = "";
    for (var i = 0; i < results1.length; i++) {
        classes = classes + results1[i].CName + "\n";
    }
    classes = classes.substring(0, classes.length - 1); //remove trailing newline

    fs.writeFileSync(classes_path, classes, (err) => {
        if (err) throw err;
        console.log("done writing Classes file");
    });

    ycdb.close((err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("ycdb closed successfully");
        }
    });

    //////////////////////////////////////////// Call Ashwin's script here//////////////////////////////////////////////////////////////////
    console.log("Calling Darknet");
    // Pass in python path, script, and options
    darknet_project_run = path.join(project, date.toString());
    darknet_images_path = path.join(abs_darknet_project_path, "images");
    var cmd = `python3 ${yolo_script} -d ${darknet_path}/${darknet_project_run} -i ${darknet_images_path} -n ${classes_path} -p ${trainDataPer} -l ${abs_darknet_project_run}/${log} -y ${darknet_path} -w ${weight_path} -b ${batch} -s ${subdiv} -x ${width} -t ${height}`;
    var success = "";
    var error = "";
    console.log(cmd);

    //change directory to darknet
    process.chdir(darknet_path);

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
        console.log("The script has finished running");
        fs.writeFile(`${darknet_project_run}/done.log`, success, (err) => {
            if (err) throw err;
        });
    });
    res.send({ Success: `Training Started` });
});

module.exports = api;

api.post("/deleteUser", async (req, res) => {
    console.log("delete user");
    var user = req.cookies.Username;

    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/";

    var darknet_path = new Set();

    var filesinfolder = readdirSync(main_path);
    // Delete the Files
    for (var i = 0; i < filesinfolder.length; i++) {
        if (
            filesinfolder[i].split("_")[0] == user ||
            filesinfolder[i].split("-")[0] == user
        ) {
            if (filesinfolder[i].split("-")[0] == user) {
                var tempdarknet = fs
                    .readFileSync(
                        main_path +
                            filesinfolder[i] +
                            "/training/darknetPaths.txt",
                        "utf-8",
                    )
                    .split("\n")
                    .join(",")
                    .split(",");
                for (var f = 0; f < tempdarknet.length; f++) {
                    if (tempdarknet[f] != "") {
                        darknet_path.add(tempdarknet[f]);
                    }
                }
            }
            rimraf(main_path + filesinfolder[i], (err) => {
                if (err) {
                    console.error(
                        "there was an error with the user contents: ",
                        err,
                    );
                } else {
                    console.log("User directory contents successfuly deleted");
                }
            });
        }
    }

    //Delete the YOLO Files
    const drknt_temp = darknet_path.values();
    for (var i = 0; i < darknet_path.size; i++) {
        var current_darknet_path = drknt_temp.next().value;
        var darknetFiles = readdirSync(current_darknet_path);
        for (var i = 0; i < darknetFiles.length; i++) {
            if (darknetFiles[i].split("-")[0] == user) {
                rimraf(current_darknet_path + "/" + darknetFiles[i], (err) => {
                    if (err) {
                        console.error(
                            "there was an error with the user contents: ",
                            err,
                        );
                    } else {
                        console.log(
                            "Darknet user project contents successfuly deleted",
                        );
                    }
                });
            }
        }
    }
    // Delete from the Database
    db.getAsync("DELETE FROM Access WHERE Admin = '" + user + "'");
    db.getAsync("DELETE FROM Access WHERE Username = '" + user + "'");
    db.getAsync("DELETE FROM Projects WHERE Admin = '" + user + "'");
    db.getAsync("DELETE FROM Users WHERE Username = '" + user + "'");

    res.clearCookie("Username");
    return res.send({ Success: "Yes" });
});

api.post("/updateClass", async (req, res) => {
    console.log("Request body:", req.body);

    const className = req.body.currentClassName;
    const updateClassName = req.body.updatedValue;
    //update Class name

    var IDX = parseInt(req.body.IDX),
        PName = req.body.PName,
        admin = req.body.Admin,
        user = req.cookies.Username;

    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/",
        project_path = main_path + user + "-" + PName;

    // console.log("project_path: ", project_path);
    // console.log("Current Class Name:", className);
    // console.log("Updated Class Name:", updateClassName);

    var db = new sqlite3.Database(project_path + "/" + PName + ".db", (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log("Connected to db.");
    });

    const updateLabels = `UPDATE Labels SET CName = ? WHERE CName = ?`;
    const updateValidation = `UPDATE Validation SET CName = ? WHERE CName = ?`;
    const updateClasses = `UPDATE Classes SET CName = ? WHERE CName = ?`;

    db.run(updateLabels, [updateClassName, className], function (err) {
        if (err) {
            console.error("Error updating Labels:", err.message);
            return res.status(500).send("Error updating Labels");
        }
        db.run(updateValidation, [updateClassName, className], function (err) {
            if (err) {
                console.error("Error updating Validation:", err.message);
                return res.status(500).send("Error updating Validation");
            }
            db.run(updateClasses, [updateClassName, className], function (err) {
                if (err) {
                    console.error("Error updating Classes:", err.message);
                    return res.status(500).send("Error updating Classes");
                }
                res.status(200).send("Class name updated successfully.");
            });
        });
    });
});

api.post("/deleteClass", async (req, res) => {
    console.log("body", req.body);

    var IDX = parseInt(req.body.IDX),
        PName = req.body.PName,
        admin = req.body.Admin,
        user = req.cookies.Username,
        classes = req.body["classArray[]"];

    console.log("classes: ", classes);
    // set paths
    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/",
        project_path = main_path + admin + "-" + PName;

    var dcdb = new sqlite3.Database(
        project_path + "/" + PName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to dcdb.");
        },
    );
    dcdb.getAsync = function (sql) {
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
    dcdb.allAsync = function (sql) {
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
    dcdb.runAsync = function (sql) {
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

    if (classes.includes(",")) {
        classes = classes.split(",");
    }
    console.log(classes);

    //Delete classes
    var deleteLabels = "";
    var deleteClasses = "";
    var deleteValid = "";
    if (typeof classes == "string") {
        deleteClasses = `DELETE FROM Classes WHERE CName = '${classes}'`;
        deleteLabels = `DELETE FROM Labels WHERE CName = '${classes}'`;
        deleteValid = `DELETE FROM Validation WHERE CName = '${classes}'`;
    } else {
        deleteLabels = `DELETE FROM Labels WHERE CName = '${classes[0]}'`;
        deleteClasses = `DELETE FROM Classes WHERE CName = '${classes[0]}'`;
        deleteValid = `DELETE FROM Validation WHERE CName = '${classes[0]}'`;

        for (var i = 1; i < classes.length; i++) {
            var string = ` OR CName = '${classes[i]}'`;
            deleteLabels += string;
            deleteClasses += string;
            deleteValid += string;
        }
    }
    console.log(deleteClasses);
    await dcdb.runAsync(deleteClasses);

    console.log(deleteLabels);
    await dcdb.runAsync(deleteLabels);

    console.log(deleteValid);
    await dcdb.runAsync(deleteValid);

    console.log("deleteClass (redirect)");

    dcdb.close(function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("cdb closed successfully");
        }
    });

    return res.redirect("/config?IDX=" + IDX);
});

api.post("/changeFname", async (req, res) => {
    console.log("changeFname");

    var user = req.cookies.Username,
        FName = req.body.FName;
    await db.runAsync(
        "UPDATE Users SET FirstName = '" +
            FName +
            "' WHERE Username = '" +
            user +
            "'",
    );

    return res.send({ Success: "Yes" });
});

api.post("/changeLname", async (req, res) => {
    console.log("changeLname");

    var user = req.cookies.Username,
        LName = req.body.LName;
    await db.runAsync(
        "UPDATE Users SET LastName = '" +
            LName +
            "' WHERE Username = '" +
            user +
            "'",
    );

    return res.send({ Success: "Yes" });
});

api.post("/changeEmail", async (req, res) => {
    console.log("changeEmail");

    var user = req.cookies.Username,
        Email = req.body.Email;
    await db.runAsync(
        "UPDATE Users SET Email = '" +
            Email +
            "' WHERE Username = '" +
            user +
            "'",
    );

    return res.send({ Success: "Yes" });
});

api.post("/changeUname", async (req, res) => {
    console.log("changeUname");

    var user = req.cookies.Username,
        UName = req.body.UName;

    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/",
        download_path = main_path + user + "_Downloads",
        new_download_path = main_path + UName + "_Downloads";

    await db.runAsync(
        "UPDATE Users SET Username = '" +
            UName +
            "' WHERE Username = '" +
            user +
            "'",
    );
    await db.runAsync(
        "UPDATE Access SET Username = '" +
            UName +
            "' WHERE Username = '" +
            user +
            "'",
    );
    await db.runAsync(
        "UPDATE Access SET Admin = '" +
            UName +
            "' WHERE Admin = '" +
            user +
            "'",
    );
    await db.runAsync(
        "UPDATE Projects SET Admin = '" +
            UName +
            "' WHERE Admin = '" +
            user +
            "'",
    );

    fs.rename(download_path, new_download_path, () => {});

    var project_files = readdirSync(main_path);

    for (var f = 0; f < project_files.length; f++) {
        if (project_files[f].split("-")[0] == user) {
            fs.rename(
                main_path + project_files[f],
                main_path + UName + "-" + project_files[f].split("-")[1],
                () => {},
            );
        }
    }

    res.clearCookie("Username");
    res.cookie("Username", UName, {
        httpOnly: true,
    });
    return res.send({ Success: "Yes" });
});

api.post("/changePassword", async (req, res) => {
    console.log("changePassword");

    var user = req.cookies.Username,
        oldPassword = req.body.oldPassword,
        newPassword = req.body.newPassword;

    var passwords = await db.allAsync(
        "SELECT Password FROM Users WHERE Username = '" + user + "'",
    );

    if (!bcrypt.compareSync(oldPassword, passwords[0].Password)) {
        return res.send({ Success: "Wrong Password!" });
    } else {
        bcrypt.hash(newPassword, 10, async function (err, hash) {
            if (err) {
                console.error(err);
                return res.send({
                    Success:
                        "Password encryption error. Password has not been changed",
                });
            } else {
                await db.runAsync(
                    "UPDATE Users SET Password = '" +
                        hash +
                        "' WHERE Username = '" +
                        user +
                        "'",
                );
                return res.send({ Success: "Yes" });
            }
        });
    }
});

api.post("/deleteImage", async (req, res) => {
    console.log("deleteImage");

    var IDX = parseInt(req.body.IDX),
        PName = req.body.PName,
        admin = req.body.Admin,
        user = req.cookies.Username,
        images = req.body.ImageArray;

    console.log("IDX: ", IDX);
    // set paths
    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/",
        project_path = main_path + admin + "-" + PName,
        images_path = project_path + "/images/";

    var didb = new sqlite3.Database(
        project_path + "/" + PName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to didb.");
        },
    );
    didb.getAsync = function (sql) {
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
    didb.allAsync = function (sql) {
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
    didb.runAsync = function (sql) {
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
    console.log(images);
    if (images.includes(",")) {
        images = images.split(",");
    }

    var deleteLabels = "";
    var deleteImages = "";
    var deleteVal = "";
    if (typeof images == "string") {
        deleteImages = `DELETE FROM Images WHERE IName = '${images}'`;
        deleteLabels = `DELETE FROM Labels WHERE IName = '${images}'`;
        deleteVal = `DELETE FROM Validation WHERE IName = '${images}'`;
    } else {
        deleteLabels = `DELETE FROM Labels WHERE IName = '${images[0]}'`;
        deleteImages = `DELETE FROM Images WHERE IName = '${images[0]}'`;
        deleteVal = `DELETE FROM Validation WHERE IName = '${images[0]}'`;
        for (var i = 1; i < images.length; i++) {
            var string = ` OR IName = '${images[i]}'`;
            deleteLabels += string;
            deleteClasses += string;
        }
    }

    console.log(deleteLabels);
    await didb.runAsync(deleteLabels);

    console.log(deleteImages);
    await didb.runAsync(deleteImages);

    console.log(deleteVal);
    await didb.runAsync(deleteVal);

    //reIndex Images to reset rowId
    var reIndexImages = await didb.allAsync("SELECT * FROM Images"); //tp1
    await didb.runAsync("DELETE FROM Images");
    for (var t = 0; t < reIndexImages.length; t++) {
        await didb.runAsync(
            "INSERT INTO Images (IName, reviewImage, validateImage) VALUES ('" +
                reIndexImages[t]["IName"] +
                "', '" +
                reIndexImages[t]["reviewImage"] +
                "', '" +
                reIndexImages[t]["validateImage"] +
                "')",
        );
    }

    // for(var i = 1; i < images.length; i++){
    image_path = `${images_path}` + images; //change if multi image deletion is requested
    console.log("Delete image: ", image_path);
    fs.unlink(image_path, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("done");
        }
    });
    // }

    didb.close(function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("didb closed successfully");
            res.send({ Success: "Yes" });
        }
    });
});

api.post("/deleteLabel", async (req, res) => {
    console.log("deleteLabel");

    var IDX = parseInt(req.body.IDX),
        PName = req.body.PName,
        admin = req.body.Admin,
        user = req.cookies.Username,
        labels = req.body.LabelArray;

    console.log("IDX: ", IDX);
    // set paths
    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/",
        project_path = main_path + admin + "-" + PName;

    var didb = new sqlite3.Database(
        project_path + "/" + PName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to didb.");
        },
    );
    didb.getAsync = function (sql) {
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
    didb.allAsync = function (sql) {
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
    didb.runAsync = function (sql) {
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
    console.log(labels);
    if (labels.includes(",")) {
        labels = labels.split(",");
    }

    var deleteLabels = "";
    var deleteVal = "";
    if (typeof labels == "string") {
        deleteLabels = `DELETE FROM Labels WHERE LID = '${labels}'`;
        deleteVal = `DELETE FROM Validation WHERE LID = '${labels}'`;
    } else {
        deleteLabels = `DELETE FROM Labels WHERE LID = '${labels[0]}'`;
        deleteVal = `DELETE FROM Validation WHERE LID = '${labels[0]}'`;
        for (var i = 1; i < labels.length; i++) {
            var string = ` OR LID = '${labels[i]}'`;
            deleteLabels += string;
        }
    }

    console.log(deleteLabels);
    await didb.runAsync(deleteLabels);

    console.log(deleteVal);
    await didb.runAsync(deleteVal);

    didb.close(function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("didb closed successfully");
            res.send({ Success: "Yes" });
        }
    });
});

api.post("/bootstrap", async (req, res) => {
    console.log("bootstrap-run");
    var project_name = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        darknet_path = req.body.darknet_path,
        run_number = req.body.run_number,
        upload_images = req.files.upload_images,
        IDX = parseInt(req.body.IDX);

    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + project_name, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        logs_path = training_path + "/logs",
        merge_path = project_path + "/merge/",
        merge_images = merge_path + "images/",
        yolo_script = public_path + "controllers/training/bootstrap.py",
        run_path = logs_path + run_number;

    console.log("merge_path: ", merge_path);
    console.log("merge_images: ", merge_images);

    if (fs.existsSync(merge_path)) {
        rimraf(merge_path, (err) => {
            if (err) {
                console.log(err);
            } else {
                fs.mkdir(merge_path, function (error) {
                    if (error) {
                        // res.send({"Success": "No"});
                        console.error(error);
                        // res.send({"Success": "No"});
                        return res.send("ERROR! " + error);
                    } else {
                        fs.mkdir(merge_images, function (error) {
                            if (error) {
                                // res.send({"Success": "No"});
                                console.error(error);
                                // res.send({"Success": "No"});
                                return res.send("ERROR! " + error);
                            }
                        });
                    }
                });
            }
        });
    } else {
        // create temp merge folders
        fs.mkdir(merge_path, function (err) {
            if (err) {
                // res.send({"Success": "No"});
                console.error(err);
                // res.send({"Success": "No"});
                return res.send("ERROR! " + err);
            } else {
                fs.mkdir(merge_images, function (err) {
                    if (err) {
                        // res.send({"Success": "No"});
                        console.error(err);
                        // res.send({"Success": "No"});
                        return res.send("ERROR! " + err);
                    }
                });
            }
        });
    }

    // connect to current project database
    var aidb = new sqlite3.Database(
        project_path + "/" + project_name + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to aidb.");
        },
    );
    aidb.getAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.get(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    //reject(err);
                    aidb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("aidb closed");
                        }
                    });
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
            // res.send({"Success": "No"})
            return res.send("ERROR! " + err);
        });
    };
    aidb.allAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.all(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    //reject(err);
                    aidb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("aidb closed");
                        }
                    });
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
            // res.send({"Success": "No"})
            return res.send("ERROR! " + err);
        });
    };
    aidb.runAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.run(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    aidb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("aidb closed");
                        }
                    });
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
            // res.send({"Success": "No"})
            return res.send("ERROR! " + err);
        });
    };

    var newImages = [];
    var bootstrapString = "";

    var zip_path = project_path + "/" + upload_images.name; // $LABELING_TOOL_PATH/public/projects/{project_name}/{zip_file_name}
    await upload_images.mv(zip_path);

    console.log(`zip_path: ${zip_path}`);
    var zip = new StreamZip({ file: zip_path });

    zip.on("error", (err) => {
        console.log(err);
        return res.send("ERROR! " + err);
    });
    zip.on("ready", async () => {
        console.log(zip_path);
        zip.extract(null, merge_images, async (err, count) => {
            console.log(
                err ? `Extract error: ${err}` : `Extracted ${count} entries`,
            );
            zip.close();
            rimraf(zip_path, (err) => {
                if (err) {
                    console.log(err);
                    // res.send({"Success": "could not remove zip file"});
                    return res.send("ERROR! " + err);
                }
            });
            console.log("images_path: ", images_path);
            console.log("merge_images: ", merge_images);
            files = await readdirAsync(images_path);
            newfiles = await readdirAsync(merge_images);
            console.log("Found ", newfiles.length, " files");

            for (var i = 0; i < newfiles.length; i++) {
                // console.log(newfiles[i]);

                // //supposed to clean filenames, Remove trailing and leading spaces and swap 0s and +s with _.
                var temp = merge_images + "/" + newfiles[i];
                newfiles[i] = newfiles[i].trim();
                newfiles[i] = newfiles[i].split(" ").join("_");
                newfiles[i] = newfiles[i].split("+").join("_");
                fs.rename(temp, merge_images + "/" + newfiles[i], () => {});
                if (newfiles[i] == "__MACOSX") {
                    continue;
                } else if (!files.includes(newfiles[i])) {
                    fs.rename(
                        merge_images + "/" + newfiles[i],
                        images_path + "/" + newfiles[i],
                        function (err) {
                            if (err) {
                                // res.send({"Success": "could not move new images"});
                                console.error(err);
                                return res.send("ERROR! " + err);
                            }
                            // console.log("new file moved");
                        },
                    );
                    await aidb.runAsync(
                        "INSERT INTO Images (IName, reviewImage, validateImage) VALUES ('" +
                            newfiles[i] +
                            "', '" +
                            0 +
                            "', '" +
                            1 +
                            "')",
                    );
                    newImages.push(newfiles[i]);
                    bootstrapString += newfiles[i] + "\n";
                }
            }
            //console.log('here');
            //console.log(newfiles);
            // console.log(run_path + '/' +  run_number + '.txt');
            fs.writeFileSync(
                training_path + "/images_to_bootstrap.txt",
                bootstrapString,
                (err) => {
                    if (err) throw err;
                },
            );
            //close project database
            aidb.close(function (err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("aidb closed successfully");
                }
            });

            //rimraf.sync(merge_path);
            rimraf(merge_path, (err) => {
                if (err) {
                    console.log(err);
                }
            });
            // res.send({"Success": "Yes"});
            // res.send("Images sucessfully added")
        });
    });

    // CALL BOOTSTRAP SCRIPT
    //////////////////////////////////////////// Call Ashwin's script here//////////////////////////////////////////////////////////////////
    console.log("Calling Darknet");
    console.log(darknet_path);
    console.log(run_path);
    // Pass in python path, script, and options
    // project = `${Admin}-${project_name}`
    // abs_darknet_project_path = path.join(darknet_path, project)
    // abs_darknet_images_path = path.join(abs_darknet_project_path, 'images');
    // darknet_project_run = path.join(project, run_number)
    // weight_path = darknet_project_run + '/' + 'obj_last.weights'

    // var cmd = `python3 ${yolo_script} -r ${darknet_path}/${darknet_project_run} -i ${training_path + '/images_to_bootstrap.txt'} -p ${training_path} -y ${darknet_path} -w ${weight_path}`
    // var success = ""
    // var error = '';
    // console.log(cmd)

    // //change directory to darknet
    // process.chdir(darknet_path);
    // var child = exec(cmd, (err, stdout, stderr) => {
    // 	if (err){
    // 		console.log(`This is the error: ${err.message}`);
    // 		success = err.message;
    // 		fs.writeFile(`${run_path}/${err_file}`, success, (err) => {
    // 			if (err) throw err;
    // 		});
    // 	}
    // 	else if (stderr) {
    // 		console.log(`This is the stderr: ${stderr}`);
    // 		fs.writeFile(`${run_path}/${err_file}`, stderr, (err) => {
    // 			if (err) throw err;
    // 		});
    // 		//return;
    // 	}
    // 	console.log("stdout: ", stdout)
    // 	console.log("stderr: ", stderr)
    // 	console.log("err: ", err)
    // 	console.log("The script has finished running");
    // 	fs.writeFile(`${run_path}/done.log`, success, (err) => {
    // 		if (err) throw err;
    // 	});
    // });

    res.send({ Success: "Yes" });
});

api.post("/changeValidation", async (req, res) => {
    var PName = req.body.PName;
    var admin = req.body.Admin;
    var status = req.body.validMode;

    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/",
        project_path = main_path + admin + "-" + PName,
        images_path = project_path + "/images/";

    var rmdb = new sqlite3.Database(
        project_path + "/" + PName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to rmdb.");
        },
    );

    rmdb.runAsync = function (sql) {
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

    if (status == 0) {
        await db.runAsync(
            "UPDATE Projects SET Validate = '" +
                Number(1) +
                "' WHERE PName = '" +
                PName +
                "' AND Admin ='" +
                admin +
                "'",
        );
        await rmdb.runAsync("UPDATE Images SET reviewImage = 1");
        console.log("Enabled Validation mode for: " + admin + "-" + PName);

        rmdb.close(function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log("rmdb closed successfully");
            }
        });

        res.send({ Success: "Yes" });
    } else if (status == 1) {
        await db.runAsync(
            "UPDATE Projects SET Validate = '" +
                Number(0) +
                "' WHERE PName = '" +
                PName +
                "' AND Admin ='" +
                admin +
                "'",
        );
        await rmdb.runAsync("UPDATE Images SET reviewImage = 0");
        console.log("Disabled Validation mode for: " + admin + "-" + PName);

        rmdb.close(function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log("rmdb closed successfully");
            }
        });

        res.send({ Success: "Yes" });
    } else {
        rmdb.close(function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log("rmdb closed successfully");
            }
        });

        res.send({ Success: "No" });
    }
});

api.put("", async (req, res) => {});

api.put("/api/switchLabels", async (req, res) => {
    try {
        const { selectedLabels, selectedClass, currentClass, Admin, PName } =
            req.body;

        const public_path = __dirname.replace("routes", ""),
            main_path = public_path + "public/projects/",
            project_path = main_path + Admin + "-" + PName;

        const dbPath = project_path + "/" + PName + ".db";

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.log("hello");
                console.error(err.message);
                return res.status(500).send("Database connection error");
            }
            console.log(`Connected to ${PName} database`);
        });

        const updateLabels = `UPDATE Labels SET CName = ? WHERE CName = ? AND LID IN (${selectedLabels})`;

        db.run(updateLabels, [selectedClass, currentClass], function (err) {
            if (err) {
                console.error("Error updating Labels:", err.message);
                return res.status(500).send("Error updating Labels");
            }
            console.log(`Labels switched successfully`);
            return res.json({
                message: "Labels switched successfully",
                body: req.body,
            });
        });
        db.close((err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("Database connection closed");
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

api.delete("/deleteBadLabels/:Admin/:PName/:Lid", async (req, res) => {
    try {
        const Admin = req.params.Admin;
        const PName = req.params.PName;
        const Lid = req.params.Lid.split(",");

        console.log("Admin: ", Admin);
        console.log("PName: ", PName);
        console.log("Lid: ", Lid);

        const public_path = __dirname.replace("routes", ""),
            main_path = public_path + "public/projects/",
            project_path = main_path + Admin + "-" + PName;

        const dbPath = project_path + "/" + PName + ".db";

        console.log("this is the dbPath: ", dbPath);

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send("Database connection error");
            }
            console.log(`Connected to ${PName} database`);
        });

        console.log("Lid:", Lid);
        const placeholders = Lid.map(() => "?").join(",");
        console.log("placeholders", placeholders);
        const sql = `DELETE FROM Labels WHERE LID IN (${placeholders})`;

        db.run(sql, Lid, function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).send("Internal server error");
            }
            if (this.changes === 0) {
                return res.status(404).send("Product not found");
            }

            console.log(`Deleted entry with ID: ${Lid}`);
            return res.status(200).json({
                message: `This transaction was deleted for ID: ${Lid}`,
            });
        });

        db.close((err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("Database connection closed");
            }
        });
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
});

api.post("/batch-change-class", async (req, res) => {
    console.log("Batch Change Class");
    var project_name = req.body.PName,
        admin = req.body.Admin,
        class1 = req.body.class1,
        class2 = req.body.class2;

    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + admin + "-" + project_name; // $LABELING_TOOL_PATH/public/projects/project_name

    var aidb = new sqlite3.Database(
        project_path + "/" + project_name + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to aidb.");
        },
    );
    aidb.getAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.get(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    //reject(err);
                    aidb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("aidb closed");
                        }
                    });
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
            // res.send({"Success": "No"})
            return res.send("ERROR! " + err);
        });
    };
    aidb.allAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.all(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    //reject(err);
                    aidb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("aidb closed");
                        }
                    });
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
            // res.send({"Success": "No"})
            return res.send("ERROR! " + err);
        });
    };
    aidb.runAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.run(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    aidb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("aidb closed");
                        }
                    });
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
            // res.send({"Success": "No"})
            return res.send("ERROR! " + err);
        });
    };

    await aidb.runAsync(
        "UPDATE Labels SET CName = '" +
            class2 +
            "' WHERE CName ='" +
            class1 +
            "'",
    );
    await aidb.runAsync(
        "UPDATE Validation SET CName = '" +
            class2 +
            "' WHERE CName ='" +
            class1 +
            "'",
    );
    res.send({ Success: "Yes" });
});

api.post("/solo-change-class", async (req, res) => {
    var LID = parseInt(req.body.LID),
        selectedClass = req.body.selectedClass,
        project_name = req.body.PName,
        admin = req.body.Admin;

    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + admin + "-" + project_name; // $LABELING_TOOL_PATH/public/projects/project_name

    var aidb = new sqlite3.Database(
        project_path + "/" + project_name + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to aidb.");
        },
    );
    aidb.getAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.get(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    //reject(err);
                    aidb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("aidb closed");
                        }
                    });
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
            // res.send({"Success": "No"})
            return res.send("ERROR! " + err);
        });
    };
    aidb.allAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.all(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    //reject(err);
                    aidb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("aidb closed");
                        }
                    });
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
            // res.send({"Success": "No"})
            return res.send("ERROR! " + err);
        });
    };
    aidb.runAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.run(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    aidb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("aidb closed");
                        }
                    });
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
            // res.send({"Success": "No"})
            return res.send("ERROR! " + err);
        });
    };

    await aidb.runAsync(
        "UPDATE Labels SET CName = '" +
            selectedClass +
            "' WHERE LID =' " +
            LID +
            "'",
    );
    await aidb.runAsync(
        "UPDATE Validation SET CName = '" +
            selectedClass +
            "' WHERE LID =' " +
            LID +
            "'",
    );
    res.send({ Success: "Yes" });
});
