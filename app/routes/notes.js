var express = require('express');
var router = express.Router();
const Note = require('../models/note');
const withAuth = require('../middlewares/auth');

router.post('/', withAuth, async (req, res) => {
    const { title, body } = req.body;

    console.log('Received POST request with title:', title); // Logging request receipt

    try {
        let note = new Note({ title: title, body: body, author: req.user._id });
        await note.save();
        console.log('Note saved successfully'); // Logging after note is saved
        res.status(200).json(note); // Ensure the response is sent back
    } catch (error) {
        console.error('Error saving note:', error); // Logging error
        res.status(500).json({ error: 'Problem to create a new note' });
    }
});

router.get('/search', withAuth, async(req, res) => {
    const { query } = req.query;
    try {
        let notes = await Note
            .find({ author: req.user._id })
            .find({ $text: {$search: query} });
        res.json(notes);
    } catch (error) {
        res.json({error: error}).status(500);
    }
})

router.get('/:id', withAuth, async(req, res) => {
    try {
        const { id } = req.params;
        let note = await Note.findById(id);
        if (isOwner(req.user, note))
            res.json(note);
        else
            res.status(403).json({error: 'Permission denied'})
    } catch (error) {
        res.status(500).json({error: 'Problem to get the note'})
    }
})
 
router.get('/', withAuth, async(req, res) => {
    try {
        let notes = await Note.find({author: req.user._id})
        res.json(notes)
    } catch (error) {
        res.json({error: error}).status(500);
    }
})

router.put('/:id', withAuth, async(req, res) => {
    const { title, body } = req.body;
    const { id } = req.params;
    try {
        let note = await Note.findById(id);
        if (isOwner(req.user, note)) {
            let updatedNote = await Note.findOneAndUpdate(
                { _id: id },
                { $set: { title: title, body: body } },
                { upsert: true, new: true }
            );
            res.json(updatedNote);
        } else {
            res.status(403).json({error: 'Permission denied'})
        }
    } catch (error) {
        res.status(500).json({error: 'Problem to update the note'})
    }
})

router.delete('/:id', withAuth, async (req, res) => {
    const { id } = req.params;

    try {
        let note = await Note.findById(id);
        if (!note) {
            return res.status(404).json({ error: 'Note not found' });
        }

        if (isOwner(req.user, note)) {
            await Note.deleteOne({ _id: id });
            res.json({ message: 'OK' }).status(204);
        } else {
            res.status(403).json({ error: 'Permission denied' });
        }
    } catch (error) {
        res.status(500).json({ error: 'Problem to delete the note' });
    }
});

const isOwner = (user, note) => {
    if (JSON.stringify(user._id) == JSON.stringify(note.author._id))
        return true;
    else
        return false;
}

module.exports = router;