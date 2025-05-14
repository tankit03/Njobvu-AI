async function darknet(req, res) {
    console.log("is this right pages");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        darknet_path = req.body.darknet_path;

    var public_path = __dirname.replace("routes", "").replace("training", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/Admin-project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/Admin-project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        darknet_path_file = training_path + "/darknetPaths.txt";

    console.log("darknet_path: ", darknet_path);
    console.log("Exists: ", fs.existsSync(darknet_path));
    if (fs.existsSync(darknet_path)) {
        fs.writeFile(
            darknet_path_file,
            darknet_path + "\n",
            { flag: "a" },
            function (err) {
                if (err) {
                    console.log(err);
                }
            },
        );

        res.send({ Success: "Darknet Path Saved" });
    } else {
        res.send({ Success: `ERROR! ${darknet_path} is not a valid path` });
    }
}

module.exports = darknet;
