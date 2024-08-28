import express from "express";
import postModel from "../db/models/Post.mjs"

const router = express.Router()

const getAllPosts = async (req, res) => {
    try {
        const posts = await postModel.find({}).sort({ createdAt: -1 })
        res.json(posts)
    } catch (error) {
        return res.status(400).json({
            error: error.message
        })
    }
}

router.get("/", getAllPosts)

export default router