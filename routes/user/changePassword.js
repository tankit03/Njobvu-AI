async function changePassword(req, res) {

    console.log("changePassword");

    var user = req.cookies.Username,
        oldPassword = req.body.oldPassword,
        newPassword = req.body.newPassword;

    var passwords = await db.allAsync(
        "SELECT Password FROM Users WHERE Username = '" + user + "'",
    );

    if (!bcrypt.compareSync(oldPassword, passwords[0].Password)) {
        return res.send({ Success: "Wrong Password!" });
    } else {
        bcrypt.hash(newPassword, 10, async function (err, hash) {
            if (err) {
                console.error(err);
                return res.send({
                    Success:
                        "Password encryption error. Password has not been changed",
                });
            } else {
                await db.runAsync(
                    "UPDATE Users SET Password = '" +
                        hash +
                        "' WHERE Username = '" +
                        user +
                        "'",
                );
                return res.send({ Success: "Yes" });
            }
        });
    }
}


module.exports = changePassword;