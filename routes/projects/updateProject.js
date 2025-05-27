const queries = require("../../queries/queries");

async function updateProject(req, res) {
    var admin;
    admin = req.body.Admin;
    const { PName, IDX, project_name, project_description } = req.body;

    var public_path = currentPath,
        main_path = public_path + "public/projects/",
        project_path = main_path + admin + "-" + PName;

    var db = new sqlite3.Database(project_path + "/" + PName + ".db", (err) => {
        console.log(db);
        if (err) {
            return console.error(err.message);
        }
        console.log("Connected to db.");
    });

    try {
        await queries.managed.updateProjectName(project_name, PName, admin);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error transferring admin");
    }
}

module.exports = updateProject;
