async function downloadRun(req, res) {
    console.log("downloadRun");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        IDX = req.body.IDX,
        weights = req.body.weights,
        user = req.cookies.Username,
        log_file = req.body.log_file,
        run_path = req.body.run_path;

    var public_path = __dirname.replace("routes", "").replace("training", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + user + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        logs_path = training_path + "/logs/";

    var output = fs.createWriteStream(
        downloads_path + "/" + log_file.substr(0, log_file.length - 4) + ".zip",
    );
    var archive = archiver("zip");

    output.on("close", function () {
        console.log(archive.pointer() + " total bytes");
        console.log(
            "archiver has been finalized and the output file descriptor has closed.",
        );
        res.download(
            downloads_path +
                "/" +
                log_file.substr(0, log_file.length - 4) +
                ".zip",
        );
    });
    archive.on("error", function (err) {
        throw err;
    });

    archive.pipe(output);

    var logs = await readdirAsync(`${run_path}`);

    for (var i = 0; i < logs.length; i++) {
        archive.file(`${run_path}${logs[i]}`, { name: logs[i] });
    }

    archive.finalize();
}

module.exports = downloadRun;
