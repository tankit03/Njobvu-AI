async function deleteRun(req, res) {
    console.log("delete Run");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        IDX = req.body.IDX,
        weights = req.body.weights,
        user = req.cookies.Username,
        run_path = req.body.run_path,
        log_file = req.body.log_file;

    var public_path = __dirname.replace("routes", "").replace("training", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + user + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        logs_path = training_path + "/logs/";

    console.log("run_path: ", run_path);

    rimraf(run_path, function (err) {
        if (err) {
            console.error(err);
        }
        console.log(`${run_path} deleted`);
    });
    return res.redirect("/training?IDX=" + IDX);
}

module.exports = deleteRun;
