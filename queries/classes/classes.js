module.exports = {
    managed: {},
    project: {
        getClassNameForLabel: async function (projectPath, imageName) {
            const db = global.projectDbClients[projectPath];
            const query = "SELECT DISTINCT CName FROM Labels WHERE IName = ?";
            const result = await db.all(query, [imageName]);

            return result;
        },
        getAllClasses: async function (projectPath) {
            const db = global.projectDbClients[projectPath];
            const query = "SELECT * FROM Classes";
            const result = await db.all(query);

            return result;
        },
        createClass: async function (projectPath, value) {
            const db = global.projectDbClients[projectPath];
            const query = "INSERT INTO Classes (CName) VALUES (?)";
            const result = await db.run(query, value);

            return result;
        },
        updateClassName: async function (projectPath, oldName, newName) {
            const db = global.projectDbClients[projectPath];
            const query = "UPDATE Classes SET CName = ? WHERE CName = ?";
            const result = await db.run(query, [newName, oldName]);

            return result;
        },
    },
};
