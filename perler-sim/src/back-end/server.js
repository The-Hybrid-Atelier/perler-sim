const express = require('express');
const path = require('path');
const multer = require('multer');
const { exec } = require('child_process');
const fs = require('fs');
const os = require('os');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes to allow cross-origin requests
app.use(cors());

// Middleware to parse JSON body data
app.use(express.json());

// Set up multer for handling file uploads, storing files in the system's temp directory
const upload = multer({ dest: os.tmpdir() });

// Serve the static files from the React app when in production
app.use(express.static(path.join(__dirname, 'client/build')));

// Simple test endpoint to verify that the server is running
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working' });
});

// POST route to handle the conversion from SVG to STL
app.post('/convert-svg-to-stl', upload.single('svg'), (req, res) => {
  console.log('Received SVG file:', req.file);

  // Check if the uploaded file is empty
  if (!req.file || req.file.size === 0) {
    return res.status(400).send('Uploaded file is empty');
  }

  // Extract bead height from the request body
  const { beadHeight } = req.body;
  if (!beadHeight || isNaN(beadHeight)) {
    return res.status(400).send('Invalid bead height');
  }

  // Define file paths for SVG, SCAD, and STL files
  const svgFilePath = `${req.file.path}.svg`; // Rename file to have .svg extension
  const stlFilePath = path.join(os.tmpdir(), `${path.basename(svgFilePath, '.svg')}.stl`);
  const scadFilePath = path.join(os.tmpdir(), `${path.basename(svgFilePath, '.svg')}.scad`);

  // OpenSCAD code that will use the SVG and convert it to STL
  const scadContent = `
  /*[Hidden]*/
  $fn = 100;
  /* [Parameters] */
  Beads_Height = ${beadHeight};
  module perler_bead(){
      linear_extrude(height = Beads_Height, center = true)
          import("${svgFilePath}", scale=10);
  }
  perler_bead();
  `;

  console.log('SCAD file content:', scadContent);

  try {
    // Save the SCAD content to a file
    fs.writeFileSync(scadFilePath, scadContent);
    console.log('SCAD file created:', scadFilePath);
  } catch (error) {
    console.error('Error writing SCAD file:', error);
    return res.status(500).send('Error writing SCAD file');
  }

  // Rename the uploaded file to have a .svg extension
  fs.rename(req.file.path, svgFilePath, (err) => {
    if (err) {
      console.error('Error renaming SVG file:', err);
      return res.status(500).send('Error renaming SVG file');
    }

    console.log('Executing OpenSCAD command to convert SVG to STL...');
    // Execute the OpenSCAD command to convert the SCAD file to an STL file
    exec(`openscad -o ${stlFilePath} ${scadFilePath}`, (error, stdout, stderr) => {
      if (error) {
        console.error(`OpenSCAD error: ${error}`);
        console.error(`stdout: ${stdout}`);
        console.error(`stderr: ${stderr}`);
        return res.status(500).send('Error converting SVG to STL');
      }

      console.log('STL file created:', stlFilePath);

      // Send the generated STL file back to the client
      res.download(stlFilePath, (err) => {
        if (err) {
          console.error(`Error sending STL file: ${err}`);
          return res.status(500).send('Error sending STL file');
        }

        // Clean up the temporary files after the download
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

// Serve the React app for all other GET requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname + '/client/build/index.html'));
});

// Start the server and listen on the specified port
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
