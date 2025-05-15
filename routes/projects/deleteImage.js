async function deleteImage(req, res) {

    console.log("deleteImage");

    var IDX = parseInt(req.body.IDX),
        PName = req.body.PName,
        admin = req.body.Admin,
        user = req.cookies.Username,
        images = req.body.ImageArray;

    console.log("IDX: ", IDX);
    // set paths
    var public_path = currentPath,
        main_path = public_path + "public/projects/",
        project_path = main_path + admin + "-" + PName,
        images_path = project_path + "/images/";

    var didb = new sqlite3.Database(
        project_path + "/" + PName + ".db",
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
    console.log(images);
    if (images.includes(",")) {
        images = images.split(",");
    }

    var deleteLabels = "";
    var deleteImages = "";
    var deleteVal = "";
    if (typeof images == "string") {
        deleteImages = `DELETE FROM Images WHERE IName = '${images}'`;
        deleteLabels = `DELETE FROM Labels WHERE IName = '${images}'`;
        deleteVal = `DELETE FROM Validation WHERE IName = '${images}'`;
    } else {
        deleteLabels = `DELETE FROM Labels WHERE IName = '${images[0]}'`;
        deleteImages = `DELETE FROM Images WHERE IName = '${images[0]}'`;
        deleteVal = `DELETE FROM Validation WHERE IName = '${images[0]}'`;
        for (var i = 1; i < images.length; i++) {
            var string = ` OR IName = '${images[i]}'`;
            deleteLabels += string;
            deleteClasses += string;
        }
    }

    console.log(deleteLabels);
    await didb.runAsync(deleteLabels);

    console.log(deleteImages);
    await didb.runAsync(deleteImages);

    console.log(deleteVal);
    await didb.runAsync(deleteVal);

    //reIndex Images to reset rowId
    var reIndexImages = await didb.allAsync("SELECT * FROM Images"); //tp1
    await didb.runAsync("DELETE FROM Images");
    for (var t = 0; t < reIndexImages.length; t++) {
        await didb.runAsync(
            "INSERT INTO Images (IName, reviewImage, validateImage) VALUES ('" +
                reIndexImages[t]["IName"] +
                "', '" +
                reIndexImages[t]["reviewImage"] +
                "', '" +
                reIndexImages[t]["validateImage"] +
                "')",
        );
    }

    // for(var i = 1; i < images.length; i++){
    image_path = `${images_path}` + images; //change if multi image deletion is requested
    console.log("Delete image: ", image_path);
    fs.unlink(image_path, function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("done");
        }
    });
    // }

    didb.close(function (err) {
        if (err) {
            console.error(err);
        } else {
            console.log("didb closed successfully");
            res.send({ Success: "Yes" });
        }
    });
    
}

module.exports = deleteImage;