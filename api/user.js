const router = require("express").Router();

// Get Users List
router.get('/', async (req, res, next) => {
  try {
    res.json({
      users: [
        { name: 'John' },
        { name: 'Jane' },
      ]
    });
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
    next(e);
  }
});

// Get User by ID
router.get('/:userId', async (req, res, next) => {
  try {
    const userId = req.params.userId;
    res.json({
      id: userId,
      name: 'John'
    });
  } catch (e) {
    res.status(500).json({ error: "Internal server error" });
    next(e);
  }
});

module.exports = router;