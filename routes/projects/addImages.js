const { exec } = require("child_process");
const fs = require("fs");
const rimraf = require("../public/libraries/rimraf");
const StreamZip = require("node-stream-zip");

async function addImages(req, res) {
    console.log("addImages");

    var IDX = parseInt(req.body.IDX),
        upload_images = req.files.upload_images,
        project_name = req.body.PName,
        admin = req.body.Admin,
        user = req.cookies.Username;

    console.log("PName: ", project_name);
    var public_path = __dirname.replace("routes", "").replace("projects", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + admin + "-" + project_name, // $LABELING_TOOL_PATH/public/projects/project_name
        merge_path = project_path + "/merge/",
        merge_images = merge_path + "images/",
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloads_path = main_path + user + "_Downloads";

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
                            0 +
                            "')",
                    );
                    newImages.push(newfiles[i]);
                }
            }

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
            return res.send("New Images Added");
        });
    });
}

module.exports = addImages;
