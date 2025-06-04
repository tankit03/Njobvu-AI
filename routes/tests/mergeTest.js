const StreamZip = require("node-stream-zip");
const rimraf = require("../../public/libraries/rimraf");
const path = require("path");
const { Client } = require("../../queries/client");
const queries = require("../../queries/queries");
const fsPromises = require("fs").promises;

async function mergeTest(req, res) {
    var uploadImages = req.files.upload_project,
        projectName = req.body.PName,
        Admin = req.body.Admin;

    var publicPath = currentPath,
        mainPath = publicPath + "public/projects",
        projectPath = mainPath + "/" + Admin + "-" + projectName,
        currentImagesPath = projectPath + "/images",
        bootstrapPath = projectPath + "/bootstrap",
        trainingPath = projectPath + "/training",
        logPath = trainingPath + "/logs/",
        scriptsPath = trainingPath + "/python/",
        pythonPathFile = trainingPath + "/Paths.txt",
        darknetPathFile = trainingPath + "/darknetPaths.txt",
        mergePath = projectPath + "/merge",
        mergeImages = mergePath + "/images/",
        zipPath = projectPath + "/" + uploadImages.name;

    try {
        if (fs.existsSync(mergePath)) {
            rimraf(mergePath, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    fs.mkdirSync(mergePath);
                }
            });
        } else {
            fs.mkdirSync(mergePath);
        }

        if (fs.existsSync(mergeImages)) {
            rimraf(mergeImages, (err) => {
                if (err) {
                    console.log(err);
                } else {
                    fs.mkdirSync(mergeImages);
                }
            });
        } else {
            fs.mkdirSync(mergeImages);
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error creating merge paths");
    }

    var incomingDB;
    var found = false;

    await uploadImages.mv(zipPath);
    var zip = new StreamZip.async({ file: zipPath });

    zip.on("error", (err) => {
        try {
            fs.unlinkSync(zipPath);

            rimraf(mergePath, (err) => {
                if (err) {
                    console.error("there was an error with contents: ", err);
                } else {
                    console.log("merge_path contents successfuly deleted");
                }
            });
        } catch (err) {
            console.error(err);
        }

        return res.send("ERROR! " + err);
    });

    await zip.extract(null, mergePath);
    await zip.close();

    var newFiles = await readdirAsync(mergePath);

    for (var i = 0; i < newFiles.length; i++) {
        if (newFiles[i].split(".").pop() == "db") {
            found = true;
            incomingDB = newFiles[i];
        }
    }

    if (!found) {
        try {
            await rimraf(mergePath, (err) => {
                if (err) {
                    console.error("there was an error with contents: ", err);
                } else {
                    console.log("merge_path contents successfuly deleted");
                }
            });
        } catch (e) {
            console.error(e);
        }
        return res.send("ERROR! No Database file (.db) found!");
    }

    var mergeRunsPath = `${mergePath}/training/logs/`;

    if (fs.existsSync(mergeRunPath)) {
        var mergeRuns = await readdirAsync(mergeRunsPath);

        for (var i = 0; i < mergeRuns.length; i++) {
            var mergeRunPath = `${mergeRunsPath}${mergeRuns[i]}`;

            if (!fs.lstatSync(mergeRunPath).isDirectory()) {
                continue;
            }

            var mergeLogs = await readdirAsync(mergeRunPath);
            var newRunPath = path.join(logPath, mergeRuns[i]);

            if (fs.existsSync(newRunPath)) {
                continue;
            }

            fs.mkdirSync(newRunPath);

            for (var j = 0; j < mergeLogs.length; j++) {
                var mergeLogPath = path.join(mergeRunPath, mergeLogs[j]);
                var newLogPath = path.join(newRunPath, mergeLogs[j]);
                fs.renameSync(mergeLogPath, newLogPath);
            }
        }
    }

    var mergeBootstrapPath = `${mergePath}/bootstrap/`;

    if (fs.existsSync(mergeBootstrapPath)) {
        var mergeFiles = await readdirAsync(mergeBootstrapPath);

        for (var i = 0; i < mergeFiles.length; i++) {
            var extension = mergeFiles[i].split(".").pop();

            if (
                !["weights", "cfg", "data", "json", "txt"].includes(extension)
            ) {
                continue;
            }

            var mergeFilePath = path.join(mergeBootstrapPath, mergeFiles[i]);

            var curFiles = await readdirAsync(bootstrapPath);
            var mergeFileName = mergeFiles[i];
            var j = 1;

            while (curFiles.includes(mergeFileName)) {
                mergeFileName = `${mergeFiles[i].split(".")[0]}${j}.${extension}`;
            }

            var newFilePath = path.join(bootstrapPath, mergeFileName);

            fs.renameSync(mergeFilePath, newFilePath);
        }
    }

    var mergeScriptsPath = `${mergePath}/training/python/`;

    if (fs.existsSync(mergeScriptsPath)) {
        const mergeScripts = await readdirAsync(mergeScriptsPath);

        for (let i = 0; i < mergeScripts.length; i++) {
            const ext = mergeScripts[i].split(".").pop();
            if (ext !== "py") continue;

            const mergeScriptPath = path.join(
                mergeScriptsPath,
                mergeScripts[i],
            );
            let mergeScriptName = mergeScripts[i];
            let j = 1;

            let curScripts = await readdirAsync(scriptsPath);
            while (curScripts.includes(mergeScriptName)) {
                mergeScriptName = `${mergeScripts[i].split(".")[0]}${j++}.py`;
                curScripts = await readdirAsync(scriptsPath); // update!
            }

            const newScriptPath = path.join(scriptsPath, mergeScriptName);

            try {
                await fsPromises.rename(mergeScriptPath, newScriptPath);
            } catch (err) {
                console.error("Rename error:", err);
            }
        }
    }

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

            fs.appendFile(pythonPathFile, newPaths, (err) => {
                if (err) throw err;
            });
        }
    }

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
                if (darknetCurrentPaths.includes(darknetMergePaths[i])) {
                    continue;
                }

                darknetNewPaths = `${darknetNewPaths}${darknetMergePaths[i]}\n`;
            }

            fs.appendFile(darknetPathFile, darknetNewPaths, (err) => {
                if (err) throw err;
            });
        }
    }

    const newDbPath = path.normalize(mergePath);

    if (!Object.keys(global.projectDbClients).includes(newDbPath)) {
        console.log(incomingDB);
        global.projectDbClients[newDbPath] = new Client(
            mergePath + `/${incomingDB}`,
        );
    }

    let currentDbClasses;
    let toMergeClasses;

    try {
        currentDbClasses = await queries.project.getAllClasses(projectPath);
        toMergeClasses = await queries.project.getAllClasses(newDbPath);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error fetching classes");
    }

    var currentClasses = [];
    for (var i = 0; i < currentDbClasses.rows.length; i++) {
        currentClasses.push(currentDbClasses.rows[i].CName);
    }

    for (var i = 0; i < toMergeClasses.rows.length; i++) {
        var temp = toMergeClasses.rows[i].CName;

        toMergeClasses.rows[i].CName = toMergeClasses.rows[i].CName.trim();

        toMergeClasses.rows[i].CName =
            toMergeClasses.rows[i].CName.split(" ").join("_");

        if (!currentClasses.includes(toMergeClasses.rows[i].CName)) {
            try {
                await queries.project.updateLabelClassName(
                    newDbPath,
                    temp,
                    toMergeClasses.rows[i].CName,
                );

                currentClasses.push(toMergeClasses.rows[i].CName);

                await queries.project.createClass(
                    projectPath,
                    toMergeClasses.rows[i].CName,
                );
            } catch (err) {
                console.error(err);
            }
        }
    }

    let existingImageFiles = await readdirAsync(currentImagesPath);
    let allowedFileTypes = [
        "jpeg",
        "JPEG",
        "jpg",
        "JPG",
        "png",
        "PNG",
        "tiff",
        "TIFF",
    ];

    var incomingImageFiles = await readdirAsync(mergeImages);
    var imageNamesInDb = [];

    let incomingDbImages;
    try {
        incomingDbImages = await queries.project.getAllImages(newDbPath);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error fetching images");
    }

    for (var j = 0; j < incomingDbImages.rows.length; j++) {
        imageNamesInDb.push(incomingDbImages.rows[j].IName);
    }

    for (var j = 0; j < incomingImageFiles.length; j++) {
        var oldimg = incomingImageFiles[j];
        var image = incomingImageFiles[j];

        image = image.trim();
        image = image.split(" ").join("_");
        image = image.split("+").join("_");

        var ext = image.split(".").pop();

        if (mergeImages + incomingImageFiles[j] != mergeImages + image) {
            fs.renameSync(
                mergeImages + incomingImageFiles[j],
                mergeImages + image,
            );
        }

        if (imageNamesInDb.includes(oldimg)) {
            try {
                await queries.project.updateImageName(
                    newDbPath,
                    incomingImageFiles[j],
                    image,
                );
                await queries.project.updateLabelImageName(
                    newDbPath,
                    incomingImageFiles[j],
                    image,
                );
            } catch (err) {
                console.error(err);
                continue;
            }
        } else if (allowedFileTypes.includes(ext)) {
            try {
                await queries.project.addImages(newDbPath, image, 1, 0);
            } catch (err) {
                console.error(err);
                continue;
            }
        }
    }

    let normalizedIncomingImages;
    try {
        normalizedIncomingImages =
            await queries.project.getAllImages(newDbPath);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error fetching images");
    }

    console.log(normalizedIncomingImages.rows);

    for (var i = 0; i < normalizedIncomingImages.rows.length; i++) {
        if (
            !existingImageFiles.includes(normalizedIncomingImages.rows[i].IName)
        ) {
            try {
                fs.renameSync(
                    mergeImages + normalizedIncomingImages.rows[i].IName,
                    currentImagesPath +
                        "/" +
                        normalizedIncomingImages.rows[i].IName,
                );

                await queries.project.addImages(
                    projectPath,
                    normalizedIncomingImages.rows[i].IName,
                    normalizedIncomingImages.rows[i].reviewImage,
                    normalizedIncomingImages.rows[i].validateImage,
                );
            } catch (err) {
                console.error(err);
                continue;
            }

            existingImageFiles.push(normalizedIncomingImages.rows[i].IName);
        } else {
            try {
                await queries.project.updateReviewImage(
                    projectPath,
                    normalizedIncomingImages.rows[i].reviewImage,
                    normalizedIncomingImages.rows[i].IName,
                );
            } catch (err) {
                console.error(err);
                continue;
            }
        }
    }

    let existingLabels;
    try {
        existingLabels = await queries.project.getAllLabels(projectPath);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error fetching labels");
    }

    let newMax;

    if (existingLabels.rows.length == 0) {
        newMax = 1;
    } else {
        const oldMax = await queries.project.getMaxLabelId(projectPath);

        newMax = oldMax.rows[0].LID + 1;
    }

    var currentLabels = [];
    for (var i = 0; i < existingLabels.rows.length; i++) {
        currentLabels.push({
            CName: existingLabels.rows[i].CName,
            X: existingLabels.rows[i].X,
            Y: existingLabels.rows[i].Y,
            W: existingLabels.rows[i].W,
            H: existingLabels.rows[i].H,
            IName: existingLabels.rows[i].IName,
        });
    }

    let incomingLabels;
    let incomingValidations;
    try {
        incomingLabels = await queries.project.getAllLabels(newDbPath);
        incomingValidations =
            await queries.project.getAllValidations(newDbPath);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error fetching incoming labels");
    }

    var newValidations = [];
    for (var i = 0; i < incomingValidations.rows.length; i++) {
        newValidations.push([
            incomingValidations.rows[i].Confidence,
            incomingValidations.rows[i].LID,
            incomingValidations.rows[i].CName,
            incomingValidations.rows[i].IName,
        ]);
    }

    var newLabels = [];

    console.log(incomingLabels.rows, currentLabels);

    for (var i = 0; i < incomingLabels.rows.length; i++) {
        let candidate = {
            CName: incomingLabels.rows[i].CName,
            X: incomingLabels.rows[i].X,
            Y: incomingLabels.rows[i].Y,
            W: incomingLabels.rows[i].W,
            H: incomingLabels.rows[i].H,
            IName: incomingLabels.rows[i].IName,
        };

        let isNew = true;

        for (let j = 0; j < currentLabels.length; j++) {
            if (
                currentLabels[j].CName === candidate.CName &&
                currentLabels[j].X === candidate.X &&
                currentLabels[j].Y === candidate.Y &&
                currentLabels[j].W === candidate.W &&
                currentLabels[j].H === candidate.H &&
                currentLabels[j].IName === candidate.IName
            ) {
                isNew = false;
                break;
            }
        }

        if (!isNew) continue;

        currentLabels.push(candidate);
        newLabels.push(candidate);

        await queries.project.createLabel(
            projectPath,
            Number(newMax),
            candidate.CName,
            Number(candidate.X),
            Number(candidate.Y),
            Number(candidate.W),
            Number(candidate.H),
            candidate.IName,
        );

        for (var v = 0; v < newValidations.length; v++) {
            if (incomingLabels.rows[i].LID == newValidations[v][1]) {
                await queries.project.createValidation(
                    projectPath,
                    newValidations[v][0],
                    Number(newMax),
                    newValidations[v][2],
                    newValidations[v][3],
                );

                break;
            }
        }

        newMax++;
    }

    res.send("Merge successful");
}

module.exports = mergeTest;
