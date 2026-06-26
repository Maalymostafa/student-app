const db = require("../database/db");

function getChildrenForParent(parentId) {
  return db.prepare("SELECT studentCode, studentName, grade FROM parent_children WHERE parentId = ? ORDER BY studentName").all(parentId);
}

module.exports = {
  getChildrenForParent,
};
