async function script(req, res) {
    console.log("python");
    var PName = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        python_file = req.files.upload_python;

    var public_path = __dirname.replace("routes", "").replace("projects", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        logs_path = training_path + "/logs",
        python_file_path = training_path + "/python/" + python_file.name;

    console.log(python_file.name[-3]);
    if (python_file.name.split(".").pop() != "py") {
        res.send({ Success: "ERROR: Wrong filetype. Must by type .py" });
    } else {
        // move python file and check of python path exists
        await python_file.mv(python_file_path);
        // console.log(req.files);

        // create trainging path if does not exist
        if (!fs.existsSync(training_path)) {
            fs.mkdir(training_path, (error) => {
                if (error) {
                    console.log(errror);
                }
            });
        }
        res.send({ Success: "Your script has been uploaded and saved" });
    }
}

module.exports = script;
