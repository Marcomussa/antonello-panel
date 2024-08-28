import dotenv from 'dotenv';
dotenv.config();
import postModel from "../db/models/Post.mjs"
import path, { dirname } from 'path';
import fs from 'fs';
import { v2 as cloudinary } from 'cloudinary';

const __dirname = path.resolve();
const { CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET } = process.env

cloudinary.config({
    cloud_name: CLOUDINARY_CLOUD_NAME,
    api_key: CLOUDINARY_API_KEY,
    api_secret: CLOUDINARY_API_SECRET,
});

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
    try {
        const { title, description } = req.body;
        const image = req.file.filename;
        const imagePath = path.join(__dirname, '/public/uploads', image);

        const uploadImage = await cloudinary.uploader.upload(imagePath);

        const newPost = new postModel({
            title,
            image,
            imageUrl: uploadImage.secure_url,
            description,
        });

        newPost.save();

        res.redirect("/admin");
    } catch (error) {
        console.error('Error al crear el post:', error);
        res.status(500).send('Error al crear el post');
    }
};

const updatePost = async (req, res) => {
    const { id } = req.params;
    const { title, description } = req.body;

    const updateData = { title, description };

    try {
        const updatedPost = await postModel.findByIdAndUpdate(id, updateData, { new: true });

        if (!updatedPost) {
            return res.status(404).send('Post not found');
        }

        res.redirect("/admin");
    } catch (err) {
        res.status(500).send(err);
    }
};

const updatePostImage = async (req, res) => {
    const { id, imageId } = req.params;
    const image = req.file ? req.file.filename : null;

    if (!image) {
        return res.status(400).json({ error: 'No image file provided' });
    }

    const post = await postModel.findById(id);
    const oldImageFile = path.join(__dirname, '/public/uploads', post.image);

    try {
        const uploadNewImage = await cloudinary.uploader.upload(path.join(__dirname, '/public/uploads', image));
        const updatedPost = await postModel.findByIdAndUpdate(id, {
            image,
            imageUrl: uploadNewImage.secure_url
        },
            { new: true });

        if (!updatedPost) {
            return res.status(404).send('Post not found');
        }

        fs.access(oldImageFile, fs.constants.F_OK, (err) => {
            if (!err) {
                fs.unlink(oldImageFile, (err) => {
                    if (err) {
                        console.error('Error deleting file:', err);
                        return res.status(500).json({ error: 'Error deleting file' });
                    }
                });
            }
        });

        res.redirect("/admin");
    } catch (err) {
        res.status(500).send(err);
    }
};


const deletePost = async (req, res) => {
    const { id, imageId } = req.params
    const imagePath = path.join(__dirname, '/public/uploads', `${imageId}`)

    try {
        const deletedPost = await postModel.findByIdAndDelete(id)
        if (!deletedPost) {
            return res.status(404).send('Post not found')
        }

        cloudinary.uploader.destroy(imagePath);

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

export default { getAllPosts, updatePost, updatePostImage, createPost, deletePost, searchPost };
