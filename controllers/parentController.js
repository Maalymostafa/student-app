const path = require("path");
const { getChildrenForParent } = require("../models/parentModel");
const { getStudentResults } = require("../models/gradingModel");

function showParentPortal(req, res) {
  return res.sendFile(path.join(__dirname, "..", "views", "parent-portal.html"));
}

function getParentOverview(req, res) {
  const children = getChildrenForParent(req.session.user.id).map((child) => ({
    ...child,
    results: getStudentResults(child.studentCode),
  }));

  return res.json({
    parent: req.session.user,
    children,
  });
}

module.exports = {
  showParentPortal,
  getParentOverview,
};
