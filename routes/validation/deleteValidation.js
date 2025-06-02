async function deleteLabelValidation(req, res) {
    console.log("deleteLabel");

    var IDX = parseInt(req.body.IDX),
        PName = req.body.PName,
        admin = req.body.Admin,
        user = req.cookies.Username,
        labels = req.body.LabelArray;

    console.log("IDX: ", IDX);
    // set paths
    var publicPath = currentPath,
        mainPath = publicPath + "public/projects/",
        projectPath = mainPath + admin + "-" + PName;

    var didb = new sqlite3.Database(
        projectPath + "/" + PName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to didb.");
        },
    );
    didb.getAsync = function (sql) {
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
    didb.allAsync = function (sql) {
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
    didb.runAsync = function (sql) {
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
    console.log(labels);
    if (labels.includes(",")) {
        labels = labels.split(",");
    }

    var deleteLabels = "";
    var deleteVal = "";
    if (typeof labels == "string") {
        deleteLabels = `DELETE FROM Labels WHERE LID = '${labels}'`;
        deleteVal = `DELETE FROM Validation WHERE LID = '${labels}'`;
    } else {
        deleteLabels = `DELETE FROM Labels WHERE LID = '${labels[0]}'`;
        deleteVal = `DELETE FROM Validation WHERE LID = '${labels[0]}'`;
        for (var i = 1; i < labels.length; i++) {
            var string = ` OR LID = '${labels[i]}'`;
            deleteLabels += string;
        }
    }

    console.log(deleteLabels);
    await didb.runAsync(deleteLabels);

    console.log(deleteVal);
    await didb.runAsync(deleteVal);

    didb.close(function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("didb closed successfully");
            res.send({ Success: "Yes" });
        }
    });
}

module.exports = deleteLabelValidation;