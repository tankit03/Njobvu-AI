module.exports = {
    project: {
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
    },
};
