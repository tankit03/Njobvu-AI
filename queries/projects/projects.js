const client = require("../client");

module.exports = {
    managed: {
        deleteProject: async function (projectName, username) {
            try {
                const query =
                    "DELETE FROM Projects WHERE PName = ? AND Admin = ?";
                const result = await global.managedDbClient.run(query, [
                    projectName,
                    username,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        createProject: async function (
            projectName,
            projectDescription,
            autoSave,
            username,
        ) {
            try {
                const query =
                    "INSERT INTO Projects (PName, PDescription, AutoSave, Admin) VALUES (?, ?, ?, ?)";
                const result = await global.managedDbClient.run(query, [
                    projectName,
                    projectDescription,
                    autoSave,
                    username,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        updateAllProjectsForAdmin: async function (oldUsername, newUsername) {
            try {
                const query = "UPDATE Projects SET Admin = ? WHERE Admin = ?";
                const result = await global.managedDbClient.run(query, [
                    oldUsername,
                    newUsername,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        deleteAllProjectsForAdmin: async function (username) {
            try {
                const query = "DELETE FROM Projects WHERE Admin = ?";
                const result = await global.managedDbClient.run(query, [
                    username,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
    },
    project: {
        migrateProjectDb: async function (projectPath) {
            try {
                const db = global.projectDbClients[projectPath];
                await db.run(
                    "CREATE TABLE Classes (CName VARCHAR NOT NULL PRIMARY KEY)",
                );
                await db.run(
                    "CREATE TABLE Images (IName VARCHAR NOT NULL PRIMARY KEY, reviewImage INTEGER NOT NULL DEFAULT 0, validateImage INTEGER NOT NULL DEFAULT 0)",
                );
                await db.run(
                    "CREATE TABLE Labels (LID INTEGER PRIMARY KEY, CName VARCHAR NOT NULL, X INTEGER NOT NULL, Y INTEGER NOT NULL, W INTEGER NOT NULL, H INTEGER NOT NULL, IName VARCHAR NOT NULL, FOREIGN KEY(CName) REFERENCES Classes(CName), FOREIGN KEY(IName) REFERENCES Images(IName))",
                );
                await db.run(
                    "CREATE TABLE Validation (Confidence INTEGER NOT NULL, LID INTEGER NOT NULL PRIMARY KEY, CName VARCHAR NOT NULL, IName VARCHAR NOT NULL, FOREIGN KEY(LID) REFERENCES Labels(LID), FOREIGN KEY(IName) REFERENCES Images(IName), FOREIGN KEY(CName) REFERENCES Classes(CName))",
                );
            } catch (err) {
                return err;
            }
        },
        addImages: async function (
            projectPath,
            imageName,
            reviewImage,
            validateImage,
        ) {
            try {
                const db = global.projectDbClients[projectPath];
                const query =
                    "INSERT INTO Images (IName, reviewImage, validateImage) VALUES (?, ?, ?)";
                const results = await db.run(query, [
                    imageName,
                    reviewImage,
                    validateImage,
                ]);

                return results;
            } catch (err) {
                return err;
            }
        },
    },
};
