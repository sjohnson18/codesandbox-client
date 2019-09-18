const glob = require('glob');
const SVGO = require('svgo');
const path = require('path');
const fs = require('fs-extra');
const prettier = require('prettier');
const camelCase = require('lodash.camelcase');
const upperFirst = require('lodash.upperfirst');

const svgo = new SVGO({});

const svgPaths = glob.sync('./svg/*');
const outputDir = './dist';
fs.ensureDirSync(outputDir);

const prettierOptions = { parser: 'babel', singleQuote: true };

/** Create dist/index.js */
const code = [
  `
    // This component is generated by the build script 🤖
    // Please don't modify this file.

    import React from 'react'
  `,
];

svgPaths.forEach((filepath, index) => {
  const source = fs.readFileSync(filepath, 'utf8');

  svgo
    .optimize(source, { filepath })
    .then(result => {
      const { name } = path.parse(filepath);
      code.push(getNamedExport(name, result.data));

      if (index === svgPaths.length - 1) {
        const contents = prettier.format(code.join('\n'), prettierOptions);
        fs.writeFileSync(path.join(outputDir, 'index.js'), contents, 'utf8');
      }
    })
    .catch(error => {
      console.log(filepath, error);
    });
});

/** Create individual Icon components */

// Do we even want these?

// svgPaths.forEach(filepath => {
//   const source = fs.readFileSync(filepath, 'utf8');
//
//   svgo
//     .optimize(source, { filepath })
//     .then(result => {
//       const { name } = path.parse(filepath);
//
//       const contents = prettier.format(
//         getComponentSource(result.data),
//         prettierOptions
//       );
//
//       fs.writeFileSync(path.join(outputDir, name + '.tsx'), contents, 'utf8');
//     })
//     .catch(error => {
//       console.log(filepath, error);
//     });
// });
//
// function getComponentSource(source) {
//   return `
//     // This component is generated by the build script 🤖
//     // Please don't modify this file.
//
//     import React from 'react'
//
//     const Icon = props => (
//       ${getSvg(source)}
//     )
//
//     export default Icon
//   `;
// }

function getNamedExport(name, source) {
  return `
    export const ${upperFirst(camelCase(name))} = props => (
      ${getSvg(source)}
    );
  `;
}

function getSvg(source) {
  // Get the contents of the optimized SVG
  // by trimming leading and tailing <svg> tags
  const content = source.slice(source.indexOf('>') + 1).slice(0, -6);

  // hardcoded width and height for Icons
  const size = 32;

  return `
    <svg
      width="${size}"
      height="${size}"
      xmlns="http://www.w3.org/2000/svg"
      {...props}
    >
      ${content}
    </svg>
  `;
}
