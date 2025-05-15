async function removeWeights(req, res) {
    console.log("remove weights file");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username,
        weights_arr = [];
    weights_arr.push(req.body["weights[]"]);
    weights = [];
    weights = weights.concat.apply(weights, weights_arr).filter(Boolean);

    console.log("remove_weights weights: ", weights);
    console.log("remove_weights weights.length: ", weights.length);

    var public_path = currentPath,
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/Admin-project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/Admin-project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        script_path = training_path + "/python",
        weights_path = training_path + "/weights",
        python_path_file = training_path + "/Paths.txt";

    for (var i = 0; i < weights.length; i++) {
        weight = `${weights_path}/${weights[i]}`;

        fs.unlink(weight, (error) => {
            if (error) {
                console.log(error);
            }
        });
    }

    return res.redirect("/config?IDX=" + IDX);
}

module.exports = removeWeights;
