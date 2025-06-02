const client = require("../client");

module.exports = {
    managed: {
        updateProjectName: async function (newName, projectName, admin) {
            const query =
                "UPDATE Projects SET PName = ? WHERE PName = ? AND Admin = ?";
            const result = await global.managedDbClient.run(query, [
                newName,
                projectName,
                admin,
            ]);

            return result;
        },
        deleteProject: async function (projectName, username) {
            const query = "DELETE FROM Projects WHERE PName = ? AND Admin = ?";
            const result = await global.managedDbClient.run(query, [
                projectName,
                username,
            ]);

            return result;
        },
        createProject: async function (
            projectName,
            projectDescription,
            autoSave,
            username,
        ) {
            const query =
                "INSERT INTO Projects (PName, PDescription, AutoSave, Admin) VALUES (?, ?, ?, ?)";
            const result = await global.managedDbClient.run(query, [
                projectName,
                projectDescription,
                autoSave,
                username,
            ]);

            return result;
        },
        updateAllProjectsForAdmin: async function (oldUsername, newUsername) {
            const query = "UPDATE Projects SET Admin = ? WHERE Admin = ?";
            const result = await global.managedDbClient.run(query, [
                oldUsername,
                newUsername,
            ]);

            return result;
        },
        deleteAllProjectsForAdmin: async function (username) {
            const query = "DELETE FROM Projects WHERE Admin = ?";
            const result = await global.managedDbClient.run(query, [username]);

            return result;
        },
    },
    project: {
        migrateProjectDb: async function (projectPath) {
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
        },
        addImages: async function (
            projectPath,
            imageName,
            reviewImage,
            validateImage,
        ) {
            const db = global.projectDbClients[projectPath];
            const query =
                "INSERT INTO Images (IName, reviewImage, validateImage) VALUES (?, ?, ?)";
            const results = await db.run(query, [
                imageName,
                reviewImage,
                validateImage,
            ]);

            return results;
        },
    },
};
