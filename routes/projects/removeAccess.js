async function removeAccess(req, res) {
    console.log("removeAccess");
    var PName = req.body.PName,
        Admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        user = req.cookies.Username,
        validation = req.body.validation;

    var OldUser = req.body.OldUser;
    console.log("OldUser: ", OldUser);

    await db.runAsync(
        "DELETE FROM Access WHERE PName = '" +
            PName +
            "' AND Username = '" +
            OldUser +
            "' AND Admin = '" +
            Admin +
            "'",
    );

    if (validation) return res.redirect("/configV?IDX=" + IDX);
    return res.redirect("/config/accessSettings?IDX=" + IDX);
}

module.exports = removeAccess;
