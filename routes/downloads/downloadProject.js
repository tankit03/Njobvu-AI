const { spawn } = require("child_process");
const queries = require("../../queries/queries");

async function downloadProject(req, res) {
    var PName = req.body.PName;
    var admin = req.body.Admin;
    var username = req.cookies.Username;

    var publicPath = currentPath,
        mainPath = publicPath + "public/projects/",
        projectPath = mainPath + admin + "-" + PName,
        downloadPath = mainPath + username + "_Downloads";
    (imagesPath = projectPath + "/images/"),
        (bootstrapPath = projectPath + "/bootstrap"),
        (trainingPath = projectPath + "/training"),
        (pythonPath = trainingPath + "/python"),
        (logsPath = trainingPath + "/logs"),
        (projectDb = `${projectPath}/${PName}.db`),
        (dumpFile = `${PName}.dump`),
        (dumpPath = `${projectPath}/${dumpFile}`);

    if (!fs.existsSync(downloadPath)) {
        fs.mkdir(downloadPath, (err) => {
            if (err) {
                console.log(err);
            }
        });
    }

    let tableExists;
    try {
        tableExists = await queries.project.checkTableExists(projectPath, 'Labels');
    } catch (err) {
        console.log("Error checking table existence:", err);
        // return res.status(500).send({ Error: "Database error" });
    }

    if (tableExists.rows[0].count == 0) {
        res.send({ Success: "No Labels table" });
    } else {
        var output = fs.createWriteStream(downloadPath + "/" + PName + ".zip");

        var archive = archiver("zip");

        output.on("close", function () {
            return res.download(downloadPath + "/" + PName + ".zip");
        });

        archive.on("error", function (err) {
            console.log(err);
            return;
        });

        archive.pipe(output);

        archive.directory(projectPath, false);

        archive.finalize();
    }
}

module.exports = downloadProject;
