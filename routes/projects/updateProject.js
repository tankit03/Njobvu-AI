const queries = require("../../queries/queries");

async function updateProject(req, res) {
    var admin;
    admin = req.body.Admin;
    const { PName, IDX, project_name, project_description } = req.body;

    var publicPath = currentPath,
        mainPath = publicPath + "public/projects/",
        projectPath = mainPath + admin + "-" + PName;

    var db = new sqlite3.Database(projectPath + "/" + PName + ".db", (err) => {
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
