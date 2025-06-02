async function soloChangeClass(req, res) {

    var LID = parseInt(req.body.LID),
       selectedClass = req.body.selectedClass,
        projectName = req.body.PName,
        admin = req.body.Admin;

    var publicPath = __dirname.replace("routes", ""),
        mainPath = publicPath + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        projectPath = mainPath + admin + "-" + projectName; // $LABELING_TOOL_PATH/public/projects/project_name

    var aidb = new sqlite3.Database(
        projectPath + "/" + projectName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to aidb.");
        },
    );
    aidb.getAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.get(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    //reject(err);
                    aidb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("aidb closed");
                        }
                    });
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
            // res.send({"Success": "No"})
            return res.send("ERROR! " + err);
        });
    };
    aidb.allAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.all(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    //reject(err);
                    aidb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("aidb closed");
                        }
                    });
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
            // res.send({"Success": "No"})
            return res.send("ERROR! " + err);
        });
    };
    aidb.runAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.run(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    aidb.close(function (err) {
                        if (err) {
                            console.error(err);
                        } else {
                            console.log("aidb closed");
                        }
                    });
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
            // res.send({"Success": "No"})
            return res.send("ERROR! " + err);
        });
    };

    await aidb.runAsync(
        "UPDATE Labels SET CName = '" +
            selectedClass +
            "' WHERE LID =' " +
            LID +
            "'",
    );
    await aidb.runAsync(
        "UPDATE Validation SET CName = '" +
            selectedClass +
            "' WHERE LID =' " +
            LID +
            "'",
    );
    res.send({ Success: "Yes" });

}

module.exports = soloChangeClass;