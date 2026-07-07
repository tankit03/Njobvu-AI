const fs = require("fs");
const sqlite3 = require("sqlite3").verbose();

async function getViameSettingsPage(req, res) {
    // get URL variables
    var IDX = parseInt(req.query.IDX),
        user = req.cookies.Username;

    if (isNaN(IDX)) {
        IDX = 0;
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
        return res.redirect("/home");
    }
    var PName = projects[num].PName;
    var admin = projects[num].Admin;

    // set paths
    var public_path = currentPath,
        main_path = public_path + "public/projects/",
        project_path = main_path + admin + "-" + PName,
        path = project_path + "/" + PName + ".db",
        training_path = project_path + "/training",
        weights_path = training_path + "/weights",
        inference_path = project_path + "/inference",
        inference_upload_path = project_path + "/inference/uploads",
        log_path = training_path + "/logs/";

    if (!fs.existsSync(training_path)) {
        fs.mkdirSync(training_path);
    }
    if (!fs.existsSync(weights_path)) {
        fs.mkdirSync(weights_path);
    }
    if (!fs.existsSync(inference_path)) {
        fs.mkdirSync(inference_path);
    }
    if (!fs.existsSync(inference_upload_path)) {
        fs.mkdirSync(inference_upload_path, { recursive: true });
    }

    // connect to project database
    var tdb = new sqlite3.Database(path, (err) => {
        if (err) {
            return global.logger.error(err.message);
        }
    });

    // create async database object functions
    tdb.getAsync = function(sql) {
        var that = this;
        return new Promise(function(resolve, reject) {
            that.get(sql, function(err, row) {
                if (err) {
                    global.logger.error("runAsync ERROR!", err)
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            global.logger.error(err);
        });
    };
    tdb.allAsync = function(sql) {
        var that = this;
        return new Promise(function(resolve, reject) {
            that.all(sql, function(err, row) {
                if (err) {
                    global.logger.error("runAsync ERROR!", err)
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            global.logger.error(err);
        });
    };

    var results1 = await db.getAsync(
        "SELECT * FROM `Projects` WHERE PName = '" +
        PName +
        "' AND Admin = '" +
        admin +
        "'",
    );
    var results2 = await tdb.allAsync("SELECT * FROM `Classes`");

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

    // Get files
    var global_weights = [];
    try {
        global_weights = await readdirAsync(weights_path);
    } catch (e) {
        global.logger.error(e);
    }

    var global_inference = [];
    try {
        global_inference = await readdirAsync(inference_path);
    } catch (e) {
        global.logger.error(e);
    }

    var global_inference_upload = [];
    try {
        global_inference_upload = await readdirAsync(inference_upload_path);
    } catch (e) {
        global.logger.error(e);
    }
    global_inference_upload.push(project_path + "/images");

    // close the database
    tdb.close(function(err) {
        if (err) {
            global.logger.error(err);
        }
    });

    res.render("training/viameSettings", {
        title: "viameSettings",
        user: req.cookies.Username,
        access: access,
        PName: PName,
        Admin: admin,
        IDX: IDX,
        PDescription: results1.PDescription,
        AutoSave: results1.AutoSave,
        classes: results2,
        global_weights: global_weights,
        global_inference: global_inference,
        global_inference_upload: global_inference_upload,
        logged: req.query.logged,
        activePage: "viameSettings",
    });
}

module.exports = getViameSettingsPage;
