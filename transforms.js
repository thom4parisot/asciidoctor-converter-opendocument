'use strict';

module.exports = {
  document: ({node, styles}) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" ${styles.attributes.join(' ')}>
  <office:meta>
    <meta:generator>asciidoctor-converter-opendocument</meta:generator>
    <dc:title>${node.getDocument().getDoctitle()}</dc:title>
    <meta:creation-date>${node.getDocument().getRevdate()}</meta:creation-date>
    <dc:language>${node.getDocument().getAttribute('lang')}</dc:language>
    <meta:editing-cycles>1</meta:editing-cycles>
    <meta:editing-duration>P0D</meta:editing-duration>
    <meta:document-statistic meta:character-count="0" meta:image-count="0" meta:non-whitespace-character-count="0" meta:object-count="0" meta:page-count="0" meta:paragraph-count="0" meta:table-count="0" meta:word-count="0"/>
    <meta:user-defined meta:name="Info 1"/>
    <meta:user-defined meta:name="Info 2"/>
    <meta:user-defined meta:name="Info 3"/>
    <meta:user-defined meta:name="Info 4"/>
  </office:meta>
  ${styles.settings || ''}
  ${styles.scripts || ''}
  ${styles.fonts || ''}
  ${styles.styles || ''}
  <office:body>
    <office:text>${node.getContent()}</office:text>
  </office:body>
</office:document>`;
  },

  section: ({node}) => {
    const style = node.getLevel() === 1 ? 'ChapitreTitre' : `TitreNiveau${node.getLevel()-1}`;
    let pre = '';

    if (node.getLevel() === 1 && node.getDocument().hasAttribute('chapternumber')) {
      pre = `<text:p text:style-name="ChapitreNumero">${node.getDocument().getAttribute('chapternumber')}</text:p>`;
    }

    return `${pre}<text:h text:style-name="${style}" text:outline-level="${node.getLevel()}">${node.getTitle()}</text:h>${node.getContent()}`;
  },
  paragraph: ({node}) => {
    const style = node.getParent().node_name === 'admonition' ? 'Remarque' : 'TexteCourant';

    return `<text:p text:style-name="${style}">${node.getContent().replace(/(<text:line-break\/>)\n/gm, '$1')}</text:p>`;
  },

  inline_quoted: ({node}) => {
    let pre = '';
    let post = '';
    let styleName = node.getRole() || node.getType();

    if (node.getType() === 'mark') {
      styleName = 'CodeExergue';
    }
    else if (node.getType() === 'monospaced') {
      styleName = 'CodeDansTexte';
    }
    else if (node.getRole() === 'bare') {
      pre = '<![CDATA[';
      post = ']]>';
      styleName = 'CodeDansTexte';
    }

    return `<text:span text:style-name="${styleName}">${pre}${node.getText()}${post}</text:span>`;
  },

  inline_anchor: ({node}) => {
    // node.type xref, ref, link
    let pre = '';
    let post = '';

    if (node.getRole() === 'bare') {
      pre = '<![CDATA[';
      post = ']]>';
    }
    return `<text:span text:style-name="${node.getRole()}">${pre}${node.getText()}${post}</text:span>`;
  },

  inline_break: ({node}) => {
    return `${node.getText()}<text:line-break/>`;
  },

  inline_kbd: ({node}) => {
    return `<text:span text:style-name="CodeDansTexte">${node.getText()}</text:span>`;
  },

  inline_button: ({node}) => {
    return `<text:span text:style-name="CodeDansTexte">${node.getText()}</text:span>`;
  },

  listing: ({node}) => {
    let title = '';

    if (node.getTitle()) {
      title = `<text:p text:style-name="CodeTitre">${node.getTitle()}</text:p>`;
    }

    const code = node.getContent().split('\n').map(line => {
      return `<text:p text:style-name="Code">${line.replace(/&&/g, '&amp;&amp;').replace(/(^\s+|\s+(<text:span))/g, (m, chars, after) => `<text:s text:c="${chars.length}"/>${after || ''}`)}</text:p>`;
    }).join('');

    return `${title}${code}`;
  },

  ulist: ({node}) => {
    const items = node.getItems().map(item => `<text:list-item>
<text:p text:style-name="ListeAPuce">${item.getText()}</text:p>
</text:list-item>`).join('');

    return `<text:list text:style-name="List_20_1">${items}</text:list>`;
  },

  olist: ({node}) => {
    return node.getItems().map((item, i) => `<text:p text:style-name="ListeANumero">${i+1}.<text:tab/>${item.getText()}</text:p>`).join('');
  },

  dlist: ({node}) => {
    return node.getItems().map(([terms, defs], type) => {
      const text = !defs.getBlocks().length ? `<text:line-break/><text:tab/>${defs.getText()}` : '';
      const blocks = defs.getBlocks().length ? defs.getContent() : '';

      return `<text:p text:style-name="TexteCourant">
<text:span text:style-name="T7"><text:tab/>${terms.map(d => d.getText()).join(', ')}</text:span>${text}</text:p>${blocks}`;
    }).join('');
  },

  inline_callout: ({node}) => {
    return `<text:span text:style-name="PuceCode">${node.getText()}</text:span>`;
  },

  colist: ({node}) => {
    const items = node.getItems().map((item, i) => {
      return `<text:span text:style-name="PuceCode">${i+1}</text:span> ${item.getText()}<text:line-break/>`;
    }).join('');

    return `<text:p text:style-name="TexteCourant">${items}</text:p>`;
  },

  admonition: ({node}) => {
    let pre = '';

    if (node.getTitle()) {
      pre = `<text:h text:style-name="RemarqueTitre" text:outline-level="7">${node.getTitle()}</text:h>`;
    }

    return `${pre}${node.getContent()}`;
  },

  example: ({node}) => {
    return node.getContent();
  },

  open: ({node}) => {
    return `<text:p text:style-name="ChapitreIntroduction">${node.getContent()}</text:p>`;
  },

  image: ({node}) => {
    const uri = node.getImageUri(node.getAttribute('target'));
    const caption = node.getTitle() ? `<text:p text:style-name="RemarqueFigureLegende">${node.getTitle()}</text:p>` : '';

    return `<text:p text:style-name="RemarqueFigureNumero">(${uri})</text:p>${caption}`;
  },

  preamble: ({node}) => {
    const label = node.getDocument().getAttribute('toc-title');

    return `<text:table-of-content text:style-name="Sect1" text:protected="true" text:name="Table des matières1">
  <text:index-body>
    <text:index-title text:style-name="Sect1" text:name="${label}_Head">
      <text:p text:style-name="P12">${label}</text:p>
    </text:index-title>
  </text:index-body>
</text:table-of-content>`;
  },

  table: ({node}) => {
    return '';
  },

  thematic_break: ({node}) => {
    return '<text:p text:style-name="Horizontal_20_Line"/>';
  },
};
