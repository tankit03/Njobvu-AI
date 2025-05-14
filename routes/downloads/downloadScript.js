async function downloadScript(req, res) {
    console.log("downloadingScripts");

    // get URL variables
    var PName = req.body.PName,
        admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        // mult = parseInt(req.body.mult),
        user = req.cookies.Username;
    //scripts = req.body["scripts[]"];

    var scripts_arr = [];
    scripts_arr.push(req.body["scripts[]"]);
    var scripts = [];
    scripts = scripts.concat.apply(scripts, scripts_arr).filter(Boolean);

    console.log("scritps: ", scripts);
    // Set paths
    var public_path = process.cwd() + "/".replace("routes", "").replace("downloads", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        python_path = training_path + "/python",
        logs_path = training_path + "/logs";

    // Create zipfile

    var output = fs.createWriteStream(downloads_path + "/scripts.zip");
    var archive = archiver("zip");

    output.on("close", function () {
        console.log(archive.pointer() + " total bytes");
        console.log(
            "archiver has been finalized and the output file descriptor has closed.",
        );
        res.download(downloads_path + "/scripts.zip");
    });
    archive.on("error", function (err) {
        throw err;
    });

    archive.pipe(output);
    for (var i = 0; i < scripts.length; i++) {
        script = `${python_path}/${scripts[i]}`;
        archive.file(script, { name: scripts[i] });
    }
    archive.finalize();
}

module.exports = downloadScript;
