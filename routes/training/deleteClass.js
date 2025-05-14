async function deleteClass(req, res) {
    console.log("body", req.body);

    var IDX = parseInt(req.body.IDX),
        PName = req.body.PName,
        admin = req.body.Admin,
        user = req.cookies.Username,
        classes = req.body["classArray[]"];

    console.log("classes: ", classes);
    // set paths
    var public_path = __dirname.replace("routes", "").replace("training", ""),
        main_path = public_path + "public/projects/",
        project_path = main_path + admin + "-" + PName;

    var dcdb = new sqlite3.Database(
        project_path + "/" + PName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to dcdb.");
        },
    );
    dcdb.getAsync = function (sql) {
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
    dcdb.allAsync = function (sql) {
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
    dcdb.runAsync = function (sql) {
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

    if (classes.includes(",")) {
        classes = classes.split(",");
    }
    console.log(classes);

    //Delete classes
    var deleteLabels = "";
    var deleteClasses = "";
    var deleteValid = "";
    if (typeof classes == "string") {
        deleteClasses = `DELETE FROM Classes WHERE CName = '${classes}'`;
        deleteLabels = `DELETE FROM Labels WHERE CName = '${classes}'`;
        deleteValid = `DELETE FROM Validation WHERE CName = '${classes}'`;
    } else {
        deleteLabels = `DELETE FROM Labels WHERE CName = '${classes[0]}'`;
        deleteClasses = `DELETE FROM Classes WHERE CName = '${classes[0]}'`;
        deleteValid = `DELETE FROM Validation WHERE CName = '${classes[0]}'`;

        for (var i = 1; i < classes.length; i++) {
            var string = ` OR CName = '${classes[i]}'`;
            deleteLabels += string;
            deleteClasses += string;
            deleteValid += string;
        }
    }
    console.log(deleteClasses);
    await dcdb.runAsync(deleteClasses);

    console.log(deleteLabels);
    await dcdb.runAsync(deleteLabels);

    console.log(deleteValid);
    await dcdb.runAsync(deleteValid);

    console.log("deleteClass (redirect)");

    dcdb.close(function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("cdb closed successfully");
        }
    });

    return res.redirect("/config?IDX=" + IDX);
}

module.exports = deleteClass;
