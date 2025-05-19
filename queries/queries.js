module.exports = {
    managed: {
        getUserProjects: async function (username) {
            try {
                const query = `SELECT * FROM Access WHERE Username = ?`;
                const result = await global.managedDbClient.all(query, [
                    username,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        getUser: async function (username) {
            try {
                const query = "SELECT * FROM Users WHERE Username = ?";
                const result = await global.managedDbClient.get(query, [
                    username,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        createUser: async function (
            username,
            digest,
            firstName,
            lastName,
            email,
        ) {
            try {
                const query =
                    "INSERT INTO Users (Username, Password, FirstName, LastName, Email) VALUES (?, ?, ?, ?, ?)";
                const result = await global.managedDbClient.run(query, [
                    username,
                    digest,
                    firstName,
                    lastName,
                    email,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        checkUserExists: async function (username) {
            try {
                const query =
                    "SELECT COUNT(*) AS ExistingUsers FROM `Users` WHERE Username = ?";
                const result = await global.managedDbClient.get(query, [
                    username,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        checkUserHasProjectAccess: async function (
            username,
            projectName,
            admin,
        ) {
            try {
                const query =
                    "SELECT COUNT(*) AS ExistingAccess FROM Access WHERE Username = ? AND Pname = ? AND Admin = ?";
                const result = await global.managedDbClient.get(query, [
                    username,
                    projectName,
                    admin,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        grantUserAccess: async function (username, projectName, admin) {
            try {
                const query =
                    "INSERT INTO Access (Username, PName, Admin) VALUES(?, ?, ?)";
                const result = await global.managedDbClient.run(query, [
                    username,
                    projectName,
                    admin,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        updateUser: async function (
            username,
            newUserName = null,
            digest = null,
            firstName = null,
            lastName = null,
            email = null,
        ) {
            try {
                const query = `UPDATE users
                SET
                    Username = CASE WHEN ? IS NOT NULL THEN ? ELSE Username END,
                    Password = CASE WHEN ? IS NOT NULL THEN ? ELSE Password END,
                    FirstName = CASE WHEN ? IS NOT NULL THEN ? ELSE FirstName END,
                    LastName = CASE WHEN ? IS NOT NULL THEN ? ELSE LastName END,
                    Email = CASE WHEN ? IS NOT NULL THEN ? ELSE Email END
                WHERE Username = ?;
                `;
                const result = await global.managedDbClient.run(query, [
                    newUserName,
                    newUserName,
                    digest,
                    digest,
                    firstName,
                    firstName,
                    lastName,
                    lastName,
                    email,
                    email,
                    username,
                ]);

                return result;
            } catch (err) {
                console.error(err);
            }
        },
    },
    project: {},
};
