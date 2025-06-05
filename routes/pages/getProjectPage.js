async function getProjectPage(req, res) {
    console.log("getProjectPage");

    var public_path = currentPath;

    // get URL variables
    var IDX = parseInt(req.query.IDX),
        page = req.query.page,
        perPage = req.query.perPage,
        user = req.cookies.Username,
        valid = 0;

    if (IDX == undefined) {
        IDX = 0;
        valid = 1;
        return res.redirect("/home");
    }

    var projects = await db.allAsync(
        "SELECT * FROM Access WHERE Username = '" + user + "'",
    );

    var num = IDX;

    if (num > projects.length) {
        valid = 1;
        return res.redirect("/home");
    }

    var PName = projects[num].PName;
    var admin = projects[num].Admin;

    var public_path = currentPath;
    var db_path =
        public_path +
        "public/projects/" +
        admin +
        "-" +
        PName +
        "/" +
        PName +
        ".db";

    if (page == undefined) {
        page = 1;
    }
    if (perPage == undefined) {
        perPage = 10;
    }

    var pdb = new sqlite3.Database(db_path, (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log("Connected to pdb.");
    });

    // create async database object functions
    pdb.getAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.get(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.log(err);
        });
    };
    pdb.allAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.all(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.log(err);
        });
    };

    var results1 = await pdb.allAsync(
        "SELECT * FROM `Images` LIMIT " +
            perPage +
            " OFFSET " +
            (page - 1) * perPage,
    );

    var results2 = await pdb.getAsync("SELECT COUNT(*) FROM Images");

    var list_counter = [];
    for (var i = 0; i < results1.length; i++) {
        var results3 = await pdb.getAsync(
            "SELECT COUNT(*) FROM `Labels` WHERE IName = '" +
                results1[i].IName +
                "'",
        );
        list_counter.push(results3["COUNT(*)"]);
    }
    // var acc = await db.allAsync("SELECT * FROM `Access` WHERE PName = '" + PName + "'");
    var acc = await db.allAsync(
        "SELECT * FROM `Access` WHERE PName = '" +
            PName +
            "' AND Admin = '" +
            admin +
            "'",
    );
    var access = [];
    for (var i = 0; i < acc.length; i++) {
        access.push(acc[i].Username);
    }
    pdb.close(function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("pdb closed successfully");
        }
    });
    res.render("project", {
        title: "project",
        user: user,
        PName: PName,
        Admin: admin,
        IDX: IDX,
        access: access,
        images: results1,
        list_counter: list_counter,
        current: page,
        pages: Math.ceil(results2["COUNT(*)"] / perPage),
        perPage: perPage,
        logged: req.query.logged,
        activePage: "project",
    });
}

module.exports = getProjectPage;
