async function changeFname(req, res) {
    console.log("changeFname");

    var user = req.cookies.Username,
        FName = req.body.FName;
    await db.runAsync(
        "UPDATE Users SET FirstName = '" +
            FName +
            "' WHERE Username = '" +
            user +
            "'",
    );

    return res.send({ Success: "Yes" });
}

module.exports = changeFname;
