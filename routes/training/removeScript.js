async function removeScript(req, res) {
    var PName = req.body.PName,
        Admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username,
        scripts = req.body["scripts[]"].split(",");

    var public_path = currentPath,
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/Admin-project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/Admin-project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        script_path = training_path + "/python",
        python_path_file = training_path + "/Paths.txt";

    var new_paths = "";
    for (var i = 0; i < scripts.length; i++) {
        script = `${script_path}/${scripts[i]}`;
        fs.unlink(script, (error) => {
            console.log(error);
        });
    }

    return res.redirect("/config?IDX=" + IDX);
}

module.exports = removeScript;
