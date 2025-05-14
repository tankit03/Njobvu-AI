async function updateProject(req, res) {
    var admin;
    admin = req.body.Admin;
    console.log("admin is ", admin);
    const { PName, IDX, project_name, project_description } = req.body;

    console.log("Old Project Name:", PName);
    console.log("New Project Name:", project_name);
    console.log("New Project Description:", project_description);

    var public_path = process.cwd() + "/".replace("routes", "").replace("projects", ""),
        main_path = public_path + "public/projects/",
        project_path = main_path + admin + "-" + PName;

    console.log("Database path:", project_path + "/" + PName + ".db");

    var db = new sqlite3.Database(project_path + "/" + PName + ".db", (err) => {
        console.log(db);
        if (err) {
            return console.error(err.message);
        }
        console.log("Connected to db.");
    });

    const sql = `UPDATE Projects SET PName = ? WHERE PName = ? AND Admin = ?`;
    db.run(sql, [project_name, PName, admin], function (err) {
        if (err) {
            console.error("Error running SQL query:", err.message);
            return res.status(500).send("SQL query error");
        }
        console.log(`Row(s) updated: ${this.changes}`);
        res.status(200).send(`Row(s) updated: ${this.changes}`);
    });
}

module.exports = updateProject;
