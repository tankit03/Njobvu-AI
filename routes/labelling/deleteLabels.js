async function deleteLabels(req, res) {

    try {
        const Admin = req.params.Admin;
        const PName = req.params.PName;
        const Lid = req.params.Lid.split(",");

        console.log("Admin: ", Admin);
        console.log("PName: ", PName);
        console.log("Lid: ", Lid);

        const public_path = __dirname.replace("routes", ""),
            main_path = public_path + "public/projects/",
            project_path = main_path + Admin + "-" + PName;

        const dbPath = project_path + "/" + PName + ".db";

        console.log("this is the dbPath: ", dbPath);

        const db = new sqlite3.Database(dbPath, (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send("Database connection error");
            }
            console.log(`Connected to ${PName} database`);
        });

        console.log("Lid:", Lid);
        const placeholders = Lid.map(() => "?").join(",");
        console.log("placeholders", placeholders);
        const sql = `DELETE FROM Labels WHERE LID IN (${placeholders})`;

        db.run(sql, Lid, function (err) {
            if (err) {
                console.error(err.message);
                return res.status(500).send("Internal server error");
            }
            if (this.changes === 0) {
                return res.status(404).send("Product not found");
            }

            console.log(`Deleted entry with ID: ${Lid}`);
            return res.status(200).json({
                message: `This transaction was deleted for ID: ${Lid}`,
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
        console.error(error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }   
}

module.exports = deleteLabels;