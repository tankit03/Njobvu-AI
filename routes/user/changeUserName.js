<<<<<<< Updated upstream
const {readdirSync } = require("fs");

async function changeUserName(req, res) {
=======
const { readdirSync } = require("fs");
>>>>>>> Stashed changes

async function changeUserName(req, res) {
    console.log("changeUname");

    var user = req.cookies.Username,
        UName = req.body.UName;

    var public_path = currentPath,
        main_path = public_path + "public/projects/",
        download_path = main_path + user + "_Downloads",
        new_download_path = main_path + UName + "_Downloads";

    await db.runAsync(
        "UPDATE Users SET Username = '" +
            UName +
            "' WHERE Username = '" +
            user +
            "'",
    );
    await db.runAsync(
        "UPDATE Access SET Username = '" +
            UName +
            "' WHERE Username = '" +
            user +
            "'",
    );
    await db.runAsync(
        "UPDATE Access SET Admin = '" +
            UName +
            "' WHERE Admin = '" +
            user +
            "'",
    );
    await db.runAsync(
        "UPDATE Projects SET Admin = '" +
            UName +
            "' WHERE Admin = '" +
            user +
            "'",
    );

    fs.rename(download_path, new_download_path, () => {});

    var project_files = readdirSync(main_path);

    for (var f = 0; f < project_files.length; f++) {
        if (project_files[f].split("-")[0] == user) {
            fs.rename(
                main_path + project_files[f],
                main_path + UName + "-" + project_files[f].split("-")[1],
                () => {},
            );
        }
    }

    res.clearCookie("Username");
    res.cookie("Username", UName, {
        httpOnly: true,
    });
    return res.send({ Success: "Yes" });
}

module.exports = changeUserName;

