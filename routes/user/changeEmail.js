async function changeEmail(req, res) {
    console.log("changeEmail");

    var user = req.cookies.Username,
        Email = req.body.Email;
    await db.runAsync(
        "UPDATE Users SET Email = '" +
            Email +
            "' WHERE Username = '" +
            user +
            "'",
    );

    return res.send({ Success: "Yes" });
}

module.exports = changeEmail;
