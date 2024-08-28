import express from "express";
import { checkAuthenticated } from '../middlewares/auth.mjs';
import multer from "../middlewares/multer.mjs"
import postsController from "../controller/posts.mjs"

const router = express.Router()

router.use(checkAuthenticated)

router.get('/', checkAuthenticated, postsController.getAllPosts)

router.get("/search", postsController.searchPost)

router.post("/create", multer.single("image"), postsController.createPost)

router.post("/update/:id", postsController.updatePost)

router.post("/update-image/:id", multer.single("image"), postsController.updatePostImage)

router.post("/delete/:id/", postsController.deletePost)

export default router