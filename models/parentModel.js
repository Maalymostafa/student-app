const parentChildren = {
  "usr_parent_001": [
    {
      studentCode: "STU-2026-001",
      studentName: "Lina Ahmed",
      grade: "Grade 7",
    },
    {
      studentCode: "STU-2026-002",
      studentName: "Omar Hassan",
      grade: "Grade 7",
    },
  ],
};

function getChildrenForParent(parentId) {
  return parentChildren[parentId] || [];
}

module.exports = {
  getChildrenForParent,
};
