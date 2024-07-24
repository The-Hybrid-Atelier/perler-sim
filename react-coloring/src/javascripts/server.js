const express = require('express');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const upload = multer({ dest: os.tmpdir() });

app.use(require('cors')());
//comment

app.get('/', (req, res) => {
  res.send('Server is running');
});

app.post('/convert-svg-to-stl', upload.single('svg'), (req, res) => {
  console.log('Received SVG file:', req.file);

  const svgFilePath = `${req.file.path}.svg`; 
  const stlFilePath = path.join(os.tmpdir(), `${path.basename(svgFilePath, '.svg')}.stl`);
  const scadFilePath = path.join(os.tmpdir(), `${path.basename(svgFilePath, '.svg')}.scad`);

  const scadContent = `
  /*[Hidden]*/
  $fn = 100;
  /* [Parameters] */
  Beads_Height= 5.2;
  module perler_bead(){
      linear_extrude(height = Beads_Height, center = true)
          import("${svgFilePath}", scale=10);
  }
  perler_bead();
  `;

  console.log('SCAD file content:', scadContent); // Log the SCAD file content

  try {
    fs.writeFileSync(scadFilePath, scadContent);
    console.log('SCAD file created:', scadFilePath);
  } catch (error) {
    console.error('Error writing SCAD file:', error);
    return res.status(500).send('Error writing SCAD file');
  }

  // Rename the uploaded file to include the .svg extension
  fs.rename(req.file.path, svgFilePath, (err) => {
    if (err) {
      console.error('Error renaming SVG file:', err);
      return res.status(500).send('Error renaming SVG file');
    }

    console.log('Executing OpenSCAD command...');
    exec(`openscad -o ${stlFilePath} ${scadFilePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        console.error(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        return res.status(500).send('Error converting SVG to STL');
      }

      console.log('STL file created:', stlFilePath);
      res.download(stlFilePath, (err) => {
        if (err) {
          console.error(`Error sending STL file: ${err}`);
          return res.status(500).send('Error sending STL file');
        }

        // Clean up files
        try {
          fs.unlinkSync(svgFilePath);
          fs.unlinkSync(stlFilePath);
          fs.unlinkSync(scadFilePath);
          console.log('Temporary files deleted');
        } catch (unlinkError) {
          console.error('Error deleting temporary files:', unlinkError);
        }
      });
    });
  });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});
























