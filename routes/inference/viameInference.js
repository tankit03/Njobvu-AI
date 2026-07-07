const fs = require("fs");
const queries = require("../../queries/queries");
const { exec } = require("child_process");
const path = require("path");

async function viameInference(req, res) {
    try {
        let date = Date.now();

        let PName = req.body.PName,
            Admin = req.body.Admin,
            log = `${date}.log`,
            inferenceFile = req.body.inference_file,
            device = req.body.device || "cpu",
            weightName = req.body.weights;

        var errFile = `${date}-error.log`;

        var publicPath = currentPath,
            mainPath = publicPath + "public/projects/",
            projectPath = mainPath + Admin + "-" + PName,
            trainingPath = projectPath + "/training",
            inferencePath = projectPath + "/inference",
            inferenceUploadPath = projectPath + "/inference/uploads/",
            logsPath = inferencePath + "/logs",
            runPath = `${logsPath}/${date}`,
            weightPath = trainingPath + "/weights/" + weightName,
            viameScript = publicPath + "controllers/inference/viame.py";

        let inferenceFilePath = inferenceFile;
        if (!fs.existsSync(inferenceFilePath)) {
            const fallbackInferenceFilePath = path.join(inferenceUploadPath, inferenceFilePath);
            if (fs.existsSync(fallbackInferenceFilePath)) {
                inferenceFilePath = fallbackInferenceFilePath;
            }
        }

        if (!fs.existsSync(logsPath)) {
            fs.mkdirSync(logsPath);
        }

        if (!fs.existsSync(runPath)) {
            fs.mkdirSync(runPath);
        }

        fs.writeFileSync(`${runPath}/${log}`, "");
        fs.writeFileSync(`${runPath}/type.txt`, "viame");

        let viameScriptCopyPath = runPath + "/viame.py";
        if (!fs.existsSync(viameScriptCopyPath)) {
            fs.copyFileSync(viameScript, viameScriptCopyPath);
        }

        let existingClasses;
        try {
            existingClasses = await queries.project.getAllClasses(projectPath);
        } catch (err) {
            global.logger.error(err);
            return res.status(500).send("Error fetching classes");
        }

        for (let i = 0; i < existingClasses.rows.length; i++) {
            fs.appendFileSync(`${runPath}/classes.txt`, `${existingClasses.rows[i].CName}\n`);
        }

        let cmd = `python3 ${viameScript} -i "${inferenceFilePath}" -n "${runPath}/classes.txt" -w "${weightPath}" -o "${runPath}/output" -d "${device}"`;

        let success = "";
        fs.writeFileSync(`${runPath}/${log}`, `${cmd}\n\n`);

        exec(cmd, (err, stdout, stderr) => {
            if (err) {
                global.logger.error(err);
                global.logger.debug(`Error: ${err.message}`);

                if (err.message != "stdout maxBuffer length exceeded") {
                    success = err.message;
                    fs.writeFileSync(`${runPath}/${errFile}`, success);
                }
            } else if (stderr) {
                global.logger.debug(`stderr: ${stderr}`);

                if (stderr != "stdout maxBuffer length exceeded") {
                    fs.writeFileSync(`${runPath}/${errFile}`, stderr);
                }
            }

            const completionData = {
                status: err ? 'error' : 'success',
                timestamp: date,
                zipAvailable: fs.existsSync(`${runPath}/inference_results.zip`),
                csvAvailable: fs.existsSync(`${runPath}/inference_stats.csv`)
            };

            fs.writeFileSync(`${runPath}/done.log`, JSON.stringify(completionData, null, 2));
        });

        res.send({ Success: `VIAME Inference Started` });
    } catch (err) {
        global.logger.error(err);
        return res.status(500).send("Error running inference");
    }
}

module.exports = viameInference;
