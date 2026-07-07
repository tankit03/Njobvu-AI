const fs = require("fs");
const path = require("path");
const unzipFile = require("../../utils/unzipFile");
const StreamZip = require("node-stream-zip");

async function uploadPreWeights(req, res) {
    try {
        var PName = req.body.PName,
            Admin = req.body.Admin,
            user = req.body.user,
            weightsFile = req.files.upload_weights;

        global.logger.debug("Admin: ", Admin);
        global.logger.debug("User: ", user);

        var publicPath = currentPath,
            mainPath = publicPath + "public/projects/",
            projectPath = mainPath + Admin + "-" + PName,
            trainingPath = projectPath + "/training",
            weightsPath = trainingPath + "/weights/",
            weightsFilePath = weightsPath + weightsFile.name;

        global.logger.debug("weightsFilePath: ", weightsFilePath);

        const allowedExtensions = ["137", "weights", "pt", "h5", "pipe", "conf", "habry", "zip"];
        const fileExtension = weightsFile.name.split(".").pop().toLowerCase();

        if (!allowedExtensions.includes(fileExtension)) {
            return res.send({
                Success: "ERROR: Wrong filetype. Must be type .h5, .weights, .pt, .pipe, .conf, .habry, or .zip",
            });
        }

        // create weights path if does not exist
        if (!fs.existsSync(weightsPath)) {
            fs.mkdirSync(weightsPath, { recursive: true });
        }

        if (fileExtension === "zip") {
            const tempZipPath = path.join(trainingPath, "temp_" + Date.now() + "_" + weightsFile.name);
            await weightsFile.mv(tempZipPath);
            
            let hasPipeline = false;
            try {
                const zip = new StreamZip.async({ file: tempZipPath });
                const entries = await zip.entries();
                for (const entry of Object.values(entries)) {
                    if (entry.name.endsWith(".pipe") || entry.name.endsWith(".conf")) {
                        hasPipeline = true;
                        break;
                    }
                }
                await zip.close();
            } catch (err) {
                global.logger.error("Error reading zip entries:", err);
            }
            
            if (hasPipeline) {
                // Extract to weightsPath
                await unzipFile(tempZipPath, weightsPath);
                
                // Post-extraction: if there are any .zip files extracted directly in weightsPath, 
                // move them into weightsPath/models/ to match the expected structure of .pipe files.
                const extractedFiles = fs.readdirSync(weightsPath);
                const modelsPath = path.join(weightsPath, "models");
                for (const file of extractedFiles) {
                    if (file.endsWith(".zip") && fs.statSync(path.join(weightsPath, file)).isFile()) {
                        if (!fs.existsSync(modelsPath)) {
                            fs.mkdirSync(modelsPath, { recursive: true });
                        }
                        fs.renameSync(path.join(weightsPath, file), path.join(modelsPath, file));
                    }
                }
                res.send({ Success: "Your pipeline package has been uploaded and extracted" });
            } else {
                // It is a model zip file (like fish_no_motion_detector.zip).
                // Save it directly under training/weights/models/
                const modelsPath = path.join(weightsPath, "models");
                if (!fs.existsSync(modelsPath)) {
                    fs.mkdirSync(modelsPath, { recursive: true });
                }
                const targetModelPath = path.join(modelsPath, weightsFile.name);
                fs.renameSync(tempZipPath, targetModelPath);
                res.send({ Success: "Your model zip file has been saved to models/" });
            }
        } else {
            await weightsFile.mv(weightsFilePath);
            res.send({ Success: "Your weight file has been uploaded and saved" });
        }
    } catch (err) {
        global.logger.error(err);
        res.send({ Success: `ERROR: Failed to save weights file: ${err.message}` });
    }
}

module.exports = uploadPreWeights;
