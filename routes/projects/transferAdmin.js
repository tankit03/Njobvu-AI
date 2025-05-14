async function transferAdmin(req, res) {
    console.log("transferAdmin");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username,
        validation = req.body.validation;

    var NewAdmin = req.body.NewAdmin;
    console.log("NewAdmin: ", NewAdmin);
    var results1 = await db.getAsync(
        "SELECT COUNT(*) AS THING FROM Projects WHERE Admin = '" +
            NewAdmin +
            "' AND PName = '" +
            PName +
            "'",
    );
    if (results1.THING != 0) {
        return res.redirect("/config?IDX=" + IDX);
    }
    await db.runAsync("PRAGMA foreign_keys=off");
    await db.runAsync(
        "UPDATE Projects SET Admin = '" +
            NewAdmin +
            "' WHERE Admin = '" +
            user +
            "' AND PName = '" +
            PName +
            "'",
    );
    await db.runAsync(
        "UPDATE Access SET Admin = '" +
            NewAdmin +
            "' WHERE Admin = '" +
            user +
            "' AND PName = '" +
            PName +
            "'",
    );
    await db.runAsync("PRAGMA foreign_keys=on");

    // Change name of project directory to match new admin
    var public_path = process.cwd() + "/".replace("routes", "").replace("projects", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName,
        new_path = main_path + NewAdmin + "-" + PName; // $LABELING_TOOL_PATH/public/projects/project_name

    fs.rename(project_path, new_path, (err) => {
        if (err) {
            throw err;
        }
    });

    if (validation) return res.redirect("/configV?IDX=" + IDX);
    return res.redirect("/config?IDX=" + IDX);
}

module.exports = transferAdmin;
