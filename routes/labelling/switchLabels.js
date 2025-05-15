async function switchLabels(req, res) {
    try {
        const { selectedLabels, selectedClass, currentClass, Admin, PName } =
            req.body;

        var public_path = currentPath,
            main_path = public_path + "public/projects/",
            project_path = main_path + Admin + "-" + PName;



        const dbPath = project_path + "/" + PName + ".db";

        console.log("this path:", dbPath);

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.log("hello");
                console.error(err.message);
                return res.status(500).send("Database connection error");
            }
            console.log(`Connected to ${PName} database`);
        });

        const updateLabels = `UPDATE Labels SET CName = ? WHERE CName = ? AND LID IN (${selectedLabels})`;

        db.run(updateLabels, [selectedClass, currentClass], function (err) {
            if (err) {
                console.error("Error updating Labels:", err.message);
                return res.status(500).send("Error updating Labels");
            }
            console.log(`Labels switched successfully`);
            return res.json({
                message: "Labels switched successfully",
                body: req.body,
            });
        });
        db.close((err) => {
            if (err) {
                console.error(err.message);
            } else {
                console.log("Database connection closed");
            }
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = switchLabels;

