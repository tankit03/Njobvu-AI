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
    },
};
