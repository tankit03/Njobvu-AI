async function boostrap(req,res) {

    console.log("bootstrap-run");
        var project_name = req.body.PName,
            Admin = req.body.Admin,
            user = req.cookies.Username,
            darknet_path = req.body.darknet_path,
            run_number = req.body.run_number,
            upload_images = req.files.upload_images,
            IDX = parseInt(req.body.IDX);
    
        var public_path = currentPath,
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
}

module.exports = boostrap;