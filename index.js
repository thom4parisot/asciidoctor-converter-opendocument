'use strict';

const transforms = require('./transforms.js');

module.exports = function ConverterODT(Asciidoctor, {styles}) {
  class ODTConverter {
    constructor(backend, opts) {
      this.basebackend = 'xml';
      this.outfilesuffix = '.odt';
      this.filetype = 'xml';
      this.htmlsyntax = 'xml';
    }

    $convert(node, transform = null, opts = {}) {
      const operation = transforms[transform || node.node_name];

      if (!operation) {
        throw new Error(`${operation} operation does not exist. (${transform}, ${node.node_name}, ${node.context})`);
      }

      return operation({ node, styles });
    }
  }

  Asciidoctor.ConverterFactory.register(new ODTConverter('odt'), ['odt']);
};
