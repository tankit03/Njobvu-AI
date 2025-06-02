const { spawn } = require("child_process");

async function downloadProject(req, res) {
    console.log("download Project");

    // Get Project info from form
    var PName = req.body.PName;
    var admin = req.body.Admin;
    var username = req.cookies.Username;

    // Set paths
    var publicPath = currentPath,
        mainPath = publicPath + "public/projects/",
        projectPath = mainPath + admin + "-" + PName,
        //download_path = project_path + '/downloads',
        downloadPath = mainPath + username + "_Downloads";
    (imagesPath = projectPath + "/images/"),
        (bootstrapPath = projectPath + "/bootstrap"),
        (trainingPath = projectPath + "/training"),
        (pythonPath = trainingPath + "/python"),
        (logsPath = trainingPath + "/logs"),
        //weights_path = training_path + '/weights',
        (projectDb = `${projectPath}/${PName}.db`),
        (dumpFile = `${PName}.dump`),
        (dumpPath = `${projectPath}/${dumpFile}`);

    // return res.download(download_path + '/' +PName+'.zip');

    if (!fs.existsSync(downloadPath)) {
        fs.mkdir(downloadPath, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    // Connect to database ////////////////////////////////////////////////////////////////
    var dpdb = new sqlite3.Database(projectDb, (err) => {
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
    var tableExists = await dpdb.allAsync(
        "SELECT COUNT(*) as CNT FROM sqlite_master WHERE type='table' AND name='Labels'",
    );
    if (tableExists.CNT == 0) {
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

        var output = fs.createWriteStream(downloadPath + "/" + PName + ".zip");

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
            return res.download(downloadPath + "/" + PName + ".zip");
        });

        archive.on("error", function (err) {
            // throw err;
            console.log(err);
            return;
        });

        archive.pipe(output);

        //add project to zip
        archive.directory(projectPath, false);

        archive.finalize();
    }
}

module.exports = downloadProject;
