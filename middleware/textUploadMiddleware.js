const multer = require("multer");

const textUpload = multer({
  storage: multer.memoryStorage(),
  fileFilter(req, file, cb) {
    const isTextFile =
      file.mimetype === "text/plain" ||
      file.originalname.toLowerCase().endsWith(".txt");

    if (!isTextFile) {
      return cb(new Error("Only Zoom chat text files are allowed"));
    }

    return cb(null, true);
  },
});

module.exports = textUpload;
