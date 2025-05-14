const fs = require("fs");

async function signup(req, res) {
    var Fname = req.body.Fname,
        Lname = req.body.Lname,
        email = req.body.email,
        username = req.body.username,
        password = req.body.password;

    var results1 = await db.getAsync(
        "SELECT COUNT(*) AS USER FROM `Users` WHERE Username = '" +
            username +
            "'",
    );
    if (results1.USER != 0) {
        return res.redirect("/signup");
    }

    bcrypt.hash(password, 10, async function (err, hash) {
        if (err) {
            console.error(err);
        } else {
            await db.allAsync(
                "INSERT INTO Users (Username, Password, FirstName, LastName, Email) VALUES ('" +
                    username +
                    "', '" +
                    hash +
                    "', '" +
                    Fname +
                    "', '" +
                    Lname +
                    "', '" +
                    email +
                    "')",
            );
        }
    });

    var results3 = await db.getAsync(
        "SELECT COUNT(*) AS DUSER FROM Projects WHERE Admin='ZeroUser'",
    );
    if (results3.DUSER > 0) {
        var results4 = await db.getAsync(
            "SELECT * FROM Projects WHERE Admin='ZeroUser'",
        );
        for (var i = 0; i < results3.DUSER; i++) {
            await db.runAsync(
                "INSERT INTO Access (Username, PName) VALUES ('" +
                    username +
                    "', '" +
                    results4.PName +
                    "')",
            );
        }
        await db.runAsync(
            "UPDATE Projects SET Admin = '" +
                username +
                "' WHERE Admin ='ZeroUser'",
        );
    }

    var public_path = process.cwd() + "/".replace("routes", "").replace("user", "");
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
