const queries = require("../../queries/queries");

async function updateLabels(req, res) {
    var IDX = parseInt(req.body.IDX),
        PName = req.body.PName,
        admin = req.body.Admin,
        user = req.cookies.Username;

    var publicPath = currentPath,
        mainPath = publicPath + "public/projects/";

    var user = req.body.user,
        CName = req.body.CName,
        IName = req.body.IName,
        reviewImage = req.body.reviewImage,
        prev_IName = req.body.prev_IName,
        next_IName = req.body.next_IName,
        changeWidth = req.body.origin_image_width / req.body.image_width,
        labelsCounter = parseInt(req.body.labels_counter),
        currClass = req.body.curr_class,
        sortFilter = req.body.sortFilter,
        classFilter = req.body.classFilter,
        imageClass = req.body.imageClass,
        formAction = req.body.form_action;

    var projectPath = mainPath + admin + "-" + PName;

    try {
        await queries.project.updateReviewImage(
            projectPath,
            reviewImage,
            IName,
        );

        const confidence = await queries.project.getAllValidationsForImage(
            projectPath,
            IName,
        );
        await queries.project.deleteAllLabelsForImage(IName);
        await queries.project.deleteAllValidationsForImage(IName);

        var conf = {};

        if (confidence != []) {
            for (var x = 0; x < confidence.rows.length; x++) {
                conf[confidence.rows[x].LID] = confidence.rows[x];
            }
        }

        var currentConfidence = [];

        for (var j = 0; j < labelsCounter; j++) {
            var tempLID = "";
            var width = 0;
            var height = 0;

            if (labelsCounter == 1) {
                tempLID = req.body.LabelingID;
                width = req.body.W;
                height = req.body.H;
            } else {
                tempLID = req.body.LabelingID[j];
                width = req.body.W[j];
                height = req.body.H[j];
            }

            if (!(width > 0) || !(height > 0)) {
                currentConfidence.push([]);
                continue;
            }

            if (tempLID in conf) {
                currentConfidence.push([conf[tempLID]]);
            } else {
                currentConfidence.push([]);
            }
        }

        const currentLabels = await queries.project.getAllLabels(projectPath);
        let newMax;

        if (currentLabels.rows.length == 0) {
            newMax = 1;
        } else {
            const oldMax = await queries.project.getMaxLabelId(projectPath);

            newMax = oldMax.rows[0].LID + 1;
        }

        if (labelsCounter > 1) {
            for (var i = 0; i < labelsCounter; i++) {
                if (!(req.body.W[i] > 0) || !(req.body.H[i] > 0)) continue;

                await queries.project.createLabel(
                    projectPath,
                    Number(newMax),
                    CName[i],
                    Number(req.body.X[i]),
                    Number(req.body.Y[i]),
                    Number(req.body.W[i]),
                    Number(req.body.H[i]),
                    IName,
                );

                if (currentConfidence[i][0] && currentConfidence.length > 0) {
                    await queries.project.createValidation(
                        projectPath,
                        Number(currentConfidence[i][0].Confidence),
                        Number(newMax),
                        currentConfidence[i][0].CName,
                        currentConfidence[i][0].IName,
                    );
                }

                newMax = newMax + 1;
            }
        } else if (labelsCounter == 1) {
            await queries.project.createLabel(
                projectPath,
                Number(newMax),
                CName,
                Number(req.body.X),
                Number(req.body.Y),
                Number(req.body.W),
                Number(req.body.H),
                IName,
            );

            if (currentConfidence[0][0] && currentConfidence.length > 0) {
                var cc = currentConfidence[0][0];

                await queries.project.createValidation(
                    projectPath,
                    Number(cc.Confidence),
                    Number(newMax),
                    cc.CName,
                    cc.IName,
                );
            }
        }

        if (formAction == "save") {
            return res.redirect(
                "/labeling?IDX=" +
                    IDX +
                    "&IName=" +
                    IName +
                    "&curr_class=" +
                    currClass,
            );
        } else if (formAction == "auto-prev") {
            return res.redirect(
                "/labeling?IDX=" +
                    IDX +
                    "&IName=" +
                    prev_IName +
                    "&curr_class=" +
                    currClass,
            );
        } else if (formAction == "auto-next") {
            return res.redirect(
                "/labeling?IDX=" +
                    IDX +
                    "&IName=" +
                    next_IName +
                    "&curr_class=" +
                    currClass,
            );
        } else if (formAction == "saveV") {
            return res.redirect(
                "/labelingV?IDX=" +
                    IDX +
                    "&IName=" +
                    IName +
                    "&curr_class=" +
                    currClass +
                    "&sort=" +
                    sortFilter +
                    "&class=" +
                    imageClass +
                    "&classFilter=" +
                    classFilter,
            );
        } else if (formAction == "auto-prevV") {
            return res.redirect(
                "/labelingV?IDX=" +
                    IDX +
                    "&IName=" +
                    prev_IName +
                    "&curr_class=" +
                    currClass +
                    "&sort=" +
                    sortFilter +
                    "&class=" +
                    imageClass +
                    "&classFilter=" +
                    classFilter,
            );
        } else if (formAction == "auto-nextV") {
            return res.redirect(
                "/labelingV?IDX=" +
                    IDX +
                    "&IName=" +
                    next_IName +
                    "&curr_class=" +
                    currClass +
                    "&sort=" +
                    sortFilter +
                    "&class=" +
                    imageClass +
                    "&classFilter=" +
                    classFilter,
            );
        }
    } catch (err) {
        console.error(err);
        return res.status(500).send("Error updating labels");
    }
}

module.exports = updateLabels;
