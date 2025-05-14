async function removePath(req, res) {
    console.log("remove python path");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username;

    var remove_paths_arr = [];
    remove_paths_arr.push(req.body["paths[]"]);
    var remove_paths = [];
    remove_paths = remove_paths.concat
        .apply(remove_paths, remove_paths_arr)
        .filter(Boolean);

    console.log("remove_paths: ", remove_paths);

    var public_path = __dirname.replace("routes", "").replace("training", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/Admin-project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/Admin-project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        python_path_file = training_path + "/Paths.txt";

    var current_paths_arr = [];
    current_paths_arr.push(
        fs.readFileSync(python_path_file, "utf-8").split("\n").filter(Boolean),
    );
    var current_paths = [];
    current_paths = current_paths.concat
        .apply(current_paths, current_paths_arr)
        .filter(Boolean);

    var new_paths = "";
    for (var i = 0; i < current_paths.length; i++) {
        if (remove_paths.includes(current_paths[i])) {
            continue;
        }
        new_paths = `${new_paths}${current_paths[i]}\n`;
    }

    fs.writeFile(python_path_file, new_paths, (err) => {
        if (err) throw err;

        return res.redirect("/config?IDX=" + IDX);
    });
}

module.exports = removePath;
