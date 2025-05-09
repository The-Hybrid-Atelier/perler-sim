const express = require('express');
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const upload = multer({ dest: os.tmpdir() });

// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, 'build')));

// Health check
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

app.post('/convert-svg-to-stl', upload.single('svg'), (req, res) => {
  if (!req.file || req.file.size === 0) {
    return res.status(400).send('Uploaded file is empty');
  }

  const { beadHeight } = req.body;
  if (!beadHeight || isNaN(beadHeight)) {
    return res.status(400).send('Invalid bead height');
  }

  const svgFilePath = `${req.file.path}.svg`;
  const stlFilePath = path.join(os.tmpdir(), `${path.basename(svgFilePath, '.svg')}.stl`);
  const scadFilePath = path.join(os.tmpdir(), `${path.basename(svgFilePath, '.svg')}.scad`);

  const scadContent = `
  $fn = 100;
  Beads_Height = ${beadHeight};
  module perler_bead(){
    linear_extrude(height = Beads_Height, center = true)
      import("${svgFilePath}", scale=10);
  }
  perler_bead();
  `;

  try {
    fs.writeFileSync(scadFilePath, scadContent);
  } catch (error) {
    return res.status(500).send('Error writing SCAD file');
  }

  fs.rename(req.file.path, svgFilePath, (err) => {
    if (err) return res.status(500).send('Error renaming SVG file');

    exec(`openscad -o ${stlFilePath} ${scadFilePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`OpenSCAD command failed: ${error.message}`);
        console.error(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        return res.status(500).send('Error converting SVG to STL');
      }

      res.download(stlFilePath, (err) => {
        if (err) return res.status(500).send('Error sending STL file');

        try {
          fs.unlinkSync(svgFilePath);
          fs.unlinkSync(stlFilePath);
          fs.unlinkSync(scadFilePath);
        } catch (unlinkError) {
          console.error('Error cleaning up files:', unlinkError);
        }
      });
    });
  });
});

// Serve React index.html for all other GET requests (SPA fallback)
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'build', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
