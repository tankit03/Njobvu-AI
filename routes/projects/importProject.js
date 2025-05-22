const StreamZip = require("node-stream-zip");
const rimraf = require("../../public/libraries/rimraf");
const queries = require("../../queries/queries");

async function importProject(req, res) {
    req.setTimeout(600000);

    var uploadImages = req.files["upload_file"],
        projectName = req.body.projectName,
        username = req.cookies.Username,
        autoSave = 1,
        projectDescription = "none";

    var publicPath = currentPath.replace("projects"),
        mainPath = publicPath + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        projectPath = mainPath + username + "-" + projectName, // $LABELING_TOOL_PATH/public/projects/projectName
        imagesPath = projectPath + "/images", // $LABELING_TOOL_PATH/public/projects/projectName/images
        boostrapPath = projectPath + "/bootstrap", // $LABELING_TOOL_PATH/public/projects/projectName/bootstrap
        downloadsPath = mainPath + username + "_Downloads",
        trainingPath = projectPath + "/training",
        logsPath = trainingPath + "/logs",
        pythonPath = trainingPath + "/python",
        weightsPath = trainingPath + "/weights",
        pythonPathFile = trainingPath + "/Paths.txt",
        darknetPathsFile = trainingPath + "/darknetPaths.txt";

    var names = [];

    let projects;
    try {
        projects = await queries.managed.getUserProjects(username);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error fetching projects");
    }

    for (var i = 0; i < projects.rows.length; i++) {
        names.push(projects[i].PName);
    }

    if (names.includes(projectName)) {
        return res.send({ Success: "That project name already exists" });
    }

    if (!fs.existsSync(mainPath)) {
        fs.mkdirSync(mainPath);
    }

    if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath);
    }

    var zipPath = projectPath + "/" + uploadImages.name; // $LABELING_TOOL_PATH/public/projects/{projectName}/{zip_file_name}
    await uploadImages.mv(zipPath);

    var found = 0;

    var zip = new StreamZip.async({ file: zipPath });

    await zip.extract(null, projectPath);
    await zip.close();

    files = await readdirAsync(projectPath);

    for (var i = 0; i < files.length; i++) {
        if (files[i].substr(-3) == ".db") {
            found = 1;
            var idb = files[i];
            if (idb.substr(0, idb.length - 3) != projectName) {
                fs.rename(
                    `${projectPath}/${idb}`,
                    `${projectPath}/${projectName}.db`,
                    (error) => {
                        if (error) {
                            console.log(error);
                        }
                    },
                );
            }

            try {
                await queries.managed.createProject(
                    projectName,
                    projectDescription,
                    autoSave,
                    username,
                );

                var dbPath = `${projectPath}/${projectName}.db`;
                global.projectDbClients[projectPath] = new Client(dbPath);

                await queries.project.migrateProjectDb(projectPath);
                await queries.managed.grantUserAccess(
                    username,
                    projectName,
                    username,
                );
            } catch (err) {
                console.error(err);
                await res.status(500).send("Error creating project");
            }

            try {
                fs.unlinkSync(zipPath);
            } catch (err) {
                console.error(err);
                return res.status(500).send("Error removing .zip file");
            }

            var images = await readdirAsync(imagesPath);
            var imcount = await imdb.allAsync("SELECT * FROM Images");
            var oldDbImages = [];
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

            for (let j = 0; j < imcount.length; j++) {
                oldDbImages.push(imcount[j].IName);
            }

            for (let j = 0; j < images.length; j++) {
                var oldImg = images[j];
                var image = images[j];
                image = image.trim();
                image = image.split(" ").join("_");
                image = image.split("+").join("_");
                var ext = image.split(".").pop();

                if (image != oldImg) {
                    fs.renameSync(
                        imagesPath + "/" + images[j],
                        imagesPath + "/" + image,
                    );
                }

                if (oldDbImages.includes(oldImg) && image != oldImg) {
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
                    !oldDbImages.includes(oldImg) &&
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

            var classes = await imdb.allAsync("SELECT CName FROM Classes");
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
            var labels = await imdb.allAsync("SELECT * FROM Labels");
            var confidence = await imdb.allAsync("SELECT * FROM Validation");
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
            if (!fs.existsSync(boostrapPath)) {
                console.log("import Project (create folders)");
                fs.mkdirSync(boostrapPath);
            }
            // Check for training related files
            if (!fs.existsSync(trainingPath)) {
                console.log("addProject (create folders)");

                fs.mkdirSync(trainingPath);
                fs.mkdirSync(logsPath);
                fs.mkdirSync(pythonPath);
                fs.mkdirSync(weightsPath);

                fs.writeFile(pythonPathFile, "", function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
                fs.writeFile(darknetPathsFile, "", function (err) {
                    if (err) {
                        console.log(err);
                    }
                });
            } else {
                if (!fs.existsSync(logsPath)) {
                    fs.mkdirSync(logsPath);
                }

                if (!fs.existsSync(pythonPath)) {
                    fs.mkdirSync(pythonPath);
                }

                if (!fs.existsSync(weightsPath)) {
                    fs.mkdirSync(weightsPath);
                }

                if (!fs.existsSync(pythonPathFile)) {
                    fs.writeFile(pythonPathFile, "", function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
                }

                if (!fs.existsSync(darknetPathsFile)) {
                    fs.writeFile(darknetPathsFile, "", function (err) {
                        if (err) {
                            console.log(err);
                        }
                    });
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
        rimraf(projectPath, function (err) {
            if (err) {
                console.error(err);
            }
            console.log("done");
        });
        res.send({ Success: "No .db file found" });
    }
}

module.exports = importProject;
