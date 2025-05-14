async function updateClass(req, res) {
    console.log("Request body:", req.body);

    const className = req.body.currentClassName;
    const updateClassName = req.body.updatedValue;
    //update Class name

    var IDX = parseInt(req.body.IDX),
        PName = req.body.PName,
        admin = req.body.Admin,
        user = req.cookies.Username;

    var public_path = __dirname.replace("routes", "").replace("training", ""),
        main_path = public_path + "public/projects/",
        project_path = main_path + user + "-" + PName;

    // console.log("project_path: ", project_path);
    // console.log("Current Class Name:", className);
    // console.log("Updated Class Name:", updateClassName);

    var db = new sqlite3.Database(project_path + "/" + PName + ".db", (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log("Connected to db.");
    });

    const updateLabels = `UPDATE Labels SET CName = ? WHERE CName = ?`;
    const updateValidation = `UPDATE Validation SET CName = ? WHERE CName = ?`;
    const updateClasses = `UPDATE Classes SET CName = ? WHERE CName = ?`;

    db.run(updateLabels, [updateClassName, className], function (err) {
        if (err) {
            console.error("Error updating Labels:", err.message);
            return res.status(500).send("Error updating Labels");
        }
        db.run(updateValidation, [updateClassName, className], function (err) {
            if (err) {
                console.error("Error updating Validation:", err.message);
                return res.status(500).send("Error updating Validation");
            }
            db.run(updateClasses, [updateClassName, className], function (err) {
                if (err) {
                    console.error("Error updating Classes:", err.message);
                    return res.status(500).send("Error updating Classes");
                }
                res.status(200).send("Class name updated successfully.");
            });
        });
    });
}

module.exports = updateClass;
