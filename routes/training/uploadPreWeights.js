async function uploadPreWeights(req, res) {
    console.log("upload_pre_weights");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        weights_file = req.files.upload_weights;

    var public_path = currentPath,
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        logs_path = training_path + "/logs",
        weights_path = training_path + "/weights/",
        weights_file_path = weights_path + weights_file.name;

    console.log(weights_file.name.split(".").pop());
    if (
        weights_file.name.split(".").pop() != "137" &&
        weights_file.name.split(".").pop() != "weights" &&
        weights_file.name.split(".").pop() != "pt"
    ) {
        res.send({
            Success:
                "ERROR: Wrong filetype. Must be type .137 or weights or pt",
        });
    } else {
        // move python file and check of python path exists
        await weights_file.mv(weights_file_path);

        // create trainging path if does not exist
        if (!fs.existsSync(training_path)) {
            fs.mkdir(training_path, (error) => {
                if (error) {
                    console.log(errror);
                }
            });
        }
        res.send({ Success: "Your weight file has been uploaded and saved" });
    }
}

module.exports = uploadPreWeights;
