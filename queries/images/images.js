module.exports = {
    project: {
        getAllImages: async function (projectPath) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "SELECT * FROM Images";
                const result = await db.all(query);

                return result;
            } catch (err) {
                return err;
            }
        },
        updateImageName: async function (projectPath, oldName, newName) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "UPDATE Images SET IName = ? WHERE IName = ?";
                const result = await db.run(query, [newName, oldName]);

                return result;
            } catch (err) {
                return err;
            }
        },
        deleteImage: async function (projectPath, imageName) {
            try {
                const db = global.projectDbClients[projectPath];
                const query = "DELETE FROM Images WHERE IName = ?";
                const result = await db.run(query, [imageName]);

                return result;
            } catch (err) {
                return err;
            }
        },
    },
};
