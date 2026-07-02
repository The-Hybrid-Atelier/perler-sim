# Beadle

> **Repository name:** `perler-sim` (legacy repository name retained for compatibility).

**Beadle** is an open-source computer-aided design (CAD) toolkit for designing modular fuse bead artwork and generating fabrication-ready 3D models. The software enables makers, educators, researchers, and designers to rapidly prototype fuse bead assemblies through an interactive browser-based interface with STL export for additive manufacturing.

Developed by [**The Hybrid Atelier**](https://hybridatelier.uta.edu/) in the Department of Computer Science and Engineering at **The University of Texas at Arlington**, Beadle accompanies our research on computational fabrication, digital craft, and creativity support tools.

---

## Authors

* [Mariah Gardner](https://hybridatelier.uta.edu/members/180-mariah-gardner)
* [Nasir Rakib](https://hybridatelier.uta.edu/members/128-nasir-rakib)
* [Cesar Torres](https://hybridatelier.uta.edu/members/1-cesar-torres)

---

## Features

* Interactive editor for creating fuse bead designs
* Parametric modeling of bead assemblies
* Real-time visual editing
* STL export for 3D printing
* Browser-based interface built with React

---

## Installation

Clone the repository:

```bash
git clone https://github.com/<YOUR_ORG>/perler-sim.git
cd perler-sim
```

Install dependencies:

```bash
npm install
```

Start the development server:

```bash
npm start
```

The application will be available at:

```text
http://localhost:3000
```

---

## Building

Create an optimized production build:

```bash
npm run build
```

The compiled application will be generated in the `build/` directory.

---

## Usage

1. Launch the application.
2. Create or edit a fuse bead design using the interactive editor.
3. Inspect the generated geometry.
4. Export the design as an STL file.
5. Slice the model using your preferred slicer.
6. Fabricate using a compatible 3D printer.

---

## Research

Beadle was developed as part of ongoing research into computational fabrication, digital craft, and creativity support technologies.

If you use Beadle in academic work, please cite the accompanying publication.

```bibtex
% Citation will be added after publication.
```

---

## Contributing

We welcome contributions of community-made designs! You can either submit a pull request via Github or send us a link to your Instructables, Thingiverse, or design files to hybrid.atelier.uta@gmail.com

If you encounter a bug, discover an issue, or have a feature request, please open a GitHub Issue. Pull requests are also appreciated.

Before submitting a pull request, please ensure that:

* New functionality is documented.
* Existing functionality continues to work as expected.
* Code follows the project's existing style.

---

## Development

This project is built with:

* React
* Node.js
* npm

Useful commands:

```bash
# Start development server
npm start

# Run tests
npm test

# Create production build
npm run build
```

---

## License

This project is released under the MIT License. See the `LICENSE` file for details.

---

## Acknowledgments

Beadle was developed within **The Hybrid Atelier** at **The University of Texas at Arlington**. This work was supported by the i-Engage program, the National
Science Foundation under Grant No. CNS-2150321, and a Microsoft Research Accelerating Foundational Models Grant.
