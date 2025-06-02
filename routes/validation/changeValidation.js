async function changeValidation(req, res) {

    var PName = req.body.PName;
    var admin = req.body.Admin;
    var status = req.body.validMode;

    var publicPath = currentPath,
        mainPath = publicPath + "public/projects/",
        projectPath = mainPath + admin + "-" + PName,
        imagesPath = projectPath + "/images/";

    var rmdb = new sqlite3.Database(
        projectPath + "/" + PName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to rmdb.");
        },
    );

    rmdb.runAsync = function (sql) {
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

    if (status == 0) {
        await db.runAsync(
            "UPDATE Projects SET Validate = '" +
                Number(1) +
                "' WHERE PName = '" +
                PName +
                "' AND Admin ='" +
                admin +
                "'",
        );
        await rmdb.runAsync("UPDATE Images SET reviewImage = 1");
        console.log("Enabled Validation mode for: " + admin + "-" + PName);

        rmdb.close(function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log("rmdb closed successfully");
            }
        });

        res.send({ Success: "Yes" });
    } else if (status == 1) {
        await db.runAsync(
            "UPDATE Projects SET Validate = '" +
                Number(0) +
                "' WHERE PName = '" +
                PName +
                "' AND Admin ='" +
                admin +
                "'",
        );
        await rmdb.runAsync("UPDATE Images SET reviewImage = 0");
        console.log("Disabled Validation mode for: " + admin + "-" + PName);

        rmdb.close(function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log("rmdb closed successfully");
            }
        });

        res.send({ Success: "Yes" });
    } else {
        rmdb.close(function (err) {
            if (err) {
                console.error(err);
            } else {
                console.log("rmdb closed successfully");
            }
        });

        res.send({ Success: "No" });
    }
}

module.exports = changeValidation;