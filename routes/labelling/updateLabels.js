async function updateLabels(req, res) {
    console.log("updateLabels");

    var IDX = parseInt(req.body.IDX),
        PName = req.body.PName,
        admin = req.body.Admin,
        user = req.cookies.Username;

    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/";

    // get form inputs
    var user = req.body.user,
        CName = req.body.CName,
        IName = req.body.IName,
        rev_image = req.body.rev_image,
        prev_IName = req.body.prev_IName,
        next_IName = req.body.next_IName,
        change_width = req.body.origin_image_width / req.body.image_width,
        labels_counter = parseInt(req.body.labels_counter),
        curr_class = req.body.curr_class,
        sortFilter = req.body.sortFilter,
        classFilter = req.body.classFilter,
        imageClass = req.body.imageClass,
        form_action = req.body.form_action;

    // set paths
    var project_path = main_path + admin + "-" + PName;
    var uldb = new sqlite3.Database(
        project_path + "/" + PName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to uldb.");
        },
    );
    uldb.getAsync = function (sql) {
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
    uldb.allAsync = function (sql) {
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
    uldb.runAsync = function (sql) {
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

    await uldb.runAsync(
        "UPDATE Images SET reviewImage = '" +
            rev_image +
            "' WHERE IName = '" +
            IName +
            "'",
    );

    var confidence = await uldb.allAsync(
        "SELECT * FROM Validation WHERE IName = '" + IName + "'",
    );

    await uldb.runAsync("DELETE FROM Labels WHERE IName = '" + IName + "'");
    await uldb.runAsync("DELETE FROM Validation WHERE IName = '" + IName + "'");
    var getAllClasses = await uldb.allAsync("SELECT * FROM Classes");

    var conf = {};

    if (confidence != []) {
        for (var x = 0; x < confidence.length; x++) {
            conf[confidence[x].LID] = confidence[x];
        }
    }

    var cur_conf = [];

    for (var j = 0; j < labels_counter; j++) {
        var tempLID = "";
        var width = 0;
        var height = 0;
        if (labels_counter == 1) {
            tempLID = req.body.LabelingID;
            width = req.body.W;
            height = req.body.H;
        } else {
            tempLID = req.body.LabelingID[j];
            width = req.body.W[j];
            height = req.body.H[j];
        }

        if (!(width > 0) || !(height > 0)) {
            cur_conf.push([]);
            continue;
        }
        if (tempLID in conf) {
            cur_conf.push([conf[tempLID]]);
        } else {
            cur_conf.push([]);
        }
    }
    var labelsExists = await uldb.getAsync(
        "SELECT COUNT(*) AS count FROM Labels",
    );

    if (labelsExists.count == 0) {
        var newmax = 1;
    } else {
        var oldmax = await uldb.getAsync(
            "SELECT * FROM Labels WHERE LID = (SELECT MAX(LID) FROM Labels)",
        );
        var newmax = oldmax.LID + 1;
    }

    //Edit Labels Table
    if (labels_counter > 1) {
        for (var i = 0; i < labels_counter; i++) {
            if (!(req.body.W[i] > 0) || !(req.body.H[i] > 0)) continue;

            console.log(
                IName +
                    "', X: '" +
                    req.body.X[i] +
                    "', Y: '" +
                    req.body.Y[i] +
                    "', W: '" +
                    req.body.W[i] +
                    "', H: '" +
                    req.body.H[i] +
                    "', CName: '" +
                    CName[i],
            );

            // var conf = 0;

            await uldb.runAsync(
                "INSERT INTO Labels (LID, IName, X, Y, W, H, CName) VALUES ('" +
                    Number(newmax) +
                    "', '" +
                    IName +
                    "', '" +
                    Number(req.body.X[i]) +
                    "', '" +
                    Number(req.body.Y[i]) +
                    "', '" +
                    Number(req.body.W[i]) +
                    "', '" +
                    Number(req.body.H[i]) +
                    "', '" +
                    CName[i] +
                    "')",
            );

            if (cur_conf[i][0] && cur_conf.length > 0) {
                await uldb.runAsync(
                    "INSERT INTO Validation (Confidence, LID, CName, IName) VALUES ('" +
                        Number(cur_conf[i][0].Confidence) +
                        "', '" +
                        Number(newmax) +
                        "', '" +
                        cur_conf[i][0].CName +
                        "', '" +
                        cur_conf[i][0].IName +
                        "')",
                );
            }

            newmax = newmax + 1;
        }
    } else if (labels_counter == 1) {
        console.log(
            IName +
                "', X: '" +
                req.body.X +
                "', Y: '" +
                req.body.Y +
                "', W: '" +
                req.body.W +
                "', H: '" +
                req.body.H +
                "', CName: '" +
                CName,
        );
        await uldb.runAsync(
            "INSERT INTO Labels (LID, IName, X, Y, W, H, CName) VALUES ('" +
                Number(newmax) +
                "', '" +
                IName +
                "', '" +
                Number(req.body.X) +
                "', '" +
                Number(req.body.Y) +
                "', '" +
                Number(req.body.W) +
                "', '" +
                Number(req.body.H) +
                "', '" +
                CName +
                "')",
        );

        if (cur_conf[0][0] && cur_conf.length > 0) {
            console.log("inserting", cur_conf[0][0]);
            var cc = cur_conf[0][0];

            await uldb.runAsync(
                "INSERT INTO Validation (Confidence, LID, CName, IName) VALUES ('" +
                    Number(cc.Confidence) +
                    "', '" +
                    Number(newmax) +
                    "', '" +
                    cc.CName +
                    "', '" +
                    cc.IName +
                    "')",
            );
        }
    }

    // close the database
    uldb.close(function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("uldb closed successfully");
        }
    });
    if (form_action == "save") {
        return res.redirect(
            "/labeling?IDX=" +
                IDX +
                "&IName=" +
                IName +
                "&curr_class=" +
                curr_class,
        );
    } else if (form_action == "auto-prev") {
        return res.redirect(
            "/labeling?IDX=" +
                IDX +
                "&IName=" +
                prev_IName +
                "&curr_class=" +
                curr_class,
        );
    } else if (form_action == "auto-next") {
        return res.redirect(
            "/labeling?IDX=" +
                IDX +
                "&IName=" +
                next_IName +
                "&curr_class=" +
                curr_class,
        );
    } else if (form_action == "saveV") {
        return res.redirect(
            "/labelingV?IDX=" +
                IDX +
                "&IName=" +
                IName +
                "&curr_class=" +
                curr_class +
                "&sort=" +
                sortFilter +
                "&class=" +
                imageClass +
                "&classFilter=" +
                classFilter,
        );
    } else if (form_action == "auto-prevV") {
        return res.redirect(
            "/labelingV?IDX=" +
                IDX +
                "&IName=" +
                prev_IName +
                "&curr_class=" +
                curr_class +
                "&sort=" +
                sortFilter +
                "&class=" +
                imageClass +
                "&classFilter=" +
                classFilter,
        );
    } else if (form_action == "auto-nextV") {
        return res.redirect(
            "/labelingV?IDX=" +
                IDX +
                "&IName=" +
                next_IName +
                "&curr_class=" +
                curr_class +
                "&sort=" +
                sortFilter +
                "&class=" +
                imageClass +
                "&classFilter=" +
                classFilter,
        );
    }
}

module.exports = updateLabels;
