async function getLabelingPage(req, res) {
    console.log("getLabelingPage");

    var IDX = parseInt(req.query.IDX),
        IName = String(req.query.IName),
        curr_class = req.query.curr_class,
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

    // set paths
    var public_path = currentPath,
        main_path = public_path + "public/projects/",
        project_path = main_path + admin + "-" + PName;

    var rel_project_path = "projects/" + admin + "-" + PName;

    //Connect Database
    var ldb = new sqlite3.Database(
        project_path + "/" + PName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to ldb.");
        },
    );

    // create async database object functions
    ldb.getAsync = function (sql) {
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
    ldb.allAsync = function (sql) {
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
    ldb.eachAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.each(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.log(err);
        });
    };

    var results1 = await ldb.allAsync("SELECT * FROM `Classes`");
    var Classes = [];
    for (var i = 0; i < results1.length; i++) {
        Classes.push(results1[i].CName);
    }
    var results2 = await ldb.allAsync("SELECT * FROM `Images`");
    var rowid = await ldb.getAsync(
        "SELECT rowid FROM Images WHERE IName = '" + IName + "'",
    );

    var results3 = await ldb.allAsync(
        "SELECT * FROM `Labels` WHERE IName = '" + String(IName) + "'",
    );
    var results4 = await ldb.allAsync(
        "SELECT * FROM `Images` WHERE IName = '" + String(IName) + "'",
    );
    var results5 = await db.getAsync(
        "SELECT AutoSave FROM `Projects` WHERE PName = '" +
            PName +
            "' AND Admin = '" +
            admin +
            "'",
    );
    var acc = await db.allAsync(
        "SELECT * FROM `Access` WHERE PName = '" +
            PName +
            "' AND Admin = '" +
            admin +
            "'",
    );
    var access = [];

    if (curr_class == null) {
        curr_class = results1[0].CName;
    }

    for (var i = 0; i < acc.length; i++) {
        access.push(acc[i].Username);
    }

    var abs_image_path = project_path + "/images/" + IName;

    if (!fs.existsSync(abs_image_path)) {
        res.render("404", {
            title: "404",
            user: req.cookies.Username,
        });
    } else {
        // var rel_image_path = abs_image_path;
        var rel_image_path = rel_project_path + "/images/" + results4[0].IName;
        // get image information //there might be a race condition between rel_project_path and project_path which makes them different when bootstrapping is run
        var img = fs.readFileSync(
                project_path + "/images/" + results4[0].IName,
                (err) => {
                    if (err) {
                        res.render("404", {
                            title: "404",
                            user: req.cookies.Username,
                        });
                    }
                },
            ),
            img_data = probe.sync(img),
            img_w = img_data.width,
            img_h = img_data.height,
            image_ratio = img_h / img_w,
            image_width = img_w,
            image_height = image_ratio * image_width,
            prev_IName = (next_IName = -1);
        var curr_index = 1;

        var list_counter = [];

        curr_index = Number(rowid.rowid);
        if (curr_index != 1) {
            prev_IName = results2[curr_index - 2]["IName"];
        }
        if (curr_index != results2.length) {
            next_IName = results2[curr_index]["IName"];
        }

        // close the database
        ldb.close(function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log("ldb closed successfully");
            }
        });

        var colors = [];
        var i = 0;
        while (colors.length < Classes.length) {
            if (i >= colorsJSON.length) {
                i = 0;
            }
            colors.push(colorsJSON[i]);
            i++;
        }
        console.log(results3);
        res.render("labeling", {
            title: "labeling",
            user: user,
            access: access,
            image_width: image_width,
            image_height: image_height,
            image_path: rel_image_path,
            image_name: results4[0].IName,
            image_ratio: image_ratio,
            classes: Classes,
            images: results2,
            labels: results3,
            colors: colors,
            IName: IName,
            prev_IName: prev_IName,
            next_IName: next_IName,
            PName: PName,
            Admin: admin,
            IDX: IDX,
            images_length: results2.length,
            curr_index: curr_index,
            curr_class: curr_class,
            rev_image: results4[0].reviewImage,
            list_counter: list_counter,
            AutoSave: results5["AutoSave"],
            logged: req.query.logged,
            activePage: "project",
        });
    }
}

module.exports = getLabelingPage;
