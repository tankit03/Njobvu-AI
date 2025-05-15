async function python(req, res) {
    console.log("new python path");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        python_path = req.body.python_path;

    var public_path = currentPath,
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/Admin-project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/Admin-project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        python_path_file = training_path + "/Paths.txt";

    console.log("python_path: ", python_path);
    console.log("Exists: ", fs.existsSync(python_path));
    if (fs.existsSync(python_path)) {
        fs.writeFile(
            python_path_file,
            python_path + "\n",
            { flag: "a" },
            function (err) {
                if (err) {
                    console.log(err);
                }
            },
        );

        res.send({ Success: "Python Path Saved" });
    } else {
        res.send({ Success: `ERROR! ${python_path} is not a valid path` });
    }
}

module.exports = python;
