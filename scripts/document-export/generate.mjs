import { readFile, writeFile } from 'node:fs/promises';
import {
    AlignmentType,
    Document,
    Footer,
    Packer,
    PageNumber,
    PageOrientation,
    Paragraph,
    TextRun,
} from 'docx';
import { documentBlocks } from './blocks.mjs';
import { firstTextDirection } from './inline.mjs';
import { DocumentMedia } from './media.mjs';

const [inputPath, outputPath] = process.argv.slice(2);
const input = JSON.parse(await readFile(inputPath, 'utf8'));
const portrait =
    input.paper === 'letter'
        ? { width: 12240, height: 15840 }
        : { width: 11906, height: 16838 };
const landscape = input.orientation === 'landscape';
const width = ((landscape ? portrait.height : portrait.width) - 2880) / 15;
const height = ((landscape ? portrait.width : portrait.height) - 2880) / 15;
const numberingDefinitions = [];
const children = await documentBlocks(input.body, {
    width,
    height: height - 40,
    numberingDefinitions,
    media: new DocumentMedia(input.diagrams),
    direction: 'auto',
});
const titleRtl = firstTextDirection(input.title) === 'rtl';
children.unshift(
    new Paragraph({
        heading: 'Title',
        bidirectional: titleRtl,
        alignment: titleRtl ? AlignmentType.RIGHT : AlignmentType.LEFT,
        keepNext: true,
        children: [new TextRun({ text: input.title, rightToLeft: titleRtl })],
    }),
);
const headingStyle = (size) => ({
    run: { font: 'Liberation Sans', size, color: '202124', bold: true },
    paragraph: {
        spacing: { before: 260, after: 120 },
        keepNext: true,
        keepLines: true,
    },
});
const document = new Document({
    creator: 'Orbium',
    title: input.title,
    styles: {
        default: {
            document: {
                run: {
                    font: {
                        ascii: 'Liberation Sans',
                        hAnsi: 'Liberation Sans',
                        cs: 'Noto Sans Arabic',
                    },
                    size: 22,
                    color: '202124',
                },
                paragraph: {
                    spacing: { after: 140, line: 276 },
                    widowControl: true,
                },
            },
            title: {
                run: {
                    font: 'Liberation Sans',
                    size: 44,
                    color: '202124',
                    bold: true,
                },
                paragraph: { spacing: { after: 300 }, keepNext: true },
            },
            heading1: headingStyle(32),
            heading2: headingStyle(28),
            heading3: headingStyle(24),
            heading4: headingStyle(22),
            heading5: headingStyle(22),
            heading6: headingStyle(22),
        },
    },
    numbering: { config: numberingDefinitions },
    sections: [
        {
            properties: {
                page: {
                    size: {
                        ...portrait,
                        orientation: landscape
                            ? PageOrientation.LANDSCAPE
                            : PageOrientation.PORTRAIT,
                    },
                    margin: {
                        top: 1440,
                        right: 1440,
                        bottom: 1440,
                        left: 1440,
                    },
                },
            },
            ...(input.page_numbers
                ? {
                      footers: {
                          default: new Footer({
                              children: [
                                  new Paragraph({
                                      alignment: AlignmentType.CENTER,
                                      children: [
                                          new TextRun({
                                              children: [PageNumber.CURRENT],
                                              size: 18,
                                              color: '6B7280',
                                          }),
                                      ],
                                  }),
                              ],
                          }),
                      },
                  }
                : {}),
            children,
        },
    ],
});
await writeFile(outputPath, await Packer.toBuffer(document));
