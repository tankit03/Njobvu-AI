async function getClassificationPage(req, res) {
    username = req.cookies.Username;
    console.log("getCreatePage");
    var projects = await db.allAsync(
        "SELECT * FROM Access WHERE Admin = '" + username + "'",
    );
    var PNames = [];
    for (var i = 0; i < projects.length; i++) {
        PNames.push(projects[i].PName);
    }
    console.log("getClassificationPage");

    res.render("createClassification", {
        title: "createClassification",
        user: username,
        logged: req.query.logged,
        PNames: PNames,
        activePage: "Classification",
    });
}

module.exports = getClassificationPage;
