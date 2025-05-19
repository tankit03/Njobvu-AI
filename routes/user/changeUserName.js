const { readdirSync } = require("fs");
const queries = require("../../queries/queries");

async function changeUserName(req, res) {
    var user = req.cookies.Username,
        UName = req.body.UName;

    var public_path = currentPath,
        main_path = public_path + "public/projects/",
        download_path = main_path + user + "_Downloads",
        new_download_path = main_path + UName + "_Downloads";

    try {
        await queries.managed.updateUser(user, UName, null, null, null, null);
        await queries.managed.changeAllAccessForUsername(user, UName);
        await queries.managed.changeAllAccessAdminForUsername(user, UName);
        await queries.managed.updateAllProjectsForAdmin(user, UName);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error updating user");
    }

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
