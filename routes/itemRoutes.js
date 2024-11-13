var express = require("express");
var router = express.Router();
var itemController = require("../controllers/itemController");

router.get("/", itemController.getAllItems);
router.get("/:id", itemController.getItemById);
router.post("/", itemController.createItem);
router.patch("/:id", itemController.updateItem);
router.delete("/:id", itemController.deleteItem);

module.exports = router;
