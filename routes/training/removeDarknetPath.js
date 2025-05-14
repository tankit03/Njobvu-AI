async function removeDarknetPath(req, res) {
    console.log("remove darknet path");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username;

    var remove_paths = req.body["darknet_paths[]"];
    console.log("remove_paths: ", remove_paths);

    var public_path = process.cwd() + "/".replace("routes", "").replace("training", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/Admin-project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/Admin-project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        darknet_path_file = training_path + "/darknetPaths.txt",
        python_path_file = training_path + "/Paths.txt";

    var current_paths_arr = [];
    current_paths_arr.push(
        fs.readFileSync(darknet_path_file, "utf-8").split("\n").filter(Boolean),
    );
    var current_paths = [];
    current_paths = current_paths.concat
        .apply(current_paths, current_paths_arr)
        .filter(Boolean);

    var new_paths = "";

    var darknet_path = new Set();

    for (var i = 0; i < current_paths.length; i++) {
        if (remove_paths.includes(current_paths[i])) {
            darknet_path.add(current_paths[i]);
            continue;
        }
        new_paths = `${new_paths}${current_paths[i]}\n`;
    }

    fs.writeFile(darknet_path_file, new_paths, (err) => {
        if (err) throw err;

        const drknt_temp = darknet_path.values();
        for (var i = 0; i < darknet_path.size; i++) {
            var current_darknet_path = drknt_temp.next().value;
            var darknetFiles = readdirSync(current_darknet_path);
            for (var i = 0; i < darknetFiles.length; i++) {
                if (darknetFiles[i].split("-")[0] == user) {
                    rimraf(
                        current_darknet_path + "/" + darknetFiles[i],
                        (err) => {
                            if (err) {
                                console.error(
                                    "there was an error with the user contents: ",
                                    err,
                                );
                            } else {
                                console.log(
                                    "Darknet user project contents successfuly deleted",
                                );
                            }
                        },
                    );
                }
            }
        }
        return res.redirect("/config?IDX=" + IDX);
    });
}

module.exports = removeDarknetPath;
