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
        updateClassName: async function (projectPath, oldName, newName) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "UPDATE Classes SET CName = ? WHERE CName = ?";
                const result = await db.run(query, [newName, oldName]);

                return result;
            } catch (err) {
                return err;
            }
        },
    },
};
