const express = require('express');
const path = require("path");
const cookieParser = require("cookie-parser")
const fileUpload = require("express-fileupload")
const app = express();

// init API routes

const api = require("./routes/api");

// page's variable's to render on routes

const {
    getClassificationPage,
    getLoginPage,
    getSignupPage,
    getHomePage,
    getCreatePage,
    getProjectPage,
    getAnnotatePage,
    getReviewPage,
    getConfigPage,
    getDownloadPage,
    getLabelingPage,
    getStatsPage,
    getTrainingPage,
    getProcessingPage,
    getYolo3SettingsPage,
    getYoloXSettingsPage,
    getServerInfoPage,
    getYoloPage,
    getUserPage,
    getProjectSettingsPage,
    getClassSettingsPage,
    getAccessSettingsPage,
    getImageSettingsPage,
    getMergeSettingsPage,
    getServerStatsPage,
    get404Page,
    getValidationHomePage,
    getValidationProjectPage,
    getValidationLabelingPage,
    getValidationConfigPage,
    getValidationStatsPage,
    getInferencePage,
    getCustomTrainingPage,
    getYoloXInferenceSettingsPage,
    getYoloXTrainingSettingsPage,
} = require("./routes/pages");

// middleware

app.set("views", __dirname + "/views"); // set express to look in this folder to render our view
app.set("view engine", "ejs"); // configure template engine
app.use(express.urlencoded({ extended: false }));
app.use(fileUpload());
app.use(express.json()); // parse form data client
app.use(express.static(path.join(__dirname, "public"))); // configure express to use public folder
app.use(cookieParser());
//app.use(session({secret:"Secret Code Don't Tell Anyone", cookie: { maxAge: 30 * 1000 }})); // configure fileupload
app.use("/", api);

//routes to get all the page's 

app.get("/", getLoginPage);
app.get("/signup", getSignupPage);
app.get("/home", getHomePage);
app.get("/create", getCreatePage);
app.get("/annotate", getAnnotatePage);
app.get("/review", getReviewPage);
app.get("/project", getProjectPage);
app.get("/config", getConfigPage);
app.get("/config/projSettings", getProjectSettingsPage);
app.get("/config/classSettings", getClassSettingsPage);
app.get("/config/accessSettings", getAccessSettingsPage);
app.get("/config/imageSettings", getImageSettingsPage);
app.get("/config/mergeSettings", getMergeSettingsPage);
app.get("/download", getDownloadPage);
app.get("/labeling", getLabelingPage);
app.get("/stats", getStatsPage);
app.get("/customTraining", getCustomTrainingPage);
app.get("/training", getTrainingPage);
// app.get("/processing", getProcessingPage);
app.get("/inference", getInferencePage);
app.get("/yolo", getYoloPage);
app.get("/yolo/yolov3Settings", getYolo3SettingsPage);
app.get("/yolo/yolovXSettings", getYoloXSettingsPage);
app.get("/yolo/yolovXInferenceSettings", getYoloXInferenceSettingsPage);
app.get("/yolo/yolovXTrainingSettings", getYoloXTrainingSettingsPage);
app.get("/user", getUserPage);
app.get("/servstats", getServerStatsPage);
app.get("/homeV", getValidationHomePage);
app.get("/projectV", getValidationProjectPage);
app.get("/labelingV", getValidationLabelingPage);
app.get("/configV", getValidationConfigPage);
app.get("/statsV", getValidationStatsPage);
app.get("/createClassification", getClassificationPage);
app.get("/api/gpuinfo");
// everything else -> 404
app.get("*", get404Page);

module.exports = app;