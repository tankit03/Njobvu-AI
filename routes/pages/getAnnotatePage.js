async function getAnnotatePage(req, res) {
    var username = req.cookies.Username;
    var IDX = parseInt(req.query.IDX, 10);
    // get URL variables
    var IDX = parseInt(req.query.IDX),
        user = req.cookies.Username;

    if (IDX == undefined) {
        IDX = 0;
        valid = 1;
        return res.redirect("/home");
    }
    if (user == undefined) {
        return res.redirect("/");
    }

    var projects = await db.allAsync(
        "SELECT * FROM Access WHERE Username = '" + user + "'",
    );

    var num = IDX;

    if (num >= projects.length) {
        valid = 1;
        return res.redirect("/home");
    }
    var PName = projects[num].PName;
    var admin = projects[num].Admin;

    var public_path = currentPath;
    var main_path = public_path + "public/projects/";
    var path = main_path + admin + "-" + PName + "/" + PName + ".db";
    if (isNaN(IDX)) {
        global.logger.error("Invalid IDX:", IDX);
        return res.redirect("/home");
    }

    var projects = await db.allAsync(
        "SELECT * FROM Access WHERE Username = '" + username + "'",
    );
    var project = projects[IDX];

    if (!project) {
        global.logger.error("No project found for IDX:", IDX);
        return res.redirect("/home");
    }

    var PName = project.PName;
    var admin = project.Admin;

    // Construct the database path
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

    // Log the database path being accessed
    console.log("Accessing database file:", db_path);

    // If you need to connect to this specific database
    var pdb = new sqlite3.Database(db_path, (err) => {
        if (err) {
            return global.logger.error("Database connection error:", err.message);
        }
        global.logger.info("Connected to pdb.")
    });
    var sdb = new sqlite3.Database(path, (err) => {
        if (err) {
            return global.logger.error(err.message);
        }
        global.logger.info("Connected to tdb.")
    });
    pdb.allAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.all(sql, function (err, row) {
                if (err) {
                    global.logger.error("runAsync ERROR!", err)
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            global.logger.error(err);
        });
    };
    // create async database object functions
    sdb.getAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.get(sql, function (err, row) {
                if (err) {
                    global.logger.error("runAsync ERROR!", err)
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            global.logger.error(err);
        });
    };
    sdb.allAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.all(sql, function (err, row) {
                if (err) {
                    global.logger.error("runAsync ERROR!", err)
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            global.logger.error(err);
        });
    };
    var Classes = await pdb.allAsync("SELECT * FROM `Classes`");
    var results1 = await db.getAsync(
        "SELECT * FROM `Projects` WHERE PName = '" +
            PName +
            "' AND Admin = '" +
            admin +
            "'",
    );
    var results2 = await sdb.allAsync("SELECT * FROM `Classes`");

    var classes = [];
    var counts = [];
    var icounts = [];
    var lcounts = {};

    for (var i = 0; i < Classes.length; i++) {
        let countQuery = await sdb.getAsync(
            "SELECT COUNT(*) FROM Labels WHERE CName = '" +
                results2[i].CName +
                "'",
        );

        const valueLabel = countQuery["COUNT(*)"];
        lcounts[Classes[i].CName] = valueLabel;
    }

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

    var results5 = await sdb.getAsync("SELECT COUNT(*) FROM Images");
    var results6 = await sdb.allAsync("SELECT DISTINCT IName FROM Labels");
    var complete = Math.trunc(100 * (results6.length / results5["COUNT(*)"]));

    // close the database
    sdb.close(function (err) {
        if (err) {
            global.logger.error(err);
        } else {
        }
    });
    // console.log(icounts, counts);

    res.render("annotate", {
        title: "annotate",
        user: username,
        logged: req.query.logged,
        db: req.query.db,
        PName: PName,
        classes: Classes,
        IDX: IDX,
        lcounts: lcounts,
        activePage: "Annotate",
    });
}

module.exports = getAnnotatePage;
