module.exports = {
    project: {
        createValidation: async function (
            projectPath,
            confidence,
            labelID,
            className,
            imageName,
        ) {
            try {
                const db = global.projectDbClients[projectPath];
                const query =
                    "INSERT INTO Validation (Confidence, LID, CName, IName) VALUES (?, ?, ?, ?)";
                const result = await db.run(query, [
                    confidence,
                    Number(labelID),
                    className,
                    imageName,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        deleteValidation: async function (projectPath, imageName) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "DELETE FROM Validation WHERE IName = ?";
                const result = await db.run(query, [imageName]);

                return result;
            } catch (err) {
                return err;
            }
        },
    },
};
