const fs = require("fs");
const queries = require("../../queries/queries");
const path = require("path");

async function mergeLocal(req, res) {
    var PName = req.body.PName,
        Admin = req.body.Admin,
        PName = String(req.body.PName).trim(),
        username = req.cookies.Username;

    var publicPath = currentPath,
        mainPath = publicPath + "public/projects",
        projectPath = mainPath + "/" + Admin + "-" + PName,
        mdbPath = projectPath + "/" + PName + ".db",
        imagePath = projectPath + "/images",
        trainingPath = projectPath + "/training",
        logPath = trainingPath + "/logs/",
        scriptsPath = trainingPath + "/python/",
        weightsPath = trainingPath + "/weights",
        pythonPathFile = trainingPath + "/Paths.txt",
        darknetPathFile = trainingPath + "/darknetPaths.txt";

    var mergePath = mainPath + "/" + username + "-" + PName,
        mergeDbPath = mergePath + "/" + PName + ".db",
        mergeImages = mergePath + "/images/",
        mergeTraining = mergePath + "/training",
        mergeLog = mergeTraining + "/logs/",
        mergeScriptsPath = mergeTraining + "/python",
        mergeWeightsPath = mergeTraining + "/weights",
        mergePythonFile = mergeTraining + "/Paths.txt",
        mergeDarknetFile = mergeTraining + "/darknetPaths.txt";

    if (fs.existsSync(mergeLog)) {
        let mergeRuns = await readdirAsync(mergeLog);

        for (let i = 0; i < mergeRuns.length; i++) {
            let mergeRunPath = `${mergeLog}${mergeRuns[i]}`;

            if (fs.lstatSync(mergeRunPath).isDirectory()) {
                let mergeLogs = await readdirAsync(mergeRunPath);
                let newRunPath = path.join(logPath, mergeRuns[i]);

                if (!fs.existsSync(newRunPath)) {
                    fs.mkdirSync(newRunPath);

                    for (let j = 0; j < mergeLogs.length; j++) {
                        var mergeLogPath = path.join(
                            mergeRunPath,
                            mergeLogs[j],
                        );

                        var newLogPath = path.join(newRunPath, mergeLogs[j]);

                        try {
                            fs.copyFileSync(mergeLogPath, newLogPath);
                        } catch (err) {
                            console.error(err);
                            return res.status(500).send("Error copying run");
                        }
                    }
                }
            }
        }
    }

    if (!fs.existsSync(mergeScriptsPath)) {
        let mergeScripts = await readdirAsync(mergeScriptsPath);
        for (let i = 0; i < mergeScripts.length; i++) {
            if (mergeScripts[i].split(".").pop() == "py") {
                var mergeScriptPath = path.join(
                    mergeScriptsPath,
                    mergeScripts[i],
                );
                var currentScripts = await readdirAsync(scriptsPath);
                var mergeScriptName = mergeScripts[i];

                while (currentScripts.includes(mergeScriptName)) {
                    mergeScriptName = `${mergeScripts[i].split(".")[0]}1.py`;
                }

                var newScriptPath = path.join(scriptsPath, mergeScriptName);

                try {
                    fs.copyFileSync(mergeScriptPath, newScriptPath);
                } catch (err) {
                    console.error(err);
                    return res.status(500).send("Error merging script");
                }
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

        if (fs.existsSync(mergePythonFile)) {
            var mergePathsArr = [];
            mergePathsArr.push(
                fs
                    .readFileSync(mergePythonFile, "utf-8")
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
                if (err) {
                    console.log(err);
                }
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

        if (fs.existsSync(mergeDarknetFile)) {
            var darknetMergePathsArr = [];
            darknetMergePathsArr.push(
                fs
                    .readFileSync(mergeDarknetFile, "utf-8")
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
                if (err) {
                    console.log(err);
                }
            });
        }
    }

    if (fs.existsSync(mergeWeightsPath)) {
        var mergeWeights = await readdirAsync(mergeWeightsPath);
        for (var i = 0; i < mergeWeights.length; i++) {
            var extension = mergeWeights[i].split(".").pop();
            if (extension == "weights" || Number.isInteger(extension)) {
                var mergeWeightsPath = path.join(
                    mergeWeightsPath,
                    mergeWeights[i],
                );
                var curWeights = await readdirAsync(weightsPath);
                var mergeWeightName = mergeWeights[i];
                var j = 1;
                var t = `${mergeWeights[i].split(".")[0]}${j}.${extension}`;

                while (curWeights.includes(mergeWeightName)) {
                    mergeWeightName = `${mergeWeights[i].split(".")[0]}${j}.py`;
                }
                var newWeightPath = path.join(weightsPath, mergeWeightName);
                fs.copyFile(mergeWeightsPath, newWeightPath, (error) => {
                    if (error) {
                        console.log(error);
                    }
                });
            }
        }
    }

    let classes;
    let toMergeClasses;
    try {
        classes = await queries.project.getAllClasses(projectPath);
        toMergeClasses = await queries.project.getAllClasses(mergePath);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error fetching classes");
    }

    var currentClasses = [];
    for (var i = 0; i < classes.rows.length; i++) {
        currentClasses.push(classes.rows[i].CName);
    }

    for (var i = 0; i < toMergeClasses.rows.length; i++) {
        var temp = toMergeClasses.rows[i].CName;
        toMergeClasses.rows[i].CName = toMergeClasses.rows[i].CName.trim();
        toMergeClasses.rows[i].CName =
            toMergeClasses.rows[i].CName.split(" ").join("_");

        if (!currentClasses.includes(toMergeClasses.rows[i].CName)) {
            try {
                await queries.project.updateLabelClassName(
                    mergePath,
                    temp,
                    toMergeClasses.rows[i].CName,
                );

                await queries.project.createClass(
                    projectPath,
                    toMergeClasses.rows[i].CName,
                );
            } catch (err) {
                console.error(err);
                continue;
            }

            currentClasses.push(toMergeClasses.rows[i].CName);
        }
    }

    var currentDbImages = await readdirAsync(imagePath);

    let toMergeImages;
    try {
        toMergeImages = await queries.project.getAllImages(mergePath);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error fetching images");
    }

    console.log(toMergeImages);
    console.log(currentDbImages);

    for (var i = 0; i < toMergeImages.rows.length; i++) {
        if (!currentDbImages.includes(toMergeImages.rows[i].IName)) {
            try {
                fs.copyFileSync(
                    mergeImages + toMergeImages.rows[i].IName,
                    imagePath + "/" + toMergeImages.rows[i].IName,
                );

                await queries.project.addImages(
                    projectPath,
                    toMergeImages.rows[i].IName,
                    toMergeImages.rows[i].reviewImage,
                    toMergeImages.rows[i].validateImage,
                );
            } catch (err) {
                console.error(err);
                await res.status(500).send("Error merging images");
            }

            currentDbImages.push(toMergeImages.rows[i].IName);
        }
    }

    let currentLabels;
    try {
        currentLabels = await queries.project.getAllLabels(projectPath);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error fetching existing labels");
    }

    console.log(currentLabels);

    let newMax;

    if (currentLabels.rows.length == 0) {
        newMax = 1;
    } else {
        try {
            const oldMax = await queries.project.getMaxLabelId(projectPath);
            newMax = oldMax.rows[0].LID + 1;
        } catch (err) {
            console.error(err);
            return res.status(500).send("Couldn't fetch current maximum label");
        }
    }

    var curLabels = [];
    for (var i = 0; i < currentLabels.rows.length; i++) {
        curLabels.push([
            currentLabels.rows[i].CName,
            currentLabels.rows[i].X,
            currentLabels.rows[i].Y,
            currentLabels.rows[i].W,
            currentLabels.rows[i].H,
            currentLabels.rows[i].IName,
        ]);
    }

    let currentValidations;

    try {
        currentValidations = await queries.project.getAllValidations(mergePath);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error fetching validations");
    }

    var newValids = [];

    for (var i = 0; i < currentValidations.rows.length; i++) {
        newValids.push([
            currentValidations.rows[i].Confidence,
            currentValidations.rows[i].LID,
            currentValidations.rows[i].CName,
            currentValidations.rows[i].IName,
        ]);
    }

    var newLabels = [];
    var newl = 0;
    for (var i = 0; i < currentLabels.rows.length; i++) {
        newLabels.push([
            currentLabels.rows[i].CName,
            currentLabels.rows[i].X,
            currentLabels.rows[i].Y,
            currentLabels.rows[i].W,
            currentLabels.rows[i].H,
            currentLabels.rows[i].IName,
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
                currentLabels.rows[i].CName,
                currentLabels.rows[i].X,
                currentLabels.rows[i].Y,
                currentLabels.rows[i].W,
                currentLabels.rows[i].H,
                currentLabels.rows[i].IName,
            ]);
            try {
                await queries.project.createLabel(
                    projectPath,
                    Number(newMax),
                    currentLabels.rows[i].IName,
                    Number(currentLabels.rows[i].X),
                    Number(currentLabels.rows[i].Y),
                    Number(currentLabels.rows[i].W),
                    Number(currentLabels.rows[i].H),
                    currentLabels.rows[i].CName,
                );
            } catch (err) {
                console.error(err);
                return res.status(500).send("Error inserting labels");
            }

            for (var v = 0; v < newValids.length; v++) {
                if (currentLabels.rows[i].LID == newValids[v][1]) {
                    try {
                        await queries.project.createValidation(
                            projectPath,
                            newValids[v][0],
                            Number(newMax),
                            newValids[v][2],
                            newValids[v][3],
                        );
                    } catch (err) {
                        console.error(err);
                        return res
                            .status(500)
                            .send("Error inserting validations");
                    }
                    break;
                }
            }
            newMax = newMax + 1;
        }
        newl = 0;
    }

    res.send("Merge successful");
}

module.exports = mergeLocal;
