var express = require("express");
var router = express.Router();
var typeController = require("../controllers/typeController");

router.get("/", typeController.getAllTypes);
router.get("/:id", typeController.getTypeById);
router.post("/", typeController.createType);
router.patch("/:id", typeController.updateType);
router.delete("/:id", typeController.deleteType);

module.exports = router;
