const access = require("./access/access");
const user = require("./user/user");
const projects = require("./projects/projects");

module.exports = {
    managed: {
        ...user,
        ...access,
        ...projects,
    },
    project: {},
};
