async function yoloInference(req, res) {
    const { exec } = require("child_process");

    var date = Date.now();

    var PName = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        ultralyticsPath = req.body.yolovx_path,
        yolovxPath = req.body.yolovx_path,
        log = `${date}.log`,
        inferenceFile = req.body.inference_file,
        device = req.body.device,
        options = req.body.options,
        weightName = req.body.weights;

    var errFile = `${date}-error.log`;

    var publicPath = currentPath,
        mainPath = publicPath + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        projectPath = mainPath + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        imagesPath = projectPath + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        trainingPath = projectPath + "/training",
        inferencePath = projectPath + "/inference",
        inferenceUploadPath = projectPath + "/inference/uploads/",
        inferenceFilePath = inferenceUploadPath + inferenceFile,
        logsPath = inferencePath + "/logs",
        runPath = `${logsPath}/${date}`,
        classesPath = runPath + "/coco_classes.yaml",
        weightPath = trainingPath + "/weights/" + weightName,
        yoloScript = publicPath + "controllers/inference/datatovalues.py";

    if (!fs.existsSync(logsPath)) {
        fs.mkdirSync(logsPath);
    }

    if (!fs.existsSync(runPath)) {
        fs.mkdirSync(runPath);
    }

    fs.writeFileSync(`${runPath}/${log}`, "");

    ultralyticsCfgScript = runPath + "/datatovalues.py";

    if (!existsSync(ultralyticsCfgScript)) {
        fs.copyFileSync(yoloScript, ultralyticsCfgScript);
    }

    var cnames = [];

    var results1 = await ycdb.allAsync("SELECT * FROM Classes");
    var results2 = await ycdb.allAsync("SELECT * FROM Images");

    for (var i = 0; i < results1.length; i++) {
        cnames.push(results1[i].CName);
    }

    var dictImagesLabels = {};

    for (var i = 0; i < results2.length; i++) {
        var img = fs.readFileSync(`${imagesPath}/${results2[i].IName}`),
            imgData = probe.sync(img),
            imgW = imgData.width,
            imgH = imgData.height;

        var results3 = await ycdb.allAsync(
            "SELECT * FROM Labels WHERE IName = '" + results2[i].IName + "'",
        );

        for (var j = 0; j < results3.length; j++) {
            // x, y, w, h

            var centerX = (results3[j].X + results3[j].W / 2) / imgW;

            var centerY = (results3[j].Y + results3[j].H / 2) / imgH;

            toStringValue =
                cnames.indexOf(results3[j].CName) +
                " " +
                centerX +
                " " +
                centerY +
                " " +
                results3[j].W / imgW +
                " " +
                results3[j].H / imgH +
                "\n";

            if (dictImagesLabels[results2[i].IName] == undefined) {
                dictImagesLabels[results2[i].IName] = toStringValue;
            } else {
                dictImagesLabels[results2[i].IName] += toStringValue;
            }
        }

        if (results3.length == 0) {
            dictImagesLabels[results2[i].IName] = "";
        }
    }

    for (var key in dictImagesLabels) {
        // remove_dot_ext = key.split(".")[0]

        removeDotExt = path.parse(key).name;

        fs.writeFileSync(
            `${imagesPath}/${removeDotExt}.txt`,
            dictImagesLabels[key],
            (err) => {
                if (err) throw err;
            },
        );
    }

    ///////////////////Create symbolic link from ultralytics to run///////////////////////////////

    absUltralyticsProjectPath = runPath;

    absUltralyticsProjectRun = absUltralyticsProjectPath;

    absWeightProjectPath = path.join(
        inferencePath,
        "logs",
        date.toString(),
        weightName,
    );

    if (!fs.existsSync(absWeightProjectPath)) {
        console.log("Create symbolic link from YOLO model file");

        fs.symlink(weightPath, absWeightProjectPath, "file", (err) => {
            if (err) {
                console.log(err);
            } else {
                console.log("Symlink created for YOLO model file");
            }
        });
    }

    // Sully Working Area

    console.log("\n");

    console.log("   yolo_task = ", yolo_task);

    console.log("   yolo_mode = ", yolo_mode);

    console.log(" yoloScript = ", yoloScript);

    console.log("ultraly_path = ", ultralyticsPath);

    console.log(" yolovx_path = ", yolovxPath);

    console.log("   mainPath = ", mainPath);

    console.log("    runPath = ", runPath);

    console.log("    inf_file = ", inferenceFile);

    console.log("inf_fle_path = ", inferenceFilePath);

    console.log("absultraprun = ", absUltralyticsProjectRun);

    console.log(" weightName = ", weightName);

    console.log("\n");

    /////////////////////////////// Call Ashwin's script here /////////////////////////////////////////

    console.log("Calling Ultralytics YOLO python script");

    // Pass in python path, script, and options

    ultralyticsProjectRun = runPath;

    console.log("Calling Ultralytics YOLO python script to do training");

    var cmd = `python3 ${yoloScript} -d ${runPath} -i ${inferenceFilePath} -n ${classesPath} -l ${absUltralyticsProjectRun}/${log} -f ${ultralyticsPath} -w ${weightPath} -D ${device} -o "${options}"`;

    // var cmd = `python3 --version`

    console.log("Calling Ultralytics YOLO python script to do inference");

    var success = "";

    var error = "";

    console.log("Inference Command We Have: " + cmd);

    fs.writeFile(`${absUltralyticsProjectRun}/${log}`, cmd, () => {
        console.log("Failed to Write Python Command to Log File.");

        if (err) throw err;
    });

    var child = exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.log(`This is the error: ${err.message}`);

            if (err.message != "stdout maxBuffer length exceeded") {
                success = err.message;

                fs.writeFile(
                    `${ultralyticsProjectRun}/${errFile}`,
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
                    `${ultralyticsProjectRun}/${errFile}`,
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

        console.log("The YOLO inference script has finished running");

        fs.writeFile(`${runPath}/done.log`, success, (err) => {
            if (err) throw err;
        });
    });

    res.send({ Success: `YOLO Inference Started` });
}

module.exports = yoloInference;
