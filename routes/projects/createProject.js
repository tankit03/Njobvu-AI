const fs = require("fs");
const { exec } = require("child_process");
const ffmpeg = require("ffmpeg");
const StreamZip = require("node-stream-zip");
const queries = require("../../queries/queries");
const rimraf = require("../../public/libraries/rimraf");
const { Client } = require("../../queries/client");

async function createProject(req, res) {
    var publicPath = currentPath;
    var projectName = req.body["project_name"],
        uploadImages = req.files["upload_images"],
        uploadVideo = req.files["upload_video"],
        uploadBootstrap = req.files["upload_bootstrap"],
        frameRate = req.body["frame_rate"],
        inputClasses = req.body["input_classes"],
        autoSave = 1,
        username = req.cookies.Username,
        projectDescription = "none";

    inputClasses = inputClasses.split(",");

    var mainPath = publicPath + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        projectPath = mainPath + username + "-" + projectName, // $LABELING_TOOL_PATH/public/projects/projectName
        imagesPath = projectPath + "/images", // $LABELING_TOOL_PATH/public/projects/projectName/images
        bootstrapPath = projectPath + "/bootstrap",
        trainingPath = projectPath + "/training",
        logsPath = trainingPath + "/logs",
        weightsPath = trainingPath + "/weights",
        pythonPath = trainingPath + "/python",
        pythonPathFile = trainingPath + "/Paths.txt";
    darknetPathFile = trainingPath + "/darknetPaths.txt";

    if (!fs.existsSync(mainPath)) {
        fs.mkdirSync(mainPath);
    }
    if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath);
        fs.mkdirSync(imagesPath);
        fs.mkdirSync(bootstrapPath);
        fs.mkdirSync(trainingPath);
        fs.mkdirSync(weightsPath);
        fs.mkdirSync(logsPath);
        fs.mkdirSync(pythonPath);

        fs.writeFile(pythonPathFile, "", function (err) {
            if (err) {
                console.log(err);
            }
        });
        fs.writeFile(darknetPathFile, "", function (err) {
            if (err) {
                console.log(err);
            }
        });
    }

    try {
        await queries.managed.createProject(
            projectName,
            projectDescription,
            autoSave,
            username,
        );

        global.projectDbClients[projectPath] = new Client(
            projectPath + `/${projectName}.db`,
        );

        await queries.project.migrateProjectDb(projectPath);
        await queries.managed.grantUserAccess(username, projectName, username);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error creating project");
    }

    try {
        console.log(projectPath);
        const classes = await queries.project.getAllClasses(projectPath);

        console.log(classes);

        const currentClasses = [];
        for (var i = 0; i < classes.rows.length; i++) {
            currentClasses.push(classes.rows[i].CName);
        }

        for (let classValue of inputClasses) {
            if (!currentClasses.includes(classValue)) {
                await queries.project.createClass(projectPath, classValue);
            }
        }
    } catch (err) {
        console.error(err);
        return res.send("Error creating project");
    }

    if (uploadImages) {
        var zipPath = imagesPath + "/" + uploadImages.name; // $LABELING_TOOL_PATH/public/projects/{projectName}/{zip_file_name}

        await uploadImages.mv(zipPath);
        console.log("File Uploaded", uploadImages.name);

        var zip = new StreamZip.async({ file: zipPath });

        try {
            await zip.extract(null, imagesPath);
            await zip.close();

            rimraf(zipPath, (err) => {
                if (err) {
                    console.error(err);
                    res.status(500).send("Error removing zip file");
                }
            });

            files = fs.readdirSync(imagesPath);

            for (var i = 0; i < files.length; i++) {
                if (files[i] == "__MACOSX") {
                    continue;
                }

                if (files[i].endsWith(".zip")) {
                    fs.unlink(imagesPath + "/" + files[i], () => {});
                    continue;
                }

                if (files[i].endsWith(".zip") || files[i] === "blob") {
                    continue;
                }

                var temp = imagesPath + "/" + files[i];

                files[i] = files[i].trim();
                files[i] = files[i].split(" ").join("_");
                files[i] = files[i].split("+").join("_");

                fs.rename(temp, imagesPath + "/" + files[i], () => {});

                try {
                    await queries.project.addImages(
                        projectPath,
                        files[i],
                        0,
                        0,
                    );
                } catch (err) {
                    console.error(err);
                    return await res.status(500).send("Error uploading images");
                }
            }

            if (!uploadBootstrap) res.send("Project creation successful");
        } catch (err) {
            console.error(err);
            return res.status(500).send("Error extracting zip");
        }
    }

    if (uploadVideo) {
        var videoPath = imagesPath + "/" + uploadVideo.name; // $LABELING_TOOL_PATH/public/projects/{projectName}/{zip_file_name}
        frameRate *= 30;

        await uploadVideo.mv(videoPath);

        try {
            const video = await new ffmpeg(videoPath);

            await video.fnExtractFrameToJPG(imagesPath, {
                every_n_frames: frameRate,
            });

            cleanFiles();
        } catch (e) {
            console.log("ERROR " + e);
        }

        async function cleanFiles() {
            let files = fs.readdirSync(imagesPath);

            for (let i = 0; i < files.length; i++) {
                if (files[i] == "__MACOSX") {
                    if (i + 1 == files.length) {
                        res.send("Project creation successful");
                    }
                    continue;
                }

                if (
                    files[i].endsWith(".mp4") ||
                    files[i].endsWith(".avi") ||
                    files[i].endsWith(".mov")
                ) {
                    fs.unlink(imagesPath + "/" + files[i], () => {});
                }

                if (files[i] === "blob") {
                    continue;
                }

                var temp = imagesPath + "/" + files[i];

                files[i] = files[i].trim();
                files[i] = files[i].split(" ").join("_");
                files[i] = files[i].split("+").join("_");

                fs.rename(temp, imagesPath + "/" + files[i], () => {});

                await queries.project.addImages(projectPath, files[i], 0, 0);
            }
        }

        if (!uploadBootstrap) res.send("Project creation successful");
    }

    if (!uploadVideo && !uploadImages) {
        return res.send("ERROR! NO PHOTO ZIP OR VIDEO FILE PROVIDED");
    }

    if (uploadBootstrap !== undefined) {
        var bzipPath = bootstrapPath + "/" + uploadBootstrap.name;
        var outBootstrapJson = "";

        await uploadBootstrap.mv(bzipPath);

        var bzip = new StreamZip.async({ file: bzipPath });

        try {
            let weightBootstrapPath = "",
                cfgBootstrapPath = "",
                dataBootstrapPath = "";

            await bzip.extract(null, bootstrapPath);
            await bzip.close();
            rimraf(bzipPath, (err) => {
                if (err) {
                    console.log(err);
                }
            });

            let bfiles = fs.readdirSync(bootstrapPath);

            for (var i = 0; i < bfiles.length; i++) {
                if (!bfiles[i].endsWith(".zip")) {
                    let temp = bootstrapPath + "/" + bfiles[i];

                    bfiles[i] = bfiles[i].trim();
                    bfiles[i] = bfiles[i].split(" ").join("_");
                    bfiles[i] = bfiles[i].split("+").join("_");

                    fs.rename(temp, bootstrapPath + "/" + bfiles[i], () => {});

                    if (bfiles[i].endsWith(".weights"))
                        weightBootstrapPath = bootstrapPath + "/" + bfiles[i];

                    if (bfiles[i].endsWith(".cfg"))
                        cfgBootstrapPath = bootstrapPath + "/" + bfiles[i];

                    if (bfiles[i].endsWith(".data"))
                        dataBootstrapPath = bootstrapPath + "/" + bfiles[i];
                }

                if (
                    !bfiles[i].endsWith(".weights") &&
                    !bfiles[i].endsWith(".cfg") &&
                    !bfiles[i].endsWith(".data")
                ) {
                    fs.unlink(bootstrapPath + "/" + bfiles[i], () => {});
                }
            }

            imagesToWrite = await readdirAsync(imagesPath);

            let runData = imagesToWrite
                .map((i) => imagesPath + "/" + i)
                .join("\n");

            let runTxtPath = bootstrapPath + "/" + "run.txt";

            fs.writeFileSync(runTxtPath, runData, (err) => {
                if (err) throw err;
            });

            var yoloScript = publicPath + "controllers/training/bootstrap.py";

            outBootstrapJson = bootstrapPath + "/out.json";

            var darknetPath = "/export/darknet";
            var cmd = `python3 ${yoloScript} -d ${dataBootstrapPath} -c ${cfgBootstrapPath} -t ${runTxtPath} -y ${darknetPath} -w ${weightBootstrapPath} -o ${outBootstrapJson}`;

            process.chdir(darknetPath);

            var child = exec(cmd, (err, stdout, stderr) => {
                if (err) {
                    console.log(`This is the error: ${err.message}`);
                } else if (stderr) {
                    console.log(`This is the stderr: ${stderr}`);
                }
            });

            child.on("error", (err) => {
                console.error(`Error occurred: ${err.message}`);
            });

            child.on("exit", (code) => {
                console.log(`Child process exited with code ${code}`);
                applyBootstrapLabels();
            });
        } catch (err) {
            console.error(err);
            return res.status(500).send("Error bootstrapping");
        }

        async function applyBootstrapLabels() {
            let rawLabelBootstrapData = fs.readFileSync(outBootstrapJson);
            let labelBootstrapData = JSON.parse(rawLabelBootstrapData);

            let imageResults;
            let classList;

            try {
                imageResults = await queries.project.getAllImages(projectPath);
                classList = await queries.project.getAllClasses(projectPath);
            } catch (err) {
                console.error(err);
                return res.status(500).send("Failure bootstrapping labels");
            }

            imageResults = imageResults.rows;
            classList = classList.rows;

            var classSet = new Set();

            for (let i = 0; i < classList.length; i++) {
                classSet.add(classList[i].CName);
            }

            var labelID = 0;

            for (let i = 0; i < imageResults.length; i++) {
                var img = fs.readFileSync(
                        `${imagesPath}/${imageResults[i].IName}`,
                    ),
                    imgData = probe.sync(img),
                    imgW = imgData.width,
                    imgH = imgData.height;

                for (let j = 0; j < labelBootstrapData[i].objects.length; j++) {
                    var boostrapObj = labelBootstrapData[i].objects[j];
                    var relativeCoords = boostrapObj.relative_coordinates;

                    var labelWidth = imgW * relativeCoords.width;
                    var labelHeight = imgH * relativeCoords.height;
                    var leftX = relativeCoords.center_x * imgW - labelWidth / 2;
                    var bottomY =
                        relativeCoords.center_y * imgH - labelHeight / 2;
                    var className = boostrapObj.name;
                    var confidence = Math.round(
                        Number(boostrapObj.confidence) * 100,
                    );
                    labelID += 1;

                    if (!classSet.has(className)) {
                        try {
                            await queries.project.createClass(
                                projectPath,
                                className,
                            );
                        } catch (err) {
                            console.error(err);
                            return res
                                .status(500)
                                .send("Error adding class name to project");
                        }
                    }

                    try {
                        await queries.project.createLabel(
                            projectPath,
                            Number(labelID),
                            className,
                            Number(leftX),
                            Number(bottomY),
                            Number(labelWidth),
                            Number(labelHeight),
                            labelHeight,
                        );
                    } catch (err) {
                        console.error(err);
                        res.status(500).send("Error creating labels");
                    }

                    await queries.project.createValidation(
                        projectPath,
                        confidence,
                        labelID,
                        className,
                        imageName,
                    );

                    classSet.add(className);
                }
            }
        }
    }
}

module.exports = createProject;
