module.exports = {
    project: {
        getLabelsForImageName: async function (projectPath, imageName) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "SELECT * FROM Labels WHERE IName = ?";
                const result = await db.all(query, [imageName]);

                return result;
            } catch (err) {
                return err;
            }
        },
        getMaxLabelId: async function (projectPath) {
            try {
                const db = global.projectDbClients[projectPath];
                const query =
                    "SELECT * FROM Labels WHERE LID = (SELECT MAX(LID)  FROM Labels)";
                const result = await db.all(query);

                return result;
            } catch (err) {
                return err;
            }
        },
        getAllLabels: async function (projectPath) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "SELECT * FROM Labels";
                const result = await db.all(query);

                return result;
            } catch (err) {
                return err;
            }
        },
        updateLabelImageName: async function (projectPath, oldName, newName) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "UPDATE Labels SET IName = ? WHERE IName = ?";
                const result = await db.run(query, [newName, oldName]);

                return result;
            } catch (err) {
                return err;
            }
        },
        updateLabelClassName: async function (projectPath, oldName, newName) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "UPDATE Labels SET CName = ? WHERE CName = ?";
                const result = await db.run(query, [newName, oldName]);

                return result;
            } catch (err) {
                return err;
            }
        },
        createLabel: async function (
            projectPath,
            labelId,
            className,
            leftX,
            bottomY,
            labelWidth,
            labelHeight,
            imageName,
        ) {
            try {
                const db = global.projectDbClients[projectPath];
                const query =
                    "INSERT INTO Labels (LID, Cname, X, Y, W, H, IName) VALUES (?, ?, ?, ?, ?, ?, ?)";
                const result = await db.run(query, [
                    labelId,
                    className,
                    leftX,
                    bottomY,
                    labelWidth,
                    labelHeight,
                    imageName,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        deleteLabel: async function (projectPath, imageName) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "DELETE FROM Labels WHERE IName = ?";
                const result = await db.run(query, [imageName]);

                return result;
            } catch (err) {
                return err;
            }
        },
        deleteAllLabels: async function (projectPath) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "DELETE FROM Labels";
                const result = await db.run(query);

                return result;
            } catch (err) {
                return err;
            }
        },
    },
};
