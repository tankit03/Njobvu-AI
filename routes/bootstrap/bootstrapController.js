const queries = require("../../queries/queries");

async function boostrap(req, res) {
    var project_name = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        darknet_path = req.body.darknet_path,
        run_number = req.body.run_number,
        upload_images = req.files.upload_images,
        IDX = parseInt(req.body.IDX);

    var public_path = currentPath,
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + project_name, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        logs_path = training_path + "/logs",
        merge_path = project_path + "/merge/",
        merge_images = merge_path + "images/",
        yolo_script = public_path + "controllers/training/bootstrap.py",
        run_path = logs_path + run_number;

    if (fs.existsSync(merge_path)) {
        rimraf(merge_path, (err) => {
            if (err) {
                console.log(err);
            } else {
            }
        });
    }

    try {
        fs.mkdirSync(merge_path);
        fs.mkdirSync(merge_images);
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error making merge directories");
    }

    var aidb = new sqlite3.Database(
        project_path + "/" + project_name + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to aidb.");
        },
    );

    var newImages = [];
    var bootstrapString = "";

    var zip_path = project_path + "/" + upload_images.name; // $LABELING_TOOL_PATH/public/projects/{project_name}/{zip_file_name}
    await upload_images.mv(zip_path);

    var zip = new StreamZip.async({ file: zip_path });

    await zip.extract(merge_images);
    await zip.close();

    rimraf(zip_path, (err) => {
        if (err) {
            console.log(err);
            return res.send("ERROR! " + err);
        }
    });

    let files = await readdirAsync(images_path);
    let newFiles = await readdirAsync(merge_images);

    for (var i = 0; i < newFiles.length; i++) {
        var temp = merge_images + "/" + newFiles[i];
        newFiles[i] = newFiles[i].trim();
        newFiles[i] = newFiles[i].split(" ").join("_");
        newFiles[i] = newFiles[i].split("+").join("_");
        fs.rename(temp, merge_images + "/" + newFiles[i], () => {});
        if (newFiles[i] == "__MACOSX") {
            continue;
        } else if (!files.includes(newFiles[i])) {
            try {
                fs.renameSync(
                    merge_images + "/" + newFiles[i],
                    images_path + "/" + newFiles[i],
                );

                await queries.project.addImages(
                    project_path,
                    newFiles[i],
                    0,
                    1,
                );

                newImages.push(newFiles[i]);
                bootstrapString += newFiles[i] + "\n";
            } catch (err) {
                console.error(err);
                return res.stauts(500).send("Error inserting images");
            }
        }
    }

    fs.writeFileSync(
        training_path + "/images_to_bootstrap.txt",
        bootstrapString,
    );

    rimraf(merge_path, (err) => {
        if (err) {
            console.log(err);
        }
    });

    res.send({ Success: "Yes" });
}

module.exports = boostrap;

