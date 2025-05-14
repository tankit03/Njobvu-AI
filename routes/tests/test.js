async function test(req, res) {
    console.log("test");
    let file = req.files.upload_project;
    console.log(file);

    var username = req.cookies.Username;

    var Numprojects = await db.getAsync(
        "SELECT COUNT(*) AS THING FROM Access WHERE Username = '" +
            username +
            "'",
    );
    console.log("numprojects: ", Numprojects.THING);
    res.send({ Success: "Test was successful" });
}

module.exports = test;
