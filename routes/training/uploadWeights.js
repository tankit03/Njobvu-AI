async function uploadWeights(req, res) {
    var PName = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        weightsFile = req.files.upload_weights;

    var publicPath = currentPath,
        mainPath = publicPath + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        projectPath = mainPath + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        imagesPath = projectPath + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloadsPath = mainPath + user + "_Downloads",
        trainingPath = projectPath + "/training",
        logsPath = trainingPath + "/logs",
        weightsPath = trainingPath + "/weights/",
        weightsFilePath = weightsPath + weightsFile.name;

    const allowedExtensions = ["h5", "weights", "pt", "pipe", "conf", "habry"];
    const fileExtension = weightsFile.name.split(".").pop().toLowerCase();

    if (!allowedExtensions.includes(fileExtension)) {
        res.send({
            Success: "ERROR: Wrong filetype. Must be type .h5, .weights, .pt, .pipe, .conf, or .habry",
        });
    } else {
        // move python file and check of python path exists
        await weightsFile.mv(weightsFilePath);

        // create trainging path if does not exist
        if (!fs.existsSync(trainingPath)) {
            fs.mkdir(trainingPath, (error) => {
                if (error) {
                    global.logger.debug(errror);
                }
            });
        }
        res.send({ Success: "Your script has been uploaded and saved" });
    }
}

module.exports = uploadWeights;
