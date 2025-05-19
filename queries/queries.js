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
                const result = await global.managedDbClient.get(query);

                return result;
            } catch (err) {
                return err;
            }
        },
    },
    project: {},
};
