const fs = require("fs");
const rimraf = require("../../public/libraries/rimraf");

async function deleteProject(req, res) {
    console.log("deleteProject");

    // get url variables
    var PName = req.body.PName,
        admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username;

    // Set paths
    var public_path = currentPath,
        main_path = public_path + "public/projects/";
    project_path = main_path + admin + "-" + PName;

    // Delete the Files
    var darknet_path = new Set();
    var tempdarknet = fs
        .readFileSync(project_path + "/training/darknetPaths.txt", "utf-8")
        .split("\n")
        .join(",")
        .split(",");
    for (var f = 0; f < tempdarknet.length; f++) {
        if (tempdarknet[f] != "") {
            darknet_path.add(tempdarknet[f]);
        }
    }

    //Delete the YOLO Files
    const drknt_temp = darknet_path.values();
    for (var i = 0; i < darknet_path.size; i++) {
        var current_darknet_path = drknt_temp.next().value;
        var darknetFiles = readdirSync(current_darknet_path);
        for (var i = 0; i < darknetFiles.length; i++) {
            if (darknetFiles[i] == admin + "-" + PName) {
                rimraf(current_darknet_path + "/" + darknetFiles[i], (err) => {
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
                });
            }
        }
    }

    rimraf(project_path, function (err) {
        if (err) {
            console.error(err);
        }
        console.log("rimraf done");
    });
    fs.unlink(project_path + "/" + PName + ".db", function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("done");
        }
    });

    await db.runAsync(
        "DELETE FROM Access WHERE PName = '" +
            PName +
            "' AND Admin = '" +
            admin +
            "'",
    );
    await db.runAsync(
        "DELETE FROM Projects WHERE PName = '" +
            PName +
            "' AND Admin = '" +
            admin +
            "'",
    );
    return res.redirect("/home");
}

module.exports = deleteProject;
