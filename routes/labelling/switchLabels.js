const queries = require("../../queries/queries");

async function switchLabels(req, res) {
    try {
        const { selectedLabels, selectedClass, currentClass, Admin, PName } =
            req.body;

        var publicPath = currentPath,
            mainPath = publicPath + "public/projects/",
            projectPath = mainPath + Admin + "-" + PName;

        const sql = `UPDATE Labels SET CName = ? WHERE CName = ? AND LID IN (${selectedLabels})`;

        await queries.project.sql(projectPath, sql);

        return res.json({
            message: "Labels switched successfully",
            body: req.body,
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = switchLabels;
