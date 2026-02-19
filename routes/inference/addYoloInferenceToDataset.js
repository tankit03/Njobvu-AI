const queries = require("../../queries/queries");
const fs = require("fs");
const path = require("path");
const csv = require("csv-parser");
const sizeOf = require("image-size").imageSize;

async function addYoloInferenceToDataset(req, res) {
    try {
        let PName = req.body.PName,
            Admin = req.body.Admin,
            runTimestamp = req.body.runTimestamp,
            user = req.cookies.Username,
            minConfidence = parseFloat(req.body.minConfidence) || 0.0;

        var publicPath = currentPath,
            mainPath = publicPath + "public/projects/",
            projectPath = mainPath + Admin + "-" + PName,
            imagesPath = projectPath + "/images",
            labelsPath = projectPath + "/labels",
            inferencePath = projectPath + "/inference",
            logsPath = inferencePath + "/logs",
            runPath = `${logsPath}/${runTimestamp}`,
            inferenceImagesPath = `${runPath}/images`,
            inferenceDetectionsCSV = `${runPath}/inference_detections.csv`;

        if (!fs.existsSync(runPath)) {
            return res.status(404).send("Inference run not found");
        }

        if (!fs.existsSync(inferenceDetectionsCSV)) {
            return res.status(404).send("No detections CSV found for this run");
        }

        if (!fs.existsSync(labelsPath)) {
            fs.mkdirSync(labelsPath, { recursive: true });
        }

        let existingClasses;

        try {
            existingClasses = await queries.project.getAllClasses(projectPath);
        } catch (err) {
            console.error(err);
            return res.status(500).send("Error fetching classes");
        }

        const classIndexMap = {}; // name -> index  (for normal case)
        const classIndexByPosition = {}; // index -> name  (for fallback)

        existingClasses.rows.forEach((row, idx) => {
            classIndexMap[row.CName] = idx;
            classIndexByPosition[idx] = row.CName;
        });

        const detectionsByImage = {};

        let totalRows = 0;
        let passedConfidence = 0;
        let passedClassCheck = 0;

        await new Promise((resolve, reject) => {
            fs.createReadStream(inferenceDetectionsCSV)
                .pipe(csv())
                .on("data", (row) => {
                    totalRows++;
                    console.log("RAW ROW:", JSON.stringify(row));

                    const conf = parseFloat(row["Confidence"]);
                    console.log(`  conf parsed: ${conf}, minConfidence: ${minConfidence}, passes: ${conf >= minConfidence}`);
                    if (isNaN(conf) || conf < minConfidence) return;
                    passedConfidence++;

                    const className = row["Class"];
                    const rawClassId = parseInt(row["Class ID"]);

                    let classId = classIndexMap[className];

                    if (classId === undefined && !isNaN(rawClassId)) {
                        if (classIndexByPosition[rawClassId] !== undefined) {
                            classId = rawClassId;
                        }
                    }

                    console.log(`  class: ${className}, classId: ${classId}, map:`, JSON.stringify(classIndexMap));

                    // skip detections for classes not in this project
                    if (classId === undefined) return;
                    passedClassCheck++;

                    const imgName = row["Image Name"];
                    if (!detectionsByImage[imgName]) {
                        detectionsByImage[imgName] = [];
                    }

                    detectionsByImage[imgName].push({
                        classId,
                        xCenter: row["X Center"],
                        yCenter: row["Y Center"],
                        width: row["Width"],
                        height: row["Height"],
                        confidence: conf
                    });
                })
                .on("end", resolve)
                .on("error", reject);
        });

        console.log(`CSV parse complete: totalRows=${totalRows}, passedConfidence=${passedConfidence}, passedClassCheck=${passedClassCheck}`);
        console.log(`detectionsByImage keys:`, Object.keys(detectionsByImage));
        console.log(`classIndexMap:`, JSON.stringify(classIndexMap));

        let imagesCopied = 0;
        let labelFilesWritten = 0;
        const skipped = [];

        const currentLabels = await queries.project.getAllLabels(projectPath);
        let newMax;

        if (currentLabels.rows.length == 0) {
            newMax = 1;
        } else {
            const oldMax = await queries.project.getMaxLabelId(projectPath);

            newMax = oldMax.rows[0].LID + 1;
        }

        for (const [imgName, detections] of Object.entries(detectionsByImage)) {
            const srcInImagesDir = path.join(inferenceImagesPath, imgName);
            const srcInRunDir = path.join(runPath, imgName);
            const srcImagePath = fs.existsSync(srcInImagesDir) ? srcInImagesDir : srcInRunDir;

            if (!fs.existsSync(srcImagePath)) {
                skipped.push(imgName);
                continue;
            }

            let imgWidth = 1;
            let imgHeight = 1;

            try {
                const buffer = fs.readFileSync(srcImagePath);
                const dimensions = sizeOf(buffer);

                imgWidth = dimensions.width;
                imgHeight = dimensions.height;

                console.log(`Dimensions for ${imgName}: ${imgWidth}x${imgHeight}`);
            } catch (e) {
                console.error(`Could not get dimensions for ${imgName}:`, e);
            }

            const destImagePath = path.join(imagesPath, imgName);

            if (!fs.existsSync(srcImagePath)) {
                skipped.push(imgName);
                continue;
            }

            if (!fs.existsSync(destImagePath)) {
                fs.copyFileSync(srcImagePath, destImagePath);
                imagesCopied++;
            } else {
                console.log(`Image already exists at destination, skipping copy: ${destImagePath}`);
            }

            try {
                await queries.project.addImages(projectPath, imgName, 0, 0);
            } catch (dbErr) {
                console.error(`Warning: could not register ${imgName} in DB:`, dbErr);
            }

            // write YOLO label file, one line per detection
            // format: <class_id> <x_center> <y_center> <width> <height>
            const labelFileName = path.parse(imgName).name + ".txt";
            const labelFilePath = path.join(labelsPath, labelFileName);

            const labelLines = detections.map(
                (d) => `${d.classId} ${d.xCenter} ${d.yCenter} ${d.width} ${d.height}`
            );

            // if label file already exists, append new detections rather than overwrite
            const writeMode = fs.existsSync(labelFilePath) ? "a" : "w";
            fs.writeFileSync(labelFilePath, labelLines.join("\n") + "\n", { flag: writeMode });
            labelFilesWritten++;

            for (const det of detections) {
                // convert YOLO center coords to top-left corner coords

                const xCenter = parseFloat(det.xCenter) * imgWidth;
                const yCenter = parseFloat(det.yCenter) * imgHeight;
                const w = parseFloat(det.width) * imgWidth;
                const h = parseFloat(det.height) * imgHeight;

                const leftX = xCenter - w / 2;
                const topY = yCenter - h / 2;

                // resolve class name from index
                const className = classIndexByPosition[det.classId];
                if (!className) continue;

                const labelId = newMax++;

                try {
                    await queries.project.createLabel(
                        projectPath, labelId, className,
                        leftX, topY,
                        w,
                        h,
                        imgName
                    );;
                } catch (labelErr) {
                    console.error(`Warning: could not insert label for ${imgName}:`, labelErr);
                }
            }

            if (!fs.existsSync(destImagePath)) {
                fs.copyFileSync(srcImagePath, destImagePath);
                imagesCopied++;

                console.log(`Copied ${imgName} to ${destImagePath}`);
            } else {
                console.log(`Image already exists at destination, skipping copy: ${destImagePath}`);
            }
        }

        res.send({
            Success: true,
            imagesCopied,
            labelFilesWritten,
            skipped,
            message: `Added ${imagesCopied} images and ${labelFilesWritten} label files to dataset`
        });

    } catch (err) {
        console.error(err);
        return res.status(500).send("Error adding inference results to dataset");
    }
}

module.exports = addYoloInferenceToDataset;
