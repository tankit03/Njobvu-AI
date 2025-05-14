const fs = require("fs");

async function login(req, res) {
    var username = req.body.username,
        password = req.body.password;

    var public_path = __dirname.replace("routes", "").replace("user", "");
    var main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        downloads_path = main_path + username + "_Downloads";

    if (!fs.existsSync(downloads_path)) {
        fs.mkdir(downloads_path, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    var passwords = await db.allAsync(
        "SELECT Password FROM Users WHERE Username = '" + username + "'",
    );
    var found = 0;
    for (var i = 0; i < passwords.length; i++) {
        if (bcrypt.compareSync(password, passwords[i].Password)) {
            found = 1;
            break;
        }
    }
    if (found > 0) {
        res.cookie("Username", username, {
            httpOnly: true,
        });
        res.send({ Success: "Yes" });
    } else {
        res.send({ Success: "No" });
    }
}

module.exports = login;
