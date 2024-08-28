import postModel from "../db/models/Post.mjs"
import path, { dirname } from 'path';
import fs from 'fs';

const __dirname = path.resolve();

const getAllPosts = async (req, res) => {
    try {
        const posts = await postModel.find({}).sort({ createdAt: -1 })
        res.render("admin", {
            posts
        })
    } catch (error) {
        return res.status(400).json({
            error: error.message
        })
    }
}

const searchPost = async (req, res) => {
    const { title } = req.query
    const result = await postModel.find({
        title: new RegExp(title, "i")
    })

    res.render("admin", {
        posts: [],
        result
    })
}

const createPost = async (req, res) => {
    const { title, description } = req.body
    const imagePath = req.file.filename

    const newPost = new postModel({
        title,
        image: imagePath,
        description
    })

    newPost.save()

    res.redirect("/admin")
}

const updatePost = async (req, res) => {
    const { id, imageId } = req.params
    const { title, description } = req.body
    const imagePath = req.file ? req.file.filename : null

    const imageFile = path.join(__dirname, '../public/uploads', `${imageId}`)

    const updateData = {
        title,
        description
    }

    if (imagePath) {
        updateData.image = imagePath
    }

    try {
        const updatedPost = await postModel.findByIdAndUpdate(id, updateData, { new: true })

        if (imagePath) {
            fs.access(imageFile, fs.constants.F_OK, (err) => {
                if (err) {
                    return res.status(404).json({ error: 'File not found' })
                }

                fs.unlink(imageFile, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err)
                        return res.status(500).json({ error: 'Error deleting file' })
                    }
                })
            })
        }

        if (!updatedPost) {
            return res.status(404).send('Post not found')
        }

        res.redirect("/admin")
    } catch (err) {
        res.status(500).send(err)
    }
}

const deletePost = async (req, res) => {
    const { id, imageId } = req.params
    const imagePath = path.join(__dirname, '../public/uploads', `${imageId}`)
    try {
        const deletedPost = await postModel.findByIdAndDelete(id)
        if (!deletedPost) {
            return res.status(404).send('Post not found')
        }

        fs.access(imagePath, fs.constants.F_OK, (err) => {
            if (err) {
                return res.status(404).json({ error: 'File not found' });
            }

            fs.unlink(imagePath, (err) => {
                if (err) {
                    console.error('Error deleting file:', err);
                    return res.status(500).json({ error: 'Error deleting file' });
                }

                res.redirect("/admin");
            });
        })
    } catch (err) {
        res.status(500).send(err)
    }
}

async function findThreeRandomPosts() {
    try {
        const count = await postModel.countDocuments()
        const randomIndexes = []
        while (randomIndexes.length < 3) {
            const randomIndex = Math.floor(Math.random() * count)
            if (!randomIndexes.includes(randomIndex)) {
                randomIndexes.push(randomIndex)
            }
        }

        const randomPosts = await postModel.find().skip(randomIndexes[0]).limit(1)
            .then(firstPost => postModel.find().skip(randomIndexes[1]).limit(1)
                .then(secondPost => postModel.find().skip(randomIndexes[2]).limit(1)
                    .then(thirdPost => [firstPost, secondPost, thirdPost])))

        return randomPosts.flat()
    } catch (err) {
        console.error('Error finding random posts:', err)
        throw err
    }
}

export default { getAllPosts, updatePost, createPost, deletePost, searchPost };
