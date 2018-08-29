'use strict';

/* global Opal */

const {dirname, basename, join} = require('path');

const bookmark = (id) => {
  return id !== Opal.nil ? `<text:bookmark text:name="ref-${id}" />` : '';
};

module.exports = {
  document: ({node, styles}) => {
    return `<?xml version="1.0" encoding="UTF-8"?>
<office:document xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0" ${styles.attributes.join(' ')}>
  <office:meta>
    <meta:generator>asciidoctor-converter-opendocument</meta:generator>
    <dc:title>${node.getDocument().getDoctitle()}</dc:title>
    <meta:creation-date>${node.getDocument().getAttribute('docdatetime')}</meta:creation-date>
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
    <text:tracked-changes text:track-changes="true">
    </text:tracked-changes>
    <office:text>${node.getContent()}</office:text>
  </office:body>
</office:document>`;
  },

  section: ({node}) => {
    const style = node.getLevel() === 1 ? 'ChapitreTitre' : `TitreNiveau${node.getLevel()-1}`;
    let pre = '';
    let id = node.getId();
    const doc = node.getDocument();

    if (node.getLevel() === 1 && doc.hasAttribute('chapter-number')) {
      id = doc.getAttribute('chapterid');
      pre = `<text:p text:style-name="ChapitreNumero">${doc.getAttribute('chapter-number') || doc.getAttribute('appendix-number')}</text:p>`;
    }

    return `${bookmark(id)}${pre}<text:h text:style-name="${style}" text:outline-level="${node.getLevel()}">${node.getTitle()}</text:h>${node.getContent()}`;
  },
  paragraph: ({node}) => {
    const style = ['admonition', 'dlist'].includes(node.getParent().node_name) ? 'Remarque' : 'TexteCourant';

    return `${bookmark(node.getId())}<text:p text:style-name="${style}">${node.getContent().replace(/(<text:line-break\/>)\n/gm, '$1')}</text:p>`;
  },

  inline_quoted: ({node}) => {
    let pre = '';
    let post = '';
    let styleName = node.getRole() || node.getType();

    if (node.getType() === 'mark') {
      styleName = 'CodeExergue';
    }
    else if (node.getType() === 'monospaced' && node.getParent().node_name !== 'section') {
      styleName = 'CodeDansTexte';
    }
    else if (node.getType() === 'strong') {
      styleName = 'T7';
    }
    else if (node.getType() === 'emphasis') {
      styleName = 'T4';
    }
    else if (node.getRole() === 'line-through') {
      styleName = 'T8';
    }
    else if (node.getRole() === 'URL' && node.getParent().node_name === 'admonition') {
      styleName = 'RemarqueURL';
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
    let xref = '';
    let styleName = node.getRole();
    let tag = 'text:a';
    let text = node.getText();

    if (node.getType() === 'ref') {
      pre = bookmark(node.getId());
    }
    else if (node.getType() === 'xref') {
      const ref = node.getAttribute('fragment') ? node.getAttribute('fragment') : basename(dirname(node.getAttribute('path')));

      xref = ` xlink:href="#ref-${ref}"  text:visited-style-name="Visited_20_Internet_20_Link"`;
      styleName = 'Internet_20_link';
    }
    else if (node.getType() === 'link') {
      xref = ` xlink:href="${node.getTarget()}" text:visited-style-name="Visited_20_Internet_20_Link"`;
      styleName = 'Internet_20_link';
      text = node.getTarget();
    }

    if (text) {
      return `<${tag} xlink:type="simple" text:style-name="${styleName}"${xref}>${pre}${text}${post}</${tag}>`;
    }

    return `${pre}`;
  },

  inline_break: ({node}) => {
    return `${node.getText()}<text:line-break/>`;
  },

  inline_kbd: ({node}) => {
    return `<text:span text:style-name="Menu">[${node.getAttribute('keys').join('+')}]</text:span>`;
  },

  inline_button: ({node}) => {
    return `<text:span text:style-name="CodeDansTexte">${node.getText()}</text:span>`;
  },

  inline_menu: ({node}) => {
    //todo take care of node.getAttribute('submenus') (an array of strings)
    return `<text:span text:style-name="Menu">${node.getAttribute('menu')} / ${node.getAttribute('menuitem')}</text:span>`;
  },

  listing: ({node}) => {
    let title = '';
    const styleName = node.getParent().node_name === 'admonition' ? 'RemarqueCode' : 'Code';

    if (node.getTitle()) {
      const styleName = node.getParent().node_name === 'admonition' ? 'Remarque' : 'CodeTitre';
      title = `${bookmark(node.getId())}<text:p text:style-name="${styleName}">${node.getCaptionedTitle()}</text:p>`;
    }

    const code = node.getContent().split('\n').map(line => {
      return `<text:p text:style-name="${styleName}">${line.replace(/&&/g, '&amp;&amp;').replace(/(\s{2,})/g, (m, chars) => `<text:s text:c="${chars.length}"/>`)}</text:p>`;
    }).join('');

    return `${title}${code}`;
  },

  ulist: ({node}) => {
    const styleName = ['admonition', 'dlist'].includes(node.getParent().node_name) ? 'RemarquePuce' : 'ListeANumero';

    const items = node.getItems().map(item => `<text:list-item>
<text:p text:style-name="${styleName}">${item.getText()}</text:p>
</text:list-item>`).join('');

    return `${bookmark(node.getId())}<text:list text:style-name="List_20_1">${items}</text:list>`;
  },

  olist: ({node}) => {
    const styleName = ['admonition', 'dlist'].includes(node.getParent().node_name) ? 'RemarqueNumero' : 'ListeANumero';

    return node.getItems().map((item, i) => `<text:p text:style-name="${styleName}">${i+1}.<text:tab/>${item.getText()}</text:p>`).join('');
  },

  dlist: ({node}) => {
    return node.getItems().map(([terms, defs], type) => {
      const text = !defs.getBlocks().length ? defs.getText() : '';
      const blocks = defs.getBlocks().length ? defs.getContent() : '';

      return `${bookmark(node.getId())}<text:h text:style-name="RemarqueTitre">${terms.map(d => d.getText()).join(', ')}</text:h>
<text:p text:style-name="Remarque">${text}</text:p>${blocks}`;
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
      pre = `${bookmark(node.getId())}<text:h text:style-name="RemarqueTitre" text:outline-level="7">${node.getTitle()}</text:h>`;
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
    const uri = join(node.getDocument().getAttribute('chapterid'), node.getAttribute('target'));
    const caption = node.getTitle() ? `<text:p text:style-name="RemarqueFigureLegende">${node.getCaptionedTitle()}</text:p>` : '';

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
    let caption = '';
    let header = '';

    if (node.getTitle()) {
      caption = `<text:p text:style-name="TableauTitre">${node.getCaptionedTitle()}</text:p>`;
    }

    if (node.rows.head.length) {
      const cols = node.rows.head[0].map((cell) => {
        return `<table:table-cell table:style-name="TableauTitreColonne" office:value-type="string">${cell.$content().indexOf('<text:p') === 0 ? cell.$content() : `<text:p>${cell.$content()}</text:p>`}</table:table-cell>`;
      });

      header = `${cols.map(d => '<table:table-column />')}<table:table-row>${cols.join('')}</table:table-row>`;
    }


    const rows = node.rows.body.map(row => {
      const cols = row.map((cell, i) => {
        return `<table:table-cell table:style-name="TableauCorps" office:value-type="string">${cell.$content().indexOf('<text:p') === 0 ? cell.$content().toString() : `<text:p>${cell.$content()}</text:p>`}</table:table-cell>`;
      }).join('');

      return `<table:table-row>${cols}</table:table-row>`;
    });

    return `${bookmark(node.getId())}${caption}<table:table table:style-name="Tableau1">${header}${rows.join('')}</table:table>`;
  },

  embedded: ({node}) => node.getContent(),

  thematic_break: () => {
    return '<text:p text:style-name="Horizontal_20_Line"/>';
  },

  inline_indexterm: ({node}) => node.getText(),
};
