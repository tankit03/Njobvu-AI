const fs = require("fs");
const queries = require("../../queries/queries");

async function login(req, res) {
    var username = req.body.username,
        password = req.body.password;

    var public_path = currentPath;
    var main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        downloads_path = main_path + username + "_Downloads";

    if (!fs.existsSync(downloads_path)) {
        fs.mkdir(downloads_path, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    let user;

    try {
        user = await queries.managed.getUser(username);
    } catch (err) {
        console.error(err);
        res.send({ Success: "No" });
        return;
    }

    if (!user) {
        res.status(404).send({ Success: "No" });
        return;
    }

    if (bcrypt.compareSync(password, user.row.Password)) {
        res.cookie("Username", username, {
            httpOnly: true,
        });
        res.send({ Success: "Yes" });
    } else {
        res.send({ Success: "No" });
    }
}

module.exports = login;
