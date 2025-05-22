module.exports = {
    managed: {
        deleteAccessFromProject: async function (username, projectName) {
            try {
                const query =
                    "DELETE FROM Access WHERE Username = ? AND PName = ?";
                const result = await global.managedDbClient.run(query, [
                    username,
                    projectName,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        deleteAllUserAccess: async function (username) {
            try {
                const query = "DELETE FROM Access WHERE Username = ?";
                const result = await global.managedDbClient.run(query, [
                    username,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        deleteAllAdminAccess: async function (username) {
            try {
                const query = "DELETE FROM Access WHERE Admin = ?";
                const result = await global.managedDbClient.run(query, [
                    username,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        changeAllAccessForUsername: async function (
            currentUsername,
            newUsername,
        ) {
            try {
                const query =
                    "UPDATE Access SET Username = ? WHERE Username = ?";
                const result = await global.managedDbClient.run(query, [
                    currentUsername,
                    newUsername,
                ]);

                return result;
            } catch (err) {
                return err;
            }
        },
        changeAllAccessAdminForUsername: async function (
            currentUsername,
            newUsername,
        ) {
            try {
                const query = "UPDATE Access SET Admin = ? WHERE Admin = ?";
                const result = await global.managedDbClient.run(query, [
                    currentUsername,
                    newUsername,
                ]);
            } catch (err) {
                return err;
            }
        },
    },
};
