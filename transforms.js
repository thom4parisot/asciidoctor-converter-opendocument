'use strict';

const XML_DECLARATION = '<?xml version="1.0" encoding="UTF-8"?>';

module.exports = {
  document: ({node, styles}) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" ${styles.attributes.join(' ')}>
  <office:meta>
    <meta:generator>asciidoctor-converter-opendocument</meta:generator>
    <dc:title>${node.getDocument().getDoctitle()}</dc:title>
    <meta:creation-date>${node.getDocument().getRevisionDate()}</meta:creation-date>
    <dc:language>${node.getDocument().getAttribute('lang')}</dc:language>
    <meta:editing-cycles>1</meta:editing-cycles>
    <meta:editing-duration>P0D</meta:editing-duration>
    <meta:document-statistic meta:character-count="10290" meta:image-count="0" meta:non-whitespace-character-count="8743" meta:object-count="0" meta:page-count="7" meta:paragraph-count="143" meta:table-count="1" meta:word-count="1658"/>
    <meta:user-defined meta:name="Info 1"/>
    <meta:user-defined meta:name="Info 2"/>
    <meta:user-defined meta:name="Info 3"/>
    <meta:user-defined meta:name="Info 4"/>
  </office:meta>
  ${styles.settings}
  ${styles.scripts}
  ${styles.fonts}
  ${styles.styles}
  <office:body>
    <office:text>${node.getContent()}</office:text>
  </office:body>
</office:document>`;
  },

  section: ({node}) => {
    const style = node.getLevel() === 1 ? 'ChapitreTitre': `TitreNiveau${node.getLevel()-1}`;
    return `<text:h text:style-name="${style}" text:outline-level="${node.getLevel()}">${node.getTitle()}</text:h>${node.getContent()}`;
    // return ['#'.repeat(node.getLevel()) + ' ' + node.getTitle(), node.getContent()].join('\n\n');
  },
  paragraph: ({node}) => {
    const style = node.getParent().node_name === 'admonition' ? 'Remarque' : 'TexteCourant';

    return `<text:p text:style-name="${style}">${node.getContent().trim()}</text:p>`;
  },

  inline_quoted: ({node}) => {
    let pre = '';
    let post = '';

    if (node.getRole() === 'bare') {
      pre = '<![CDATA[';
      post = ']]>';
    }

    return `<text:span text:style-name="${node.getRole() || node.getType()}">${pre}${node.getText()}${post}</text:span>`;
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
    return `${node.getText().trim()}<text:line-break/>`;
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
    const code = node.getSourceLines().map(line => `<text:p text:style-name="Code"><![CDATA[${line}]]></text:p>`).join('');

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
    return '';
  },

  colist: ({node}) => {
    return '';
  },

  admonition: ({node}) => {
    return `<text:h text:style-name="RemarqueTitre" text:outline-level="7">${node.getTitle()}</text:h>${node.getContent()}`;
  },

  example: ({node}) => {
    return '';
  },

  open: ({node}) => {
    return `<text:p text:style-name="ChapitreIntroduction">${node.getContent()}</text:p>`;
  },

  image: ({node}) => {
    const uri = node.getImageUri(node.getAttribute('target'));

    return `<text:p text:style-name="RemarqueFigureNumero">(${uri})</text:p>
    <text:p text:style-name="RemarqueFigureLegende">${node.getTitle()}</text:p>`;
  },

  table: ({node}) => {
    return '';
  },

  thematic_break: ({node}) => {
    return '<text:p text:style-name="Horizontal_20_Line"/>';
  },
};
