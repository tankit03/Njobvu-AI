async function downloadWeights(req, res) {
    console.log("downloadingWeights");

    // get URL variables
    var PName = req.body.PName,
        admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username;

    var weights_arr = [];
    weights_arr.push(req.body["weights[]"]);
    var weights = [];
    weights = weights.concat.apply(weights, weights_arr).filter(Boolean);
    console.log("weights: ", weights);

    // Set paths
    var public_path = __dirname.replace("routes", "").replace("downloads", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        //downloads_path = project_path + '/downloads', // $LABELING_TOOL_PATH/public/projects/project_name/downloads
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        python_path = training_path + "/python",
        logs_path = training_path + "/logs",
        weights_path = training_path + "/weights";

    // Create zipfile

    var output = fs.createWriteStream(downloads_path + "/weights.zip");
    var archive = archiver("zip");

    output.on("close", function () {
        console.log(archive.pointer() + " total bytes");
        console.log(
            "archiver has been finalized and the output file descriptor has closed.",
        );
        res.download(downloads_path + "/weights.zip");
    });
    archive.on("error", function (err) {
        throw err;
    });

    archive.pipe(output);
    for (var i = 0; i < weights.length; i++) {
        var weights_file = weights_path + "/" + weights[i];
        archive.file(weights_file, { name: weights[i] });
    }
    archive.finalize();
}

module.exports = downloadWeights;
