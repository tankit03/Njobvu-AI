module.exports = {
    managed: {
        getUserProjects: async function (username) {
            const query = `SELECT * FROM Access WHERE Username = ?`;
            const result = await global.managedDbClient.all(query, [username]);

            console.log(result);

            return result;
        },
    },
    project: {},
};
