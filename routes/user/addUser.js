async function addUser(req, res) {
    console.log("adduser");

    var PName = req.body.PName,
        Admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username,
        validation = req.body.validation;

    var NewUser = req.body.newUser;
    console.log("NewUser: ", NewUser);

    var results1 = await db.getAsync(
        "SELECT COUNT(*) AS THING FROM Users WHERE Username = '" +
            NewUser +
            "'",
    );
    // console.log("results1.User: ", results1.THING);
    if (results1.THING == 1) {
        var results2 = await db.getAsync(
            "SELECT COUNT(*) AS SOMETHING FROM Access WHERE Username = '" +
                NewUser +
                "' AND PName = '" +
                PName +
                "' AND Admin = '" +
                Admin +
                "'",
        );
        // console.log("results2.SOMETHING: ", results2.SOMETHING);
        if (results2.SOMETHING == 0) {
            await db.runAsync(
                "INSERT INTO Access (Username, PName, Admin) VALUES('" +
                    NewUser +
                    "', '" +
                    PName +
                    "', '" +
                    Admin +
                    "')",
            );
        }
    }
    if (validation) return res.redirect("/configV?IDX=" + IDX);
    return res.redirect("/config/accessSettings?IDX=" + IDX);
}

module.exports = addUser;
