const queries = require("../../queries/queries");

async function transferAdmin(req, res) {
    var PName = req.body.PName,
        Admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username,
        validation = req.body.validation;

    var NewAdmin = req.body.NewAdmin;

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

    try {
        await queries.managed.sql("PRAGMA foreign_keys=off");
        await queries.managed.sql(
            "UPDATE Projects SET Admin = ? WHERE Admin = ? AND PName = ?",
            [NewAdmin, user, PName],
        );
        await queries.managed.sql(
            "UPDATE Access SET Admin = ? WHERE Admin = ? AND PName = ?",
            [NewAdmin, user, PName],
        );
        await queries.managed.sql("PRAGMA foreign_keys=on");
    } catch (err) {
        console.error(err);
        return res.status(500).send("Erorr transferring admin role");
    }

    var public_path = currentPath,
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName,
        new_path = main_path + NewAdmin + "-" + PName; // $LABELING_TOOL_PATH/public/projects/project_name

    fs.renameSync(project_path, new_path);

    if (validation) return res.redirect("/configV?IDX=" + IDX);
    return res.redirect("/config?IDX=" + IDX);
}

module.exports = transferAdmin;
