async function downloadScript(req, res) {
    console.log("downloadingScripts");

    // get URL variables
    var PName = req.body.PName,
        admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        // mult = parseInt(req.body.mult),
        user = req.cookies.Username;
    //scripts = req.body["scripts[]"];

    var scriptsArr = [];
    scriptsArr.push(req.body["scripts[]"]);
    var scripts = [];
    scripts = scripts.concat.apply(scripts, scriptsArr).filter(Boolean);

    console.log("scritps: ", scripts);
    // Set paths
    var publicPath = currentPath,
        mainPath = publicPath + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        projectPath = mainPath + admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        imagesPath = projectPath + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloadsPath = mainPath + user + "_Downloads",
        trainingPath = projectPath + "/training",
        pythonPath = trainingPath + "/python",
        logsPath = trainingPath + "/logs";

    // Create zipfile

    var output = fs.createWriteStream(downloadsPath + "/scripts.zip");
    var archive = archiver("zip");

    output.on("close", function () {
        console.log(archive.pointer() + " total bytes");
        console.log(
            "archiver has been finalized and the output file descriptor has closed.",
        );
        res.download(downloadsPath + "/scripts.zip");
    });
    archive.on("error", function (err) {
        throw err;
    });

    archive.pipe(output);
    for (var i = 0; i < scripts.length; i++) {
        script = `${pythonPath}/${scripts[i]}`;
        archive.file(script, { name: scripts[i] });
    }
    archive.finalize();
}

module.exports = downloadScript;
