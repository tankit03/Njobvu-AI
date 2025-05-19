const fs = require("fs");
const queries = require("../../queries/queries");

async function signup(req, res) {
    var firstName = req.body.Fname,
        lastName = req.body.Lname,
        email = req.body.email,
        username = req.body.username,
        password = req.body.password;

    try {
        const userExists = await queries.managed.checkUserExists(username);

        if (userExists.row.ExistingUsers > 0) {
            res.status(409).send("User with that username already exists");
            return;
        }
    } catch (err) {
        console.error(err);
        res.status(500).send("Error signing up");
        return;
    }

    let error = null;

    bcrypt.hash(password, 10, async function (err, hash) {
        if (err) {
            console.error(err);
        } else {
            try {
                await queries.managed.createUser(
                    username,
                    hash,
                    firstName,
                    lastName,
                    email,
                );
            } catch (err) {
                console.error(err);
                res.status(500).send("Error creating user");
                error = err;
            }
        }
    });

    if (error !== null) {
        return;
    }

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

    return res.redirect("/");
}

module.exports = signup;
