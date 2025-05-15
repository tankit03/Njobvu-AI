async function yolovx(req, res) {
    console.log("new yolovx path");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        yolovx_path = req.body.yolovx_path;

    var public_path = currentPath,
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/Admin-project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/Admin-project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        yolovx_path_file = training_path + "/yolovxPaths.txt";

    console.log("yolovx_path: ", yolovx_path);
    console.log("Exists: ", fs.existsSync(yolovx_path));
    if (fs.existsSync(yolovx_path)) {
        fs.writeFile(
            yolovx_path_file,
            yolovx_path + "\n",
            { flag: "a" },
            function (err) {
                if (err) {
                    console.log(err);
                }
            },
        );

        res.send({ Success: "YOLO Path Saved" });
    } else {
        res.send({ Success: `ERROR! ${yolovx_path} is not a valid path` });
    }
}

module.exports = yolovx;
