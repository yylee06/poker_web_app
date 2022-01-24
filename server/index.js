const path = require('path')
const express = require("express");
const PORT = 3080;
const app = express();

app.use(express.static(path.resolve(__dirname, '../client/public')));
app.use(express.static('public'));

app.get("/", )

app.get("/api", (req, res) => {
    res.json({message: "Hello from server!"});
});

app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../client/public', 'index.html'));
});

app.listen(PORT, () => {
    console.log(`Server listening on ${PORT}`);
});