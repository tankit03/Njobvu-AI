async function addClasses(req, res) {
    console.log("addClasses");

    // get url variables
    var PName = req.body.PName,
        admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        // mult = parseInt(req.body.mult),
        user = req.cookies.Username,
        validation = req.body.validation;

    // Set paths
    var public_path = __dirname.replace("routes", "").replace("training", ""),
        main_path = public_path + "public/projects/",
        project_path = main_path + admin + "-" + PName;

    // Connect to database
    var acdb = new sqlite3.Database(
        project_path + "/" + PName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to acdb.");
        },
    );
    acdb.getAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.get(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
        });
    };
    acdb.allAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.all(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
        });
    };
    acdb.runAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.run(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
        });
    };

    // get form
    var input_classes = req.body.input_classes;
    if (input_classes.includes(",")) {
        input_classes = req.body.input_classes.split(",");
    }

    // cleans the class input
    if (typeof input_classes == "string") {
        input_classes = input_classes.trim();
        input_classes = input_classes.split(" ").join("_");
    } else {
        //removes blanks
        var insert_classes = [];
        for (i = 0; i < input_classes.length; i++) {
            if (input_classes[i] != "") {
                insert_classes.push(input_classes[i]);
            }
        }
    }

    var classesExist = await acdb.allAsync("SELECT CName FROM Classes");
    var cur_classes = [];
    for (var i = 0; i < classesExist.length; i++) {
        cur_classes.push(classesExist[i].CName);
    }

    console.log("addClasses (INSERT INTO Classes)");
    if (typeof input_classes == "string") {
        if (!cur_classes.includes(input_classes)) {
            await acdb.runAsync(
                "INSERT INTO Classes (CName) VALUES ('" + input_classes + "')",
            );
        }
    } else {
        for (var i = 0; i < insert_classes.length; i++) {
            if (!cur_classes.includes(insert_classes[i])) {
                cur_classes.push(insert_classes[i]);
                await acdb.runAsync(
                    "INSERT INTO Classes (CName) VALUES ('" +
                        insert_classes[i] +
                        "')",
                );
            }
        }
    }

    // close the database
    acdb.close(function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("acdb closed successfully");
        }
    });

    if (validation) return res.redirect("/configV?IDX=" + IDX);
    return res.redirect("/config/classSettings?IDX=" + IDX);
}

module.exports = addClasses;
