'use strict';

const simpleOdf = require('simple-odf');
const {DOMImplementation,XMLSerializer, DOMParser} = require('xmldom');

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';

module.exports = function ConverterODT(Asciidoctor, {withXml}) {
  class ODTConverter {
    constructor(backend, opts) {
      this.basebackend = 'xml';
      this.outfilesuffix = '.odt';
      this.filetype = 'xml';
      this.htmlsyntax = 'xml';
      this._doc = new simpleOdf.TextDocument();
    }

    $convert(node, transform = null, opts = {}) {
      const {_doc: doc} = this;
      let document, root;

      switch (transform || node.node_name) {
        case 'document':
          node.getContent();
          document = new DOMImplementation().createDocument(
            'urn:oasis:names:tc:opendocument:xmlns:office:1.0',
            'office:document',
            null);
          root = document.firstChild;

          doc.toXml(document, root);

          if (typeof withXml === 'function') {
            withXml(document, DOMParser);
          }

          return `${XML_DECLARATION}

${new XMLSerializer().serializeToString(document).replace(/&amp;([^\s&])/g, '&$1')}`;

        case 'section':
          doc.addHeading(node.getTitle(), node.getLevel());
          doc.addParagraph(node.getContent());
          return '';
        // return ['#'.repeat(node.getLevel()) + ' ' + node.getTitle(), node.getContent()].join('\n\n');

        case 'paragraph':
          doc.addParagraph(node.getContent());
          return '';
        // return node.getContent().trim() + '\n';

        case 'inline_quoted':
        case 'inline_anchor':
        case 'inline_break':
          return node.text;

        case 'listing':
          return `----\n${node.getContent()}\n----\n\n`;

        case 'ulist':
          return node.getItems().map((d) => `* ${d.getText()}`) + '\n';

        case 'olist':
          return node.getItems().map((d) => `1. ${d.getText()}`) + '\n';

        default:
          return node.text ? node.text : node.getContent();
      }
    }
  }

  Asciidoctor.Converter.Factory.$register(new ODTConverter('odt'), ['odt']);
};
