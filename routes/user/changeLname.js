async function changeLname(req, res) {
    console.log("changeLname");

    var user = req.cookies.Username,
        LName = req.body.LName;
    await db.runAsync(
        "UPDATE Users SET LastName = '" +
            LName +
            "' WHERE Username = '" +
            user +
            "'",
    );

    return res.send({ Success: "Yes" });
}

module.exports = changeLname;
