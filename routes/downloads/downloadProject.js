const { spawn } = require("child_process");

async function downloadProject(req, res) {
    console.log("download Project");

    // Get Project info from form
    var PName = req.body.PName;
    var admin = req.body.Admin;
    var username = req.cookies.Username;

    // Set paths
    var public_path = currentPath,
        main_path = public_path + "public/projects/",
        project_path = main_path + admin + "-" + PName,
        //download_path = project_path + '/downloads',
        download_path = main_path + username + "_Downloads";
    (images_path = project_path + "/images/"),
        (bootstrap_path = project_path + "/bootstrap"),
        (training_path = project_path + "/training"),
        (python_path = training_path + "/python"),
        (logs_path = training_path + "/logs"),
        //weights_path = training_path + '/weights',
        (project_db = `${project_path}/${PName}.db`),
        (dump_file = `${PName}.dump`),
        (dump_path = `${project_path}/${dump_file}`);

    // return res.download(download_path + '/' +PName+'.zip');

    if (!fs.existsSync(download_path)) {
        fs.mkdir(download_path, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    // Connect to database ////////////////////////////////////////////////////////////////
    var dpdb = new sqlite3.Database(project_db, (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log("Connected to dpdb.");
    });
    dpdb.getAsync = function (sql) {
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
    dpdb.allAsync = function (sql) {
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
    dpdb.runAsync = function (sql) {
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
    ///////////////////////////////////////////////////////////////////////////////////////////

    // console.log("table exists: ", await dpdb.allAsync("SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='Labels'"));
    var table_exists = await dpdb.allAsync(
        "SELECT COUNT(*) as CNT FROM sqlite_master WHERE type='table' AND name='Labels'",
    );
    if (table_exists.CNT == 0) {
        // close the database
        dpdb.close(function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log("dpdb closed successfully");
            }
        });
        res.send({ Success: "No Labels table" });
    } else {
        /*
			Get dump of project database
			Zip together dump file and images
			download zipfile
		*/

        var output = fs.createWriteStream(download_path + "/" + PName + ".zip");

        var archive = archiver("zip");

        output.on("close", function () {
            console.log(archive.pointer() + " total bytes");
            console.log(
                "archiver has been finalized and the output file descriptor has closed.",
            );

            // close database
            dpdb.close(function (err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("dpdb closed successfully");
                }
            });
            return res.download(download_path + "/" + PName + ".zip");
        });

        archive.on("error", function (err) {
            // throw err;
            console.log(err);
            return;
        });

        archive.pipe(output);

        //add project to zip
        archive.directory(project_path, false);

        archive.finalize();
    }
}

module.exports = downloadProject;
