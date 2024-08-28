import express from "express";
import { checkAuthenticated } from '../middlewares/auth.mjs';

const router = express.Router()
router.use(checkAuthenticated)

router.get("/admin", (req, res) => res.render("admin"))

export default router