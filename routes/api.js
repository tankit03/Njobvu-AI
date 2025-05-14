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
const deleteUser = require("./user/deleteUser");
const changeFname = require("./user/changeFname");
const changeLname = require("./user/changeLname");
const changeEmail = require("./user/changeEmail");

const createClassification = require("./training/createClassification");
const addClasses = require("./training/addClasses");
const uploadWeights = require("./training/uploadWeights");
const yolovx = require("./training/yolovx");
const uploadPreWeights = require("./training/uploadPreWeights");
const yoloRun = require("./training/yoloRun");
const deleteRun = require("./training/deleteRun");
const python = require("./training/python");
const darknet = require("./training/darknet");
const removePath = require("./training/removePath");
const removeDarknetPath = require("./training/removeDarknetPath");
const removeWeights = require("./training/removeWeights");
const removeScript = require("./training/removeScript");
const run = require("./training/run");
const updateClass = require("./training/updateClass");
const deleteClass = require("./training/deleteClass");

const createProject = require("./projects/createProject");
const updateProject = require("./projects/updateProject");
const deleteProject = require("./projects/deleteProject");
const addImages = require("./projects/addImages");
const deleteImage = require("./projects/deleteImage");
const importProject = require("./projects/importProject");
const mergeLocal = require("./projects/mergeLocal");
const removeAccess = require("./projects/removeAccess");
const transferAdmin = require("./projects/transferAdmin");
const script = require("./projects/script");

const updateLabels = require("./labelling/updateLabels");
const deleteLabels = require("./labelling/deleteLabels");
const switchLabels = require("./labelling/switchLabels");

const downloadDataset = require("./downloads/downloadDataset");
const downloadProject = require("./downloads/downloadProject");
const downloadScript = require("./downloads/downloadScript");
const downloadWeights = require("./downloads/downloadWeights");
const downloadRun = require("./downloads/downloadRun");

const test = require("./tests/test");
const mergeTest = require("./tests/mergeTest");

const changeValidation = require("./validation/changeValidation");
const deleteLabelValidation = require("./validation/deleteValidation");


// USER ROUTES
api.post("/logout", logout);
api.post("/login", login);
api.post("/signup", signup);
api.post("/addUser", addUser);
api.post("/deleteUser", deleteUser);
api.post("/changeFname", changeFname);
api.post("/changeLname", changeLname);
api.post("/changeEmail", changeEmail);

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
api.post("/updateClass", updateClass);
api.post("/deleteClass", deleteClass);

// PROJECT ROUTES
api.post("/createP", createProject);
api.post("/updateProject", updateProject);
api.post("/deleteProject", deleteProject);
api.post("/addImages", addImages);
api.post("deleteImage", deleteImage);
api.post("/import", importProject);
api.post("/mergeLocal", mergeLocal);
api.post("/removeAccess", removeAccess);
api.post("/transferAdmin", transferAdmin);
api.post("/script", script);

// LABELLING ROUTES
api.post("/updateLabels", updateLabels);
api.delete("/deleteBadLabels/:Admin/:PName/:Lid", deleteLabels);
api.put("/api/switchLabels", switchLabels);

// DOWNLOAD ROUTES
api.post("/downloadDataset", downloadDataset);
api.post("/downloadProject", downloadProject);
api.post("/downloadScript", downloadScript);
api.post("/downloadWeights", downloadWeights);
api.post("/downloadRun", downloadRun);

//VALIDATION ROUTES
api.post("/changeValidation", changeValidation);
api.post("/deleteLabelValidation",deleteLabelValidation);



// TEST ROUTES
api.post("/test", test);
api.post("/mergeTest", mergeTest);

api.post("/changeUname", async (req, res) => {
    console.log("changeUname");

    var user = req.cookies.Username,
        UName = req.body.UName;

    var public_path = process.cwd() + "/".replace("routes", ""),
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


api.post("/bootstrap", async (req, res) => {
    console.log("bootstrap-run");
    var project_name = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        darknet_path = req.body.darknet_path,
        run_number = req.body.run_number,
        upload_images = req.files.upload_images,
        IDX = parseInt(req.body.IDX);

    var public_path = process.cwd() + "/".replace("routes", ""),
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



module.exports = api;
