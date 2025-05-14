async function deleteUser(req, res) {
    console.log("delete user");
    var user = req.cookies.Username;

    var public_path = __dirname.replace("routes", "").replace("user", ""),
        main_path = public_path + "public/projects/";

    var darknet_path = new Set();

    var filesinfolder = readdirSync(main_path);
    // Delete the Files
    for (var i = 0; i < filesinfolder.length; i++) {
        if (
            filesinfolder[i].split("_")[0] == user ||
            filesinfolder[i].split("-")[0] == user
        ) {
            if (filesinfolder[i].split("-")[0] == user) {
                var tempdarknet = fs
                    .readFileSync(
                        main_path +
                            filesinfolder[i] +
                            "/training/darknetPaths.txt",
                        "utf-8",
                    )
                    .split("\n")
                    .join(",")
                    .split(",");
                for (var f = 0; f < tempdarknet.length; f++) {
                    if (tempdarknet[f] != "") {
                        darknet_path.add(tempdarknet[f]);
                    }
                }
            }
            rimraf(main_path + filesinfolder[i], (err) => {
                if (err) {
                    console.error(
                        "there was an error with the user contents: ",
                        err,
                    );
                } else {
                    console.log("User directory contents successfuly deleted");
                }
            });
        }
    }

    //Delete the YOLO Files
    const drknt_temp = darknet_path.values();
    for (var i = 0; i < darknet_path.size; i++) {
        var current_darknet_path = drknt_temp.next().value;
        var darknetFiles = readdirSync(current_darknet_path);
        for (var i = 0; i < darknetFiles.length; i++) {
            if (darknetFiles[i].split("-")[0] == user) {
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
    // Delete from the Database
    db.getAsync("DELETE FROM Access WHERE Admin = '" + user + "'");
    db.getAsync("DELETE FROM Access WHERE Username = '" + user + "'");
    db.getAsync("DELETE FROM Projects WHERE Admin = '" + user + "'");
    db.getAsync("DELETE FROM Users WHERE Username = '" + user + "'");

    res.clearCookie("Username");
    return res.send({ Success: "Yes" });
}

module.exports = deleteUser;
