const path = require("path");
const sharp = require("sharp");
const fs = require("fs");

async function downloadDataset(req, res) {
    console.log("downloadingData");

    // get URL variables
    var PName = req.body.PName,
        admin = req.body.Admin,
        IDX = parseInt(req.body.IDX),
        // mult = parseInt(req.body.mult),
        user = req.cookies.Username;

    // Set paths
    var public_path = __dirname.replace("routes", "").replace("downloads", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        merge_path = project_path + "/merge/",
        merge_images = merge_path + "images/",
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        downloads_path = main_path + user + "_Downloads";
    bootstrap_path = project_path + "/bootstrap";

    if (!fs.existsSync(downloads_path)) {
        fs.mkdir(downloads_path, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }
    // Connect to database
    var dddb = new sqlite3.Database(
        project_path + "/" + PName + ".db",
        (err) => {
            if (err) {
                return console.error(err.message);
            }
            console.log("Connected to dddb.");
        },
    );
    dddb.getAsync = function (sql) {
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
    dddb.allAsync = function (sql) {
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
    dddb.runAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.run(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    reject(err);
                } else resolve(row);
            });
        });
    };

    // get form
    var download_format = parseInt(req.body.download_format);

    var cnames = [];
    var results1 = await dddb.allAsync("SELECT * FROM Classes");
    var results2 = await dddb.allAsync("SELECT * FROM Images");

    for (var i = 0; i < results1.length; i++) {
        cnames.push(results1[i].CName);
    }

    //classfication
    if (download_format == 6) {
        const cropImage = async (
            sourcePath,
            targetPath,
            x,
            y,
            width,
            height,
        ) => {
            try {
                const cropOptions = {
                    left: Math.floor(x), // Ensure x is an integer
                    top: Math.floor(y), // Ensure y is an integer
                    width: Math.floor(width), // Ensure width is an integer
                    height: Math.floor(height), // Ensure height is an integer
                };
                await sharp(sourcePath)
                    .extract(cropOptions) // Crop with x, y, w, h
                    .toFile(targetPath); // Save to the target path

                console.log(`Image cropped successfully: ${targetPath}`);
            } catch (err) {
                console.error(`error cropping image: ${err.message}`);
            }
        };

        console.log("HELLOOO");

        folderName = downloads_path + "/dataset";
        folderTrain = folderName + "/train";
        folderVal = folderName + "/val";

        try {
            if (!fs.existsSync(folderName)) {
                fs.mkdirSync(folderName);
            }
            if (!fs.existsSync(folderTrain)) {
                fs.mkdirSync(folderTrain);
            }
            if (!fs.existsSync(folderVal)) {
                fs.mkdirSync(folderVal);
            }
            console.log("Directories created");
        } catch (err) {
            console.error(err);
        }

        // Get all the image class mappings

        var imageClassMapping = await dddb.allAsync(`
			SELECT Labels.CName, Labels.X, Labels.Y, Labels.W, Labels.H, Images.IName, Images.reviewImage, Images.validateImage
			FROM Labels
			JOIN Images ON Labels.IName = Images.IName
		`);

        const processedImages = {};
        const croppingPromises = [];

        imageClassMapping.forEach((indivdualClass) => {
            console.log(indivdualClass.CName);
            classFolderTrain = folderTrain + "/" + indivdualClass.CName;
            classFolderVal = folderVal + "/" + indivdualClass.CName;

            try {
                if (!fs.existsSync(classFolderTrain)) {
                    fs.mkdirSync(classFolderTrain);
                }
            } catch (err) {
                console.error(err);
            }
            try {
                if (!fs.existsSync(classFolderVal)) {
                    fs.mkdirSync(classFolderVal);
                }
            } catch (err) {
                console.error(err);
            }

            // math random to split into validation and training

            const isValidation = Math.random() < 0.2;
            let targetFolder = isValidation ? classFolderVal : classFolderTrain;
            let sourceImagePath = images_path + "/" + indivdualClass.IName;

            if (!processedImages[indivdualClass.IName]) {
                processedImages[indivdualClass.IName] = 0;
            }
            processedImages[indivdualClass.IName]++;

            let targetImagePath =
                targetFolder +
                "/" +
                path.parse(indivdualClass.IName).name +
                "_crop" +
                processedImages[indivdualClass.IName] +
                path.extname(indivdualClass.IName);

            const x = indivdualClass.X;
            const y = indivdualClass.Y;
            const w = indivdualClass.W;
            const h = indivdualClass.H;

            croppingPromises.push(
                cropImage(
                    sourceImagePath,
                    targetImagePath,
                    indivdualClass.X,
                    indivdualClass.Y,
                    indivdualClass.W,
                    indivdualClass.H,
                ),
            );
        });

        await Promise.all(croppingPromises);

        const folderZip = downloads_path + "/dataset.zip";
        const output = fs.createWriteStream(folderZip);

        const archive = archiver("zip", {
            zlib: { level: 9 },
        });

        output.on("close", () => {
            console.log(`${archive.pointer()} total bytes`);
            console.log(
                "archiver has been finalized and the output file descriptor has closed.",
            );
            dddb.close((err) => {
                if (err) {
                    console.error(err);
                } else {
                    console.log("dddb closed successfully");
                }
            });
            res.download(folderZip, (err) => {
                if (err) {
                    console.error("Error downloading the file:", err);
                } else {
                    console.log("File downloaded successfully");

                    // Delete the zip file
                    fs.unlink(folderZip, (err) => {
                        if (err) {
                            console.error("Error deleting the zip file:", err);
                        } else {
                            console.log("Zip file deleted successfully");
                        }
                    });

                    // Delete the folder
                    fs.rm(folderName, { recursive: true }, (err) => {
                        if (err) {
                            console.error("Error deleting the folder:", err);
                        } else {
                            console.log("Folder deleted successfully");
                        }
                    });
                }
            });
        });

        archive.on("warning", (err) => {
            if (err.code === "ENOENT") {
                console.warn(err);
            } else {
                throw err;
            }
        });

        archive.on("error", (err) => {
            throw err;
        });

        archive.pipe(output);
        archive.directory(folderName, false);
        archive.finalize();
    }

    // Yolo Format
    if (download_format == 0) {
        var dict_images_labels = {};
        for (var i = 0; i < results2.length; i++) {
            var img = fs.readFileSync(`${images_path}/${results2[i].IName}`),
                img_data = probe.sync(img),
                img_w = img_data.width,
                img_h = img_data.height;

            var results3 = await dddb.allAsync(
                "SELECT * FROM Labels WHERE IName = '" +
                    results2[i].IName +
                    "'",
            );
            for (var j = 0; j < results3.length; j++) {
                // x, y, w, h
                var centerX = (results3[j].X + results3[j].W / 2) / img_w;
                var centerY = (results3[j].Y + results3[j].H / 2) / img_h;
                to_string_value =
                    cnames.indexOf(results3[j].CName) +
                    " " +
                    centerX +
                    " " +
                    centerY +
                    " " +
                    results3[j].W / img_w +
                    " " +
                    results3[j].H / img_h +
                    "\n";
                if (dict_images_labels[results2[i].IName] == undefined) {
                    dict_images_labels[results2[i].IName] = to_string_value;
                } else {
                    dict_images_labels[results2[i].IName] += to_string_value;
                }
            }
            if (results3.length == 0) {
                dict_images_labels[results2[i].IName] = "";
            }
        }

        var output = fs.createWriteStream(`${downloads_path}/yolo.zip`);
        var archive = archiver("zip");
        output.on("close", function () {
            console.log(archive.pointer() + " total bytes");
            console.log(
                "archiver has been finalized and the output file descriptor has closed.",
            );
            dddb.close(function (err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("dddb closed successfully");
                }
            });
            res.download(`${downloads_path}/yolo.zip`);
        });

        archive.on("error", function (err) {
            throw err;
        });

        archive.pipe(output);
        console.log("Writing labels");
        for (var key in dict_images_labels) {
            remove_dot_ext = key.split(".")[0];
            fs.writeFileSync(
                `${downloads_path}/${remove_dot_ext}.txt`,
                dict_images_labels[key],
                (err) => {
                    if (err) throw err;
                },
            );
            archive.file(`${downloads_path}/${remove_dot_ext}.txt`, {
                name: remove_dot_ext + ".txt",
            });
        }

        // Classes file
        console.log("Writing Classes file");
        var classes = "";
        for (var i = 0; i < results1.length; i++) {
            classes = classes + results1[i].CName + "\n";
        }
        classes = classes.substring(0, classes.length - 1);
        fs.writeFileSync(
            downloads_path + "/" + PName + "_Classes.txt",
            classes,
            (err) => {
                if (err) throw err;
                console.log("done writing Classes file");
            },
        );
        await archive.file(downloads_path + "/" + PName + "_Classes.txt", {
            name: PName + "_Classes.txt",
        });

        //Images
        archive.directory(images_path, false);

        archive.finalize();
    }

    // Tensorflow format
    // TODO xmin/ymin
    else if (download_format == 1) {
        var labels = await dddb.allAsync("SELECT * FROM Labels");
        var xmin = 0;
        var xmax = 0;
        var ymin = 0;
        var ymax = 0;
        var data = "filename,width,height,class,xmin,ymin,xmax,ymax\n";
        for (var i = 0; i < labels.length; i++) {
            xmin = labels[i].X;
            xmax = xmin + labels[i].W;
            ymin = labels[i].Y;
            ymax = ymin + labels[i].H;

            var img = fs.readFileSync(`${images_path}/${labels[i].IName}`);
            var img_data = probe.sync(img);
            var img_w = img_data.width;
            var img_h = img_data.height;

            data =
                data +
                labels[i].IName +
                "," +
                img_w +
                "," +
                img_h +
                "," +
                labels[i].CName +
                "," +
                xmin +
                "," +
                ymin +
                "," +
                xmax +
                "," +
                ymax +
                "\n";
        }

        fs.writeFile(
            downloads_path + "/" + PName + "_dataset.csv",
            data,
            (err) => {
                if (err) throw err;
                console.log("done writing csv");
            },
        );

        var output = fs.createWriteStream(downloads_path + "/tensorflow.zip");
        var archive = archiver("zip");
        output.on("close", function () {
            console.log(archive.pointer() + " total bytes");
            console.log(
                "archiver has been finalized and the output file descriptor has closed.",
            );
            dddb.close(function (err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("dddb closed successfully");
                }
            });
            res.download(downloads_path + "/tensorflow.zip");
        });

        archive.on("error", function (err) {
            throw err;
        });

        archive.pipe(output);

        archive.file(downloads_path + "/" + PName + "_dataset.csv", {
            name: PName + "_dataset.csv",
        });

        // var images = await dddb.allAsync("SELECT * FROM Images");
        // for(var i = 0; i < images.length; i++)
        // {
        // 	archive.file(public_path+"/public/projects/" + admin + '-' +PName+"/images/"+images[i].IName, {name: images[i].IName});
        // }

        archive.finalize();
    }
    // COCO
    else if (download_format == 2) {
        var labels = await dddb.allAsync("SELECT * FROM Labels");
        var xmin = 0;
        var xmax = 0;
        var ymin = 0;
        var ymax = 0;
        var rows = [];
        var imageNames = [];
        var imageId = 0;

        for (var i = 0; i < labels.length; i++) {
            data = [];
            xmin = labels[i].X;
            xmax = xmin + labels[i].W;
            ymin = labels[i].Y;
            ymax = ymin + labels[i].Y;

            data.push(labels[i].IName);
            data.push(labels[i].CName);
            data.push(labels[i].W);
            data.push(labels[i].H);
            data.push(xmin);
            data.push(xmax);
            data.push(ymin);
            data.push(ymax);
            data.push(labels[i].LID);

            rows.push(data);
        }
        var coco = {};
        var images = [];
        var categories = [];
        var annotations = [];

        function im(pic, id) {
            var image = {};
            var rel_image_path = images_path + pic;

            var img = fs.readFileSync(`${images_path}/${pic}`);
            var img_data = probe.sync(img);
            var img_w = img_data.width;
            var img_h = img_data.height;

            image["height"] = img_h;
            image["width"] = img_w;
            image["id"] = id;
            image["file_name"] = pic;
            return image;
        }

        function category(cname) {
            var cat = {};
            cat["supercategory"] = "None";
            cat["id"] = cnames.indexOf(cname);
            cat["name"] = cname;
            return cat;
        }

        function annotation(row) {
            var anno = {};
            var area = row[2] * row[3];
            anno["segmentation"] = [];
            anno["iscrowd"] = 0;
            anno["area"] = area;
            anno["image_id"] = imageNames.indexOf(row[0]);
            anno["bbox"] = [row[4], row[6], row[2], row[3]];
            anno["category_id"] = cnames.indexOf(row[1]);
            anno["id"] = row[8];

            return anno;
        }
        for (var i = 0; i < results2.length; i++) {
            // console.log(results2[i].IName);
            imageNames.push(results2[i].IName);
            images.push(im(results2[i].IName, i));
        }
        for (var i = 0; i < rows.length; i++) {
            annotations.push(annotation(rows[i]));
        }
        for (var i = 0; i < cnames.length; i++) {
            categories.push(category(cnames[i]));
        }

        coco["images"] = images;
        // console.log("images: \n", images);
        coco["categories"] = categories;
        coco["annotations"] = annotations;

        var coco_data = JSON.stringify(coco);

        fs.writeFile(
            downloads_path + "/" + PName + "_coco.json",
            coco_data,
            (err) => {
                if (err) throw err;
                console.log("done writing csv");
            },
        );
        var output = fs.createWriteStream(downloads_path + "/coco.zip");
        var archive = archiver("zip");
        output.on("close", function () {
            console.log(archive.pointer() + " total bytes");
            console.log(
                "archiver has been finalized and the output file descriptor has closed.",
            );
            dddb.close(function (err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("dddb closed successfully");
                }
            });
            res.download(downloads_path + "/coco.zip");
        });

        archive.on("error", function (err) {
            throw err;
        });

        archive.pipe(output);

        archive.file(downloads_path + "/" + PName + "_coco.json", {
            name: PName + "_coco.json",
        });

        var images = await dddb.allAsync("SELECT * FROM Images");
        for (var i = 0; i < images.length; i++) {
            archive.file(
                public_path +
                    "/public/projects/" +
                    admin +
                    "-" +
                    PName +
                    "/images/" +
                    images[i].IName,
                { name: images[i].IName },
            );
        }

        archive.finalize();
    }
    //Pascal VOC
    else if (download_format == 3) {
        var output = fs.createWriteStream(downloads_path + "/VOC.zip");
        var archive = archiver("zip");
        output.on("close", function () {
            console.log(archive.pointer() + " total bytes");
            console.log(
                "archiver has been finalized and the output file descriptor has closed.",
            );
            dddb.close(function (err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("dddb closed successfully");
                }
            });
            res.download(downloads_path + "/VOC.zip");
        });

        archive.on("error", function (err) {
            throw err;
        });

        archive.pipe(output);

        for (var i = 0; i < results2.length; i++) {
            var imgName = results2[i].IName;
            var imgPath = `${images_path}/${imgName}`;
            var img = fs.readFileSync(`${imgPath}`);
            var img_data = probe.sync(img);
            var img_w = img_data.width;
            var img_h = img_data.height;
            var img_d = img_data.depth;

            var data = "<annotation>\n";
            data += "\t<folder>images</folder>\n";
            data += `\t<filename>${imgName}</filename>\n`;
            data += `\t<path>${imgPath}</path>\n`;
            data += `\t<soruce>\n`;
            data += `\t\t<database>${PName}.db</database>\n`;
            data += `\t</soruce>\n`;
            data += `\t<size>\n`;
            data += `\t\t<width>${img_w}</width>\n`;
            data += `\t\t<height>${img_h}</height>\n`;
            data += `\t\t<depth>3</depth>\n`;
            data += `\t</size>\n`;
            data += `\t<segmented>0</segmented>\n`;

            var labels = await dddb.allAsync(
                "SELECT * FROM Labels WHERE IName = '" + imgName + "'",
            );
            for (var j = 0; j < labels.length; j++) {
                var className = labels[j].CName;
                var xmin = labels[j].X;
                var xmax = xmin + labels[j].W;
                var ymin = labels[j].Y;
                var ymax = ymin + labels[j].Y;

                data += `\t<object>\n`;
                data += `\t\t<name>${className}</name>\n`;
                data += `\t\t<pose>Unspecified</pose>\n`;
                data += `\t\t<truncated>0</truncated>\n`;
                data += `\t\t<difficult>0</difficult>\n`;

                data += `\t\t<bndbox>\n`;
                data += `\t\t\t<xmin>${xmin}</xmin>\n`;
                data += `\t\t\t<ymin>${ymin}</ymin>\n`;
                data += `\t\t\t<xmax>${xmax}</xmax>\n`;
                data += `\t\t\t<ymax>${ymax}</ymax>\n`;
                data += `\t\t</bndbox>\n`;
                data += `\t</object>\n`;
            }
            data += "</annotation>";

            var xmlname = imgName.split(".")[0] + ".xml";
            fs.writeFile(downloads_path + "/" + xmlname, data, (err) => {
                if (err) throw err;
                console.log("done writing xml");
            });
            archive.file(downloads_path + "/" + xmlname, { name: xmlname });
        }

        var images = await dddb.allAsync("SELECT * FROM Images");
        for (var i = 0; i < images.length; i++) {
            archive.file(
                public_path +
                    "/public/projects/" +
                    admin +
                    "-" +
                    PName +
                    "/images/" +
                    images[i].IName,
                { name: images[i].IName },
            );
        }

        archive.finalize();
    }
    // Summary file
    else if (download_format == 4) {
        var output = fs.createWriteStream(downloads_path + "/summary.zip");
        var archive = archiver("zip");
        output.on("close", function () {
            console.log(archive.pointer() + " total bytes");
            console.log(
                "archiver has been finalized and the output file descriptor has closed.",
            );
            dddb.close(function (err) {
                if (err) {
                    console.error(err);
                } else {
                    console.log("dddb closed successfully");
                }
            });
            // res.download(public_path+'/public/projects/' + admin + '-' +PName+'/downloads/summary.zip');
            res.download(downloads_path + "/summary.zip");
        });

        archive.on("error", function (err) {
            throw err;
        });

        archive.pipe(output);
        var data = "";
        console.log("Organize Data");
        for (var i = 0; i < results2.length; i++) {
            // console.log("Image: ", results2[i].IName);
            data = data + results2[i].IName + "\t";
            var classname = await dddb.allAsync(
                "SELECT DISTINCT CName FROM Labels WHERE IName = '" +
                    results2[i].IName +
                    "'",
            );
            // console.log("distinct: ", classname);
            for (var j = 0; j < classname.length; j++) {
                var count = await dddb.getAsync(
                    "SELECT COUNT(*) AS count FROM Labels WHERE IName = '" +
                        results2[i].IName +
                        "' AND CName = '" +
                        classname[j].CName +
                        "'",
                );
                // console.log("count: ", count.count);
                // console.log("CName: ", classname[j].CName);
                data = data + count.count + ": " + classname[j].CName + "\t";
            }
            var review = await dddb.getAsync(
                "SELECT reviewImage FROM Images WHERE IName = '" +
                    results2[i].IName +
                    "'",
            );
            data = data + review.reviewImage + "\t" + "\n";
        }

        // Create race condition
        // Not sure if using await will work
        // as it remains non-blocking and archive.file
        // does not use the value of fs.writeFile.
        // fs.writeFileSync is blocking but will cause further slowdown
        // fs.writeFile(public_path+'/public/projects/' + admin + '-' +PName+'/downloads/'+PName+'_Summary.txt', data, (err) => {
        fs.writeFile(
            downloads_path + "/" + PName + "_Summary.txt",
            data,
            (err) => {
                if (err) throw err;
                console.log("done writing summary");
                // archive.file(public_path+'/public/projects/' + admin + '-' +PName+'/downloads/'+PName+'_Summary.txt', { name: PName+"_Summary.txt" });
                archive.file(downloads_path + "/" + PName + "_Summary.txt", {
                    name: PName + "_Summary.txt",
                });

                archive.finalize();
            },
        );
    } else if (download_format == 5) {
        if (fs.existsSync(bootstrap_path + "/out.json")) {
            var output = fs.createWriteStream(
                downloads_path + "/initialClassification.zip",
            );
            var archive = archiver("zip");
            output.on("close", function () {
                console.log(archive.pointer() + " total bytes");
                console.log(
                    "archiver has been finalized and the output file descriptor has closed.",
                );
                dddb.close(function (err) {
                    if (err) {
                        console.error(err);
                    } else {
                        console.log("dddb closed successfully");
                    }
                });

                res.download(downloads_path + "/initialClassification.zip");
            });

            archive.on("error", function (err) {
                throw err;
            });

            archive.pipe(output);
            console.log("Organize Data");

            var raw_label_bootstrap_data = fs.readFileSync(
                bootstrap_path + "/out.json",
            );
            // var label_bootstrap_data = JSON.parse(raw_label_bootstrap_data);

            fs.writeFile(
                downloads_path + "/out.json",
                raw_label_bootstrap_data,
                (err) => {
                    if (err) throw err;
                    console.log("done writing summary");
                    // archive.file(public_path+'/public/projects/' + admin + '-' +PName+'/downloads/'+PName+'_Summary.txt', { name: PName+"_Summary.txt" });
                    archive.file(downloads_path + "/out.json", {
                        name: "out.json",
                    });

                    archive.finalize();
                },
            );
        }
    }
}

module.exports = downloadDataset;
