const access = require("./access/access");
const user = require("./user/user");
const projects = require("./projects/projects");
const classes = require("./classes/classes");
const images = require("./images/images");
const labelling = require("./labelling/labelling");
const validation = require("./validation/validation");

module.exports = {
    managed: {
        ...user.managed,
        ...access.managed,
        ...projects.managed,
    },
    project: {
        ...projects.project,
        ...classes.project,
        ...images.project,
        ...labelling.project,
        ...validation.project,
    },
};
