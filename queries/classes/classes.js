module.exports = {
    managed: {},
    project: {
        getAllClasses: async function (projectPath) {
            try {
                console.log(global.projectDbClients);
                const db = global.projectDbClients[projectPath];
                const query = "SELECT * FROM Classes";
                const result = await db.all(query);

                return result;
            } catch (err) {
                return err;
            }
        },
        createClass: async function (projectPath, value) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "INSERT INTO Classes (CName) VALUES (?)";
                const result = await db.run(query, value);

                return result;
            } catch (err) {
                return err;
            }
        },
    },
};
