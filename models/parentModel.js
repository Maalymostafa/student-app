const db = require("../database/client");

async function getChildrenForParent(parentId) {
  return db.all("SELECT studentCode, studentName, grade FROM parent_children WHERE parentId = ? ORDER BY studentName", [parentId]);
}

module.exports = {
  getChildrenForParent,
};
