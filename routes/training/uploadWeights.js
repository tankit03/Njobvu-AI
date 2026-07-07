const fs = require("fs");
const unzipFile = require("../../utils/unzipFile");

async function uploadWeights(req, res) {
    try {
        var PName = req.body.PName,
            Admin = req.body.Admin,
            user = req.cookies.Username,
            weightsFile = req.files.upload_weights;

        var publicPath = currentPath,
            mainPath = publicPath + "public/projects/",
            projectPath = mainPath + Admin + "-" + PName,
            trainingPath = projectPath + "/training",
            weightsPath = trainingPath + "/weights/",
            weightsFilePath = weightsPath + weightsFile.name;

        const allowedExtensions = ["h5", "weights", "pt", "pipe", "conf", "habry", "zip"];
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

        await weightsFile.mv(weightsFilePath);

        if (fileExtension === "zip") {
            await unzipFile(weightsFilePath, weightsPath);
            res.send({ Success: "Your model archive has been uploaded, extracted, and saved" });
        } else {
            res.send({ Success: "Your script has been uploaded and saved" });
        }
    } catch (err) {
        global.logger.error(err);
        res.send({ Success: `ERROR: Failed to save weights file: ${err.message}` });
    }
}

module.exports = uploadWeights;
