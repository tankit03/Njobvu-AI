const queries = require("../../queries/queries");
const path = require("path");

async function deleteLabels(req, res) {
    try {
        const Admin = req.params.Admin;
        const PName = req.params.PName;
        const Lid = req.params.Lid.split(",");

        var publicPath = currentPath,
            mainPath = publicPath + "public/projects/",
            projectPath = mainPath + Admin + "-" + PName;

        const placeholders = Lid.map(() => "?").join(",");
        const sql = `DELETE FROM Labels WHERE LID IN (${placeholders})`;

        await queries.project.sql(projectPath, sql);

        return res.status(200).json({
            message: "Deleted labels",
        });
    } catch (error) {
        console.error(error);
        if (!res.headersSent) {
            res.status(500).json({ message: error.message });
        }
    }
}

module.exports = deleteLabels;
