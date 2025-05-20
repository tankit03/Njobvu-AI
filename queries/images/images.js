module.exports = {
    project: {
        getAllImages: async function (projectPath) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "SELECT * FROM Images";
                const result = await db.all(query);

                return result;
            } catch (err) {
                console.error(err);
            }
        },
    },
};
