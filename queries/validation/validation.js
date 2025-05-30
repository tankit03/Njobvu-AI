module.exports = {
    project: {
        getAllValidations: async function (projectPath) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "SELECT * FROM Validations";
                const result = await db.all(query);

                return result;
            } catch (err) {
                return err;
            }
        },
        getAllValidationsForImage: async function (projectPath, imageName) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "SELECT * FROM Validations WHERE IName = ?";
                const result = await db.all(query, [imageName]);

                return result;
            } catch (err) {
                return err;
            }
        },
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
        updateValidationImageName: async function (
            projectPath,
            oldName,
            newName,
        ) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "UPDATE Validation SET IName = ? WHERE IName = ?";
                const result = await db.run(query, [newName, oldName]);

                return result;
            } catch (err) {
                return err;
            }
        },
        updateValidationClassName: async function (
            projectPath,
            oldName,
            newName,
        ) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "UPDATE Validation SET CName = ? WHERE CName = ?";
                const result = await db.run(query, [newName, oldName]);

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
        deleteAllValidations: async function (projectPath) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "DELETE FROM Validation";
                const result = await db.run(query);

                return result;
            } catch (err) {
                return err;
            }
        },
        deleteAllValidationsForImage: async function (projectPath, imageName) {
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
