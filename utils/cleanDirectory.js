const path = require("path");
const fs = require("fs");

async function cleanDirectory(directory) {
    try {
        // Clean the directory path itself first
        const dirName = path.basename(directory);
        const parentDir = path.dirname(directory);
        const cleanedDirName = dirName.trim().replace(/[ 0+]/g, "_");

        // If directory name needs cleaning, rename it first
        let currentDirectory = directory;
        if (dirName !== cleanedDirName) {
            const newDirPath = path.join(parentDir, cleanedDirName);
            await fs.promises.rename(directory, newDirPath);
            currentDirectory = newDirPath;
            console.log(`Renamed directory: ${directory} -> ${newDirPath}`);
        }

        const files = await fs.promises.readdir(currentDirectory);

        for (const file of files) {
            const filePath = path.join(currentDirectory, file);
            const stats = await fs.promises.stat(filePath);

            // Process subdirectories
            if (stats.isDirectory()) {
                if (file === "__MACOSX") continue;

                // Clean subdirectory name first
                if (
                    file !== file.trim() ||
                    file.includes(" ") ||
                    file.includes("0") ||
                    file.includes("+")
                ) {
                    const newDirName = file.trim().replace(/[ 0+]/g, "_");
                    const newDirPath = path.join(currentDirectory, newDirName);
                    await fs.promises.rename(filePath, newDirPath);
                    await cleanDirectory(newDirPath);
                } else {
                    await cleanDirectory(filePath);
                }
                continue;
            }

            if (
                file === ".DS_Store" ||
                file === "._.DS_Store" ||
                file.startsWith("._") ||
                file === "Thumbs.db" ||
                file === "desktop.ini"
            ) {
                await fs.promises.unlink(filePath);
                //   console.log(`Removed system file: ${filePath}`);
                continue;
            }

            // Clean filename: Remove trailing/leading spaces and replace spaces, 0s and + with _
            if (
                file !== file.trim() ||
                file.includes(" ") ||
                file.includes("0") ||
                file.includes("+")
            ) {
                const newFileName = file.trim().replace(/[ 0+]/g, "_");
                const newFilePath = path.join(currentDirectory, newFileName);

                await fs.promises.rename(filePath, newFilePath);
            }
        }

        //   console.log(`Directory cleaned: ${currentDirectory}`);
        return currentDirectory;
    } catch (error) {
        console.error(`Error cleaning directory ${directory}:`, error);
        throw error;
    }
}

module.exports = cleanDirectory;
