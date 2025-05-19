module.exports = {
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
            const result = await global.managedDbClient.run(query, [username]);

            return result;
        } catch (err) {
            return err;
        }
    },
};
