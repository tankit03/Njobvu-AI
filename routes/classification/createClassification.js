const fs = require("fs");
const unzipFile = require("../../utils/unzipFile");
const deleteDir = require("../../utils/deleteDir");
const pythonScript = require("../../utils/pythonScript");

async function createClassification(req, res) {
    if (!req.files || !req.files.upload_images) {
        return res.status(400).send("No file uploaded.");
    }
    if (!req.body.projectName) {
        return res.status(400).send("Project name not provided.");
    }
    if (!req.cookies.Username) {
        return res.status(400).send("Username cookie not found.");
    }

    let username = req.cookies.Username;
    let project_name = req.body.projectName;
    let db_name = project_name;

    let public_path = __dirname
            .replace("routes", "")
            .replace("classification", ""),
        main_path = public_path + "public/projects/",
        project_path = main_path + username + "-" + project_name;

    try {
        if (!fs.existsSync(main_path)) {
            fs.mkdirSync(main_path);
        }
        if (!fs.existsSync(project_path)) {
            fs.mkdirSync(project_path);
        }
    } catch (err) {
        console.error("Error creating directories:", err);
        return res.status(500).send("Error creating directories.");
    }

    const uploadedFile = req.files.upload_images;
    const targetPath = `${project_path}/${uploadedFile.name.trim().replace(/[ 0+]/g, "_")}`;

    try {
        await new Promise((resolve, reject) => {
            uploadedFile.mv(targetPath, (err) => {
                if (err) {
                    console.error("Error moving file:", err);
                    reject(new Error("Failed to move file."));
                } else {
                    console.log("File moved to path:", targetPath);
                    resolve();
                }
            });
        });

        if (!fs.existsSync(targetPath)) {
            console.error(`File not found at path: ${targetPath}`);
            return res.status(400).send("Uploaded file not found.");
        }
    } catch (error) {
        console.error("Error during file move:", error);
        await deleteDir(project_path);
        return res.status(500).send(error.message);
    }

    try {
        await unzipFile(targetPath, project_path);
    } catch (error) {
        console.error("Error during unzip process:", error);
        await deleteDir(project_path);
        return res.status(500).send("Error unzipping file: " + error.message);
    }

    let extractedFiles;
    try {
        extractedFiles = fs.readdirSync(project_path);
        console.log("Extracted files:", extractedFiles);
    } catch (error) {
        console.error("Error reading project path:", error);
        await deleteDir(project_path);
        return res
            .status(500)
            .send("Error reading project directory: " + error.message);
    }

    const inputDir = project_path + "/" + extractedFiles[0];
    const runType = "class";
    console.log("Using input directory:", inputDir);

    // Run the Python script and handle errors
    try {
        await pythonScript(inputDir, project_path, runType, db_name);
    } catch (error) {
        console.error("Error running python script:", error);
        await deleteDir(project_path);
        return res.status(500).send("Error processing file with python script");
    }

    // Delete temporary input folder; use promise-based fs method for better error handling.
    try {
        await fs.promises.rm(inputDir, { recursive: true });
        console.log("Folder deleted successfully");
    } catch (err) {
        console.error("Error deleting the folder:", err);
        await deleteDir(project_path);
        return res
            .status(500)
            .send("Error deleting temporary folder: " + err.message);
    }

    // Insert data into the database and handle any errors
    try {
        await db.runAsync(
            "INSERT INTO Access (Username, PName, Admin) VALUES ('" +
                username +
                "', '" +
                project_name +
                "', '" +
                username +
                "')",
        );
        const project_description = "none";
        const auto_save = 1;
        await db.allAsync(
            "INSERT INTO Projects (PName, PDescription, AutoSave, Admin) VALUES ('" +
                project_name +
                "', '" +
                project_description +
                "', '" +
                auto_save +
                "', '" +
                username +
                "')",
        );

        console.log(
            `Successfully granted access to ${username} for project ${project_name}`,
        );

        return res.status(200).json({
            success: true,
            message: "Access permission granted successfully",
        });
    } catch (error) {
        console.error("Database error while granting access:", error);
        await deleteDir(project_path);
        if (
            error.message &&
            error.message.includes("UNIQUE constraint failed")
        ) {
            return res.status(409).json({
                success: false,
                message: "User already has access to this project",
                error: error.message,
            });
        } else {
            await deleteDir(project_path);
            return res.status(500).json({
                success: false,
                message: "Failed to grant project access",
                error: error.message,
            });
        }
    }
}

module.exports = createClassification;
