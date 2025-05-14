async function run(req, res) {
    console.log("run script");

    const { exec } = require("child_process");

    console.log("date: ", Date.now());
    var date = Date.now();

    var PName = req.body.PName,
        Admin = req.body.Admin,
        user = req.cookies.Username,
        python_path = req.body.python_path,
        script = req.body.script,
        log = `${date}.log`,
        weights = req.body.weights,
        TrainingPercent = parseFloat(req.body.TrainingPercent);

    if (TrainingPercent > 1) {
        TrainingPercent = TrainingPercent / 100;
    }
    var options = "";

    if (req.body.options) {
        options = req.body.options;
    } else {
        options = "EMPTY";
    }
    console.log("options: ", options);
    var public_path = __dirname.replace("routes", ""),
        main_path = public_path + "public/projects/", // $LABELING_TOOL_PATH/public/projects/
        project_path = main_path + Admin + "-" + PName, // $LABELING_TOOL_PATH/public/projects/project_name
        images_path = project_path + "/images", // $LABELING_TOOL_PATH/public/projects/project_name/images
        abs_images_path = path.join(__dirname, images_path),
        downloads_path = main_path + user + "_Downloads",
        training_path = project_path + "/training",
        logs_path = training_path + "/logs",
        run_path = `${logs_path}/${date}`,
        weights_file = training_path + "/weights/" + weights,
        python_script = training_path + "/python/" + script,
        wrapper_path =
            public_path + "controllers/training/train_data_from_project.py",
        project_db = `${project_path}/${PName}.db`;

    if (!fs.existsSync(run_path)) {
        fs.mkdirSync(run_path);
    }

    fs.writeFile(`${run_path}/${log}`, "", (err) => {
        if (err) throw err;
    });

    ///////////////////Connect to database /////////////////////////////////////////

    var rundb = new sqlite3.Database(project_db, (err) => {
        if (err) {
            return console.error(err.message);
        }
        console.log("Connected to rundb.");
    });
    rundb.getAsync = function (sql) {
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
    rundb.allAsync = function (sql) {
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
    rundb.runAsync = function (sql) {
        var that = this;
        return new Promise(function (resolve, reject) {
            that.run(sql, function (err, row) {
                if (err) {
                    console.log("runAsync ERROR! ", err);
                    reject(err);
                } else resolve(row);
            });
        }).catch((err) => {
            console.error(err);
        });
    };

    ///////////////Create Tensorflow training csv /////////////////////////////////

    var labels = await rundb.allAsync("SELECT * FROM Labels");
    var xmin = 0;
    var xmax = 0;
    var ymin = 0;
    var ymax = 0;
    var data = "filename,width,height,class,xmin,ymin,xmax,ymax\n";
    var i = 0;
    var image = "";
    for (i = 0; i < Math.floor(labels.length * TrainingPercent); i++) {
        image = path.join(abs_images_path, labels[i].IName);
        xmin = labels[i].X;
        xmax = xmin + labels[i].W;
        ymin = labels[i].Y;
        ymax = ymin + labels[i].Y;
        data =
            data +
            image +
            "," +
            labels[i].W +
            "," +
            labels[i].H +
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
    var training_csv = run_path + "/" + PName + "_train.csv";
    fs.writeFile(training_csv, data, (err) => {
        if (err) throw err;
        console.log("done writing csv");
    });

    ///////////////Create Tensorflow Validate csv /////////////////////////////////
    var data = "filename,width,height,class,xmin,ymin,xmax,ymax\n";
    for (var j = i; j < labels.length; j++) {
        image = path.join(abs_images_path, labels[j].IName);
        xmin = labels[j].X;
        xmax = xmin + labels[j].W;
        ymin = labels[j].Y;
        ymax = ymin + labels[j].Y;
        data =
            data +
            image +
            "," +
            labels[j].W +
            "," +
            labels[j].H +
            "," +
            labels[j].CName +
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
    var validation_csv = run_path + "/" + PName + "_validate.csv";
    fs.writeFile(validation_csv, data, (err) => {
        if (err) throw err;
        console.log("done writing csv");
    });

    rundb.close((err) => {
        if (err) {
            console.log(err);
        } else {
            console.log("rundb closed successfully");
        }
    });

    //Create error file name
    var err_file = `${date}-error.log`;

    // Call Chris's script here
    // Pass in python path, script, and options

    //TODO: Add weights, training.csv, and validate.csv options to command
    options = options.replace("<data_dir>", images_path);
    options = options.replace("<training_csv>", training_csv);
    options = options.replace("<validation_csv>", validation_csv);
    options = options.replace("<output_dir>", run_path);
    options = options.replace("<weights>", weights_file);

    var cmd = `${wrapper_path} -p ${python_path} -s ${python_script} -l ${run_path}/${log} -o "${options}"`;
    var success = "Training complete";
    var error = "";
    process.chdir(run_path);

    var child = exec(cmd, (err, stdout, stderr) => {
        if (err) {
            console.log(`This is the error: ${err.message}`);
            success = err.message;
            fs.writeFile(`${run_path}/${err_file}`, success, (err) => {
                if (err) throw err;
            });
        } else if (stderr) {
            console.log(`This is the stderr: ${stderr}`);
            fs.writeFile(`${run_path}/${err_file}`, stderr, (err) => {
                if (err) throw err;
            });
            //return;
        }
        console.log("stdout: ", stdout);
        console.log("stderr: ", stderr);
        console.log("err: ", err);
        console.log("The script has finished running");
        fs.writeFile(`${run_path}/done.log`, success, (err) => {
            if (err) throw err;
        });
    });

    res.send({ Success: `Training Started` });
    process.chdir(`${public_path}routes`);
}

module.exports = run;
