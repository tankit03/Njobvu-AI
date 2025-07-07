module.exports = {
    project: {
        getImage: async function (projectPath, imageName) {
            const db = global.projectDbClients[projectPath];
            const query = "SELECT * FROM Images WHERE IName = ?";
            const result = await db.get(query, [imageName]);

            return result;
        },
        getImageClassMapping: async function (projectPath) {
            const db = global.projectDbClients[projectPath];
            const query = `
                    SELECT Labels.CName, Labels.X, Labels.Y, Labels.W, Labels.H, Images.IName, Images.reviewImage, Images.validateImage
                    FROM Labels
                    JOIN Images ON Labels.IName = Images.IName`;
            const result = await db.all(query);

            return result;
        },
        updateReviewImage: async function (
            projectPath,
            reviewImage,
            imageName,
        ) {
            const db = global.projectDbClients[projectPath];

            const query = "UPDATE Images SET reviewImage = ? WHERE IName = ?";
            const result = await db.run(query, [reviewImage, imageName]);

            return result;
        },
        getAllImages: async function (projectPath) {
            const db = global.projectDbClients[projectPath];
            const query = "SELECT * FROM Images";
            const result = await db.all(query);

            return result;
        },
        updateImageName: async function (projectPath, oldName, newName) {
            const db = global.projectDbClients[projectPath];
            const query = "UPDATE Images SET IName = ? WHERE IName = ?";
            const result = await db.run(query, [newName, oldName]);

            return result;
        },
        deleteImage: async function (projectPath, imageName) {
            const db = global.projectDbClients[projectPath];
            const query = "DELETE FROM Images WHERE IName = ?";
            const result = await db.run(query, [imageName]);

            return result;
        },
    },
};
