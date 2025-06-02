async function downloadWeights(req, res) {
    console.log("downloadingWeights");

    // get URL variables
    var PName = req.body.PName,
        admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username;

    var weightsArr = [];
    weightsArr.push(req.body["weights[]"]);
    var weights = [];
    weights = weights.concat.apply(weights, weightsArr).filter(Boolean);
    console.log("weights: ", weights);

    // Set paths
    var publicPath = __dirname.replace("routes", "").replace("downloads", ""),
        mainPath = publicPath + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        projectPath = mainPath + admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        imagesPath = projectPath + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        //downloads_path = project_path + '/downloads', // $LABELING_TOOL_PATH/public/projects/project_name/downloads
        downloadsPath = mainPath + user + "_Downloads",
        trainingPath = projectPath + "/training",
        pythonPath = trainingPath + "/python",
        logsPath = trainingPath + "/logs",
        weightsPath = trainingPath + "/weights";

    // Create zipfile

    var output = fs.createWriteStream(downloadsPath + "/weights.zip");
    var archive = archiver("zip");

    output.on("close", function () {
        console.log(archive.pointer() + " total bytes");
        console.log(
            "archiver has been finalized and the output file descriptor has closed.",
        );
        res.download(downloadsPath + "/weights.zip");
    });
    archive.on("error", function (err) {
        throw err;
    });

    archive.pipe(output);
    for (var i = 0; i < weights.length; i++) {
        var weightsFile = weightsPath + "/" + weights[i];
        archive.file(weightsFile, { name: weights[i] });
    }
    archive.finalize();
}

module.exports = downloadWeights;
